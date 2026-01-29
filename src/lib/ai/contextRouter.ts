import { promises as fs } from 'fs';
import path from 'path';
import {
    MAX_CONTEXT_TOKENS,
    estimateTokens,
    truncateToTokenLimit,
    logTokenUsage,
} from './tokenUtils';

export type IntentType = 'INJURY' | 'PROGRESS' | 'LOGISTICS' | 'GENERAL';

export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
}

export interface ContextPayload {
    intent: IntentType;
    systemPromptAdditions: string;
    suggestedTools: string[];
    tokenEstimate: number;
}

// Intent Classification Logic
const KEYWORDS = {
    INJURY: [
        'hurt', 'pain', 'ache', 'injury', 'sore', 'swollen', 'tweak', 'snap', 'popped',
        'dizzy', 'faint', 'sick', 'ill', 'fever', 'click', 'pinch', 'sub', 'substitute',
        'alternative', 'can i do', 'instead of', 'regression'
    ],
    PROGRESS: [
        'progress', 'trend', 'history', 'log', 'record', 'stats', 'data', 'biometric',
        'sleep', 'hrv', 'resting heart rate', 'weight', 'pr', 'max', 'faster', 'stronger',
        'last time', 'compare', 'analysis'
    ],
    LOGISTICS: [
        'today', 'tomorrow', 'schedule', 'plan', 'routine', 'what do i do', 'warmup',
        'workout', 'superset', 'reps', 'sets', 'rest'
    ],
    CONTINUATION: [
        'more', 'next', 'why', 'else', 'option', 'alternative', 'another', 'explain',
        'tell me', 'how come', 'what about', 'regression'
    ]
};

/**
 * Heuristic keyword scoring for a single message.
 */
function calculateIntent(content: string): IntentType {
    const text = content.toLowerCase();

    // 1. Safety/Injury checks (Highest Priority)
    if (KEYWORDS.INJURY.some(k => text.includes(k))) {
        return 'INJURY';
    }

    // 2. Score other categories
    let progressScore = 0;
    let logisticsScore = 0;

    KEYWORDS.PROGRESS.forEach(k => { if (text.includes(k)) progressScore++; });
    KEYWORDS.LOGISTICS.forEach(k => { if (text.includes(k)) logisticsScore++; });

    if (progressScore > 0 && progressScore >= logisticsScore) return 'PROGRESS';
    if (logisticsScore > 0 && logisticsScore > progressScore) return 'LOGISTICS';

    return 'GENERAL';
}

/**
 * Detects the user's intent based on the conversational history.
 * Handles "Conversational Continuations" by carrying over previous intent.
 */
export function detectIntent(messages: Message[]): IntentType {
    if (!messages || messages.length === 0) return 'GENERAL';

    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'GENERAL';

    const lastUserMessage = userMessages[userMessages.length - 1].content;
    const currentIntent = calculateIntent(lastUserMessage);

    // If current intent is GENERAL, check if it's a follow-up to a previous specific intent
    if (currentIntent === 'GENERAL') {
        const text = lastUserMessage.toLowerCase();
        const isFollowUp = KEYWORDS.CONTINUATION.some(k => text.includes(k)) || text.length < 20;

        if (isFollowUp && userMessages.length > 1) {
            // Traverse backwards through user messages to find the last specific intent
            for (let i = userMessages.length - 2; i >= 0; i--) {
                const prevIntent = calculateIntent(userMessages[i].content);
                if (prevIntent !== 'GENERAL') {
                    console.log(`[ContextRouter] Carry-over intent detected: ${prevIntent} (from follow-up: "${text}")`);
                    return prevIntent;
                }
            }
        }
    }

    return currentIntent;
}

/**
 * Extracts a specific section from the Master Plan Markdown.
 * Improved to handle both #### DAY and * **DAY** formats.
 */
function extractSection(markdown: string, sectionHeader: string): string {
    // Escape special characters for regex but allow for flexibility in prefixing
    const escapedHeader = sectionHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match #### HEADER or * **HEADER** or ### HEADER
    const regex = new RegExp(`(?:#{1,4}|\\*\\s\\*\\*)\\s*${escapedHeader}[\\s\\S]*?(?=(?:#{1,4}\\s|\\*\\s\\*\\*|\\Z))`, 'i');
    const match = markdown.match(regex);
    return match ? match[0].trim() : '';
}

