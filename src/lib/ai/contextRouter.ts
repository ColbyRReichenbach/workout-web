import {
    MAX_CONTEXT_TOKENS,
    estimateTokens,
    truncateToTokenLimit,
    logTokenUsage,
} from './tokenUtils';
import { calculateWorkingSet } from '../calculations/percentages';
import { parseWorkoutTemplate } from '../calculations/paceZones';
import { UserProfile, WorkoutSegment } from '../types';

export type IntentType = 'INJURY' | 'PROGRESS' | 'LOGISTICS' | 'GENERAL';

export interface Message {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content?: string | any[];
    parts?: any[];
}

/**
 * Safely extracts text content from a message, handling both string and array-of-parts formats.
 */
function extractMessageContent(message: Message | any): string {
    if (!message) return '';
    if (typeof message.content === 'string') return message.content;

    if (Array.isArray(message.content)) {
        return message.content
            .map((p: any) => {
                if (typeof p === 'string') return p;
                if (p.type === 'text' && typeof p.text === 'string') return p.text;
                return '';
            })
            .filter(Boolean)
            .join('\n');
    }

    if (message.parts && Array.isArray(message.parts)) {
        return message.parts
            .map((p: any) => {
                if (p.type === 'text' && typeof p.text === 'string') return p.text;
                if (p.type === 'reasoning' && typeof p.reasoning === 'string') return p.reasoning;
                return '';
            })
            .filter(Boolean)
            .join('\n');
    }

    return '';
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

function calculateIntent(content: any): IntentType {
    const text = (typeof content === 'string' ? content : extractMessageContent({ content })).toLowerCase();
    if (!text) return 'GENERAL';

    if (KEYWORDS.INJURY.some(k => text.includes(k))) return 'INJURY';

    let progressScore = 0;
    let logisticsScore = 0;

    KEYWORDS.PROGRESS.forEach(k => { if (text.includes(k)) progressScore++; });
    KEYWORDS.LOGISTICS.forEach(k => { if (text.includes(k)) logisticsScore++; });

    if (progressScore > 0 && progressScore >= logisticsScore) return 'PROGRESS';
    if (logisticsScore > 0 && logisticsScore > progressScore) return 'LOGISTICS';

    return 'GENERAL';
}

export function detectIntent(messages: Message[]): IntentType {
    if (!messages || messages.length === 0) return 'GENERAL';
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'GENERAL';

    const lastUserMessage = userMessages[userMessages.length - 1];
    const lastUserContent = extractMessageContent(lastUserMessage);
    const currentIntent = calculateIntent(lastUserContent);

    if (currentIntent === 'GENERAL') {
        const text = lastUserContent.toLowerCase();
        const isFollowUp = KEYWORDS.CONTINUATION.some(k => text.includes(k)) || text.length < 20;

        if (isFollowUp && userMessages.length > 1) {
            for (let i = userMessages.length - 2; i >= 0; i--) {
                const prevContent = extractMessageContent(userMessages[i]);
                const prevIntent = calculateIntent(prevContent);
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
 * Compresses the full segment array into a high-density, token-efficient string
 */
export function formatSegmentsForAI(segments: WorkoutSegment[], profile: UserProfile | undefined): string {
    if (!segments || segments.length === 0) return "No exercises scheduled.";

    return segments.map((s, idx) => {
        let text = `${idx + 1}. ${s.name} (${s.type})`;
        if (s.target) {
            const targetStrs = [];
            if (s.target.sets && s.target.reps) targetStrs.push(`${s.target.sets}x${s.target.reps}`);
            else if (s.target.duration_min) targetStrs.push(`${s.target.duration_min} min`);
            else if (s.target.distance_miles) targetStrs.push(`${s.target.distance_miles} miles`);

            if (s.target.rpe) targetStrs.push(`RPE ${s.target.rpe}`);

            if (s.target.percent_1rm) {
                targetStrs.push(`@ ${Math.round(s.target.percent_1rm * 100)}% 1RM`);
                // Only provide the physical weight calculation if we have the profile to process it
                if (profile) {
                    const calc = calculateWorkingSet(s.name, s.target.percent_1rm, profile);
                    if (calc.weight > 0) {
                        targetStrs.push(`-> ${calc.weight} lbs${calc.isEstimate ? ' (Est)' : ''}`);
                    }
                }
            }
            if (targetStrs.length > 0) text += ` [${targetStrs.join(', ')}]`;
        }
        if (s.details) text += ` - Details: ${parseWorkoutTemplate(s.details, profile)}`;
        if (s.notes) text += ` - Note: ${parseWorkoutTemplate(s.notes, profile)}`;
        return text;
    }).join('\n');
}

/**
 * Formats a compressed phase summary.
 */
function createPhaseSummary(phaseObj: any): string {
    if (!phaseObj) return "Unknown Phase";
    const title = phaseObj.name ? `Phase: ${phaseObj.name}` : 'Current Phase';
    let schedule = "Schedule: ";
    if (phaseObj.weeks && phaseObj.weeks[0] && phaseObj.weeks[0].days) {
        schedule += phaseObj.weeks[0].days.map((d: any) => d.day).join(', ');
    } else {
        schedule += "Unknown";
    }
    return `${title}\n${schedule}`;
}

/**
 * Builds the dynamic context based on Intent and User State using the Supabase DB
 */
export async function buildDynamicContext(
    intent: IntentType,
    currentPhase: number,
    currentWeek: number,
    messages: Message[],
    providedUserDay?: string,
    profile?: UserProfile,
    supabase?: any
): Promise<ContextPayload> {

    let programData: any = null;
    let coreRoutineSnippet = `### STATUS (Week ${currentWeek}, Phase ${currentPhase})\nRest or recovery focused day.`;
    let phaseSummaryStr = `Current Phase: ${currentPhase}`;
    let dailyRoutineForLogistics = '';

    // If Supabase client is passed, query exactly what the UI sees for today
    if (supabase) {
        try {
            const { data } = await supabase.from('workout_library').select('program_data').single();
            if (data?.program_data) {
                programData = data.program_data;

                const today = (providedUserDay || new Date().toLocaleDateString('en-US', { weekday: 'long' })).toUpperCase();

                let targetPhase = currentPhase;
                if (currentPhase === 5) {
                    const TESTING_WEEKS = [37, 44, 51];
                    if (!TESTING_WEEKS.includes(currentWeek)) {
                        targetPhase = 1;
                        console.log(`[ContextRouter] Phase 5 Re-entry detected for week ${currentWeek}. Redirecting to Phase 1 context.`);
                    }
                }

                if (programData.phases) {
                    // Extract exact Phase JSON
                    const phaseObj = programData.phases.find((p: any) => p.id === targetPhase) || programData.phases[0];
                    if (phaseObj) {
                        phaseSummaryStr = createPhaseSummary(phaseObj);

                        if (phaseObj.weeks && phaseObj.weeks.length > 0) {
                            // Convert absolute program week to the selected phase's local week index.
                            const phaseIdx = programData.phases.findIndex((p: any) => p.id === phaseObj.id);
                            const priorPhaseWeeks = programData.phases
                                .slice(0, Math.max(phaseIdx, 0))
                                .reduce((sum: number, phase: any) => sum + (phase.weeks?.length || 0), 0);
                            const relWeekIdx = Math.max(currentWeek - 1 - priorPhaseWeeks, 0) % phaseObj.weeks.length;
                            const weekObj = phaseObj.weeks[relWeekIdx] || phaseObj.weeks[0];

                            if (weekObj && weekObj.days) {
                                // Find exact day matching "MONDAY" etc
                                const dayObj = weekObj.days.find((d: any) => d.day?.toUpperCase() === today);

                                if (dayObj) {
                                    // Generate highly optimized string for AI (e.g. math done locally)
                                    const formattedSegments = formatSegmentsForAI(dayObj.segments, profile);
                                    dailyRoutineForLogistics = formattedSegments;
                                    coreRoutineSnippet = `### CORE ROUTINE - ${dayObj.title} (${today}, Week ${currentWeek}, Phase ${currentPhase})\n${formattedSegments}`;
                                }
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[ContextRouter] Failed to process database workout_library:', e);
        }
    } else {
        console.warn(`[ContextRouter] No Supabase client provided, cannot fetch workout library!`);
    }

    // EXTRACT RECENTLY DISCUSSED EXERCISES
    const lastAssistantMessages = messages
        .filter(m => m.role === 'assistant')
        .slice(-2)
        .map(m => extractMessageContent(m))
        .join('\n');

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
        INJURY: 1500,
        LOGISTICS: 800,
        PROGRESS: 1000,
        GENERAL: 600,
    };

    switch (intent) {
        case 'INJURY':
            specificContext = `
*** URGENT: USER REPORTED POTENTIAL INJURY OR MODIFICATION REQUEST ***

Current Week: ${currentWeek}, Phase: ${currentPhase}

INSTRUCTION:
- Prioritize pain management and longevity.
- Suggest regressions or distinct alternatives.
- Do not push through sharp pain.
- Ask clarifying questions about the pain location and intensity.
`;
            tools = ['getRecentLogs'];
            break;

        case 'LOGISTICS':
            if (dailyRoutineForLogistics) {
                specificContext = `
*** TODAY'S WORKOUT - Week ${currentWeek}, Phase ${currentPhase} ***

${truncateToTokenLimit(dailyRoutineForLogistics, TOKEN_BUDGETS.LOGISTICS)}

INSTRUCTION:
- Explain the workout details above. Be precise with the weights calculated for the user.
- Provide warmup tips if asked.
- Clarify RPE/percentages if asked.
`;
            } else {
                specificContext = `
*** Week ${currentWeek}, Phase ${currentPhase} ***

No specific routine found for today. This is likely a rest or recovery day.

INSTRUCTION:
- Confirm if today is a scheduled rest day.
- Suggest recovery activities if appropriate.
`;
            }
            break;

        case 'PROGRESS':
            specificContext = `
*** PROGRESS & ANALYTICS - Week ${currentWeek}, Phase ${currentPhase} ***

DATABASE SCHEMA (for smart query selection):
Available Tools:
- getExercisePR: For "what's my max squat?" or PR questions. Returns profile maxes directly.
- getRecentLogs: For "show my workouts this week" or exercise history. Params: days (1-30), filter (exercise name).
- findLastLog: For "when was my last deadlift?" historical lookups. No time limit.
- getRecoveryMetrics: For "how's my HRV?" or sleep/recovery analysis. Combines sleep_logs + readiness_logs + biometrics.
- getComplianceReport: For "did I hit my workouts this week?" compliance tracking.
- getTrendAnalysis: For "Am I getting stronger?" or progress trend questions. Calculates direction + % change.
- getBiometrics: For manual health entries (weight, hrv, rhr, sleep_hours).

INSTRUCTION:
- Use the appropriate tool above to get actual data before answering.
- Analyze trends in the user's logs.
- Compare against prescribed targets.
- Handle typos gracefully (e.g., "squirt" will be corrected to "squat").
`;
            tools = ['getRecentLogs', 'getBiometrics', 'findLastLog', 'getExercisePR', 'getRecoveryMetrics', 'getComplianceReport', 'getTrendAnalysis'];
            break;

        case 'GENERAL':
        default:
            specificContext = `
*** CURRENT PHASE OVERVIEW - Week ${currentWeek}, Phase ${currentPhase} ***

${phaseSummaryStr}

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