/**
 * Extracts just the exercise list from a daily routine for compact representation
 */
function extractExerciseList(dailyContent: string): string {
    // Extract lines that look like exercises (start with - or *)
    const lines = dailyContent.split('\n');
    const exercises = lines.filter(line => {
        const trimmed = line.trim();
        return trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
    });

    if (exercises.length > 0) {
        return exercises.slice(0, 10).join('\n'); // Limit to first 10 exercises
    }

    // Fallback: just return first 500 chars
    return dailyContent.substring(0, 500);
}

/**
 * Creates a compact phase summary for general queries
 */
function createPhaseSummary(phaseContent: string): string {
    // Extract phase name/title
    const titleMatch = phaseContent.match(/## PHASE \d+[^\n]*/i);
    const title = titleMatch ? titleMatch[0] : 'Current Phase';

    // Extract goals if present
    const goalsMatch = phaseContent.match(/(?:goals?|objectives?|focus)[:\s]*([^\n]+)/i);
    const goals = goalsMatch ? goalsMatch[1].trim() : '';

    // Extract day headers for schedule overview
    const dayHeaders = phaseContent.match(/#{3,4}\s*(MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)[^\n]*/gi) || [];
    const schedule = dayHeaders.slice(0, 7).map(h => h.replace(/^#+\s*/, '')).join(', ');

    return [
        title,
        goals ? `Goals: ${goals}` : '',
        schedule ? `Schedule: ${schedule}` : '',
    ].filter(Boolean).join('\n');
}

/**
 * Builds the dynamic context based on Intent and User State
 */
export async function buildDynamicContext(
    intent: IntentType,
    currentPhase: number,
    currentWeek: number,
    messages: Message[],
    providedUserDay?: string
): Promise<ContextPayload> {

    const planPath = path.join(process.cwd(), 'docs', 'routine_master_plan.md');
    let masterPlan = '';
    try {
        masterPlan = await fs.readFile(planPath, 'utf-8');
    } catch (e) {
        console.error('[ContextRouter] Failed to load Master Plan', e);
        return {
            intent: 'GENERAL',
            systemPromptAdditions: '',
            suggestedTools: [],
            tokenEstimate: 0
        };
    }

    // Get Current Day
    const today = (providedUserDay || new Date().toLocaleDateString('en-US', { weekday: 'long' })).toUpperCase();

    // Phase extraction logic
    let targetPhase = currentPhase;
    // Phase 5 Special Logic: Re-entry to Phase 1 for non-testing weeks
    if (currentPhase === 5) {
        const TESTING_WEEKS = [37, 44, 51];
        if (!TESTING_WEEKS.includes(currentWeek)) {
            targetPhase = 1;
            console.log(`[ContextRouter] Phase 5 Re-entry detected for week ${currentWeek}. Redirecting to Phase 1 context.`);
        }
    }

    // Phase content extraction
    const phaseRegex = new RegExp(`(## PHASE ${targetPhase}[\\s\\S]*?)(?=## PHASE \\d|$)`, 'i');
    const phaseMatch = masterPlan.match(phaseRegex);
    const fullPhaseContent = phaseMatch ? phaseMatch[1] : '';

    // EXTRACT CORE ROUTINE (PERMANENT KNOWLEDGE)
    const dailyRoutineRaw = extractSection(fullPhaseContent, today);
    const coreRoutineSnippet = dailyRoutineRaw
        ? `### CORE ROUTINE - ${today} (Week ${currentWeek}, Phase ${currentPhase})\n${truncateToTokenLimit(extractExerciseList(dailyRoutineRaw), 500)}`
        : `### STATUS - ${today} (Week ${currentWeek}, Phase ${currentPhase})\nRest or recovery focused day.`;

    // EXTRACT RECENTLY DISCUSSED EXERCISES
    const lastAssistantMessages = messages
        .filter(m => m.role === 'assistant')
        .slice(-2)
        .map(m => m.content)
        .join('\n');

    // Simple heuristic to extract exercise-like lines from recent history
    const recentExercises = lastAssistantMessages.split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
        .slice(-5)
        .join('\n');

    const contextBuffer = recentExercises
        ? `\n### RECENTLY DISCUSSED EXERCISES\n${recentExercises}\n`
        : '';

    let specificContext = '';
    let tools: string[] = [];

    // Token budget per intent type (tokens)
    const TOKEN_BUDGETS = {
        INJURY: 1500,      // Need more context for safety
        LOGISTICS: 800,    // Just today's workout
        PROGRESS: 1000,    // Analysis context
        GENERAL: 600,      // Minimal context
    };

    switch (intent) {
        case 'INJURY':
            // SAFETY MODE: More context allowed but still limited
            const injuryContext = `
*** URGENT: USER REPORTED POTENTIAL INJURY OR MODIFICATION REQUEST ***

Current Week: ${currentWeek}, Phase: ${currentPhase}

INSTRUCTION:
- Prioritize pain management and longevity.
- Suggest regressions or distinct alternatives.
- Do not push through sharp pain.
- Ask clarifying questions about the pain location and intensity.

EXERCISES IN CURRENT PHASE:
${truncateToTokenLimit(fullPhaseContent, TOKEN_BUDGETS.INJURY)}
`;
            specificContext = injuryContext;
            tools = ['getRecentLogs'];
            break;

        case 'LOGISTICS':
            // MOST OPTIMIZED: Just today's routine
            const dailyRoutine = extractSection(fullPhaseContent, today);

            if (dailyRoutine) {
                const exerciseList = extractExerciseList(dailyRoutine);
                specificContext = `
*** TODAY'S WORKOUT (${today}) - Week ${currentWeek}, Phase ${currentPhase} ***

${truncateToTokenLimit(exerciseList, TOKEN_BUDGETS.LOGISTICS)}

INSTRUCTION:
- Explain the workout details above.
- Provide warmup tips if asked.
- Clarify RPE/percentages if asked.
`;
            } else {
                // Rest day or no specific routine
                specificContext = `
*** ${today} - Week ${currentWeek}, Phase ${currentPhase} ***

No specific routine found for today. This may be a rest or recovery day.

INSTRUCTION:
- Confirm if today is a scheduled rest day.
- Suggest recovery activities if appropriate.
`;
            }
            break;

        case 'PROGRESS':
            // ANALYTIC MODE: Summary + progression logic
            const progressionLogic = extractSection(fullPhaseContent, '### Phase [0-9]+ Progression');
            const checkpointInfo = extractSection(fullPhaseContent, '### Week [0-9]+ Checkpoint');

            specificContext = `
*** PROGRESS & ANALYTICS - Week ${currentWeek}, Phase ${currentPhase} ***

${truncateToTokenLimit(progressionLogic || 'Focus on consistent improvement.', 400)}

${truncateToTokenLimit(checkpointInfo || '', 300)}

INSTRUCTION:
- Use the tools to get actual data before answering.
- Analyze trends in the user's logs.
- Compare against prescribed targets.
- Check compliance with the program.
`;
            tools = ['getRecentLogs', 'getBiometrics'];
            break;

        case 'GENERAL':
        default:
            // MINIMAL CONTEXT: Just phase summary
            const phaseSummary = createPhaseSummary(fullPhaseContent);
            specificContext = `
*** CURRENT PHASE OVERVIEW - Week ${currentWeek}, Phase ${currentPhase} ***

${phaseSummary}

INSTRUCTION:
- Answer general questions about the training program.
- Use tools if the user asks about their data.
`;
            tools = ['getBiometrics'];
            break;
    }

    // Build final context
    const systemPromptAdditions = `
${coreRoutineSnippet}
${contextBuffer}

${specificContext}
`.trim();

    // Log token usage
    const tokenEstimate = estimateTokens(systemPromptAdditions);
    logTokenUsage(`context_${intent}`, tokenEstimate, MAX_CONTEXT_TOKENS);

    return {
        intent,
        systemPromptAdditions,
        suggestedTools: tools,
        tokenEstimate
    };
}
