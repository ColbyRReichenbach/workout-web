
import { promises as fs } from 'fs';
import path from 'path';

// Types
export type IntentType = 'INJURY' | 'PROGRESS' | 'LOGISTICS' | 'GENERAL';

export interface ContextPayload {
    intent: IntentType;
    systemPromptAdditions: string;
    suggestedTools: string[];
}

// Intent Classification Logic
const KEYWORDS = {
    INJURY: [
        'hurt', 'pain', 'ache', 'injury', 'sore', 'swollen', 'tweak', 'snap', 'popped',
        'dizzy', 'faint', 'sick', 'ill', 'fever', 'click', 'pinch', 'sub', 'substitute',
        'alternative', 'can i do', 'instead of'
    ],
    PROGRESS: [
        'progress', 'trend', 'history', 'log', 'record', 'stats', 'data', 'biometric',
        'sleep', 'hrv', 'resting heart rate', 'weight', 'pr', 'max', 'faster', 'stronger',
        'last time', 'compare', 'analysis'
    ],
    LOGISTICS: [
        'today', 'tomorrow', 'schedule', 'plan', 'routine', 'what do i do', 'warmup',
        'workout', 'superset', 'reps', 'sets', 'rest'
    ]
};

/**
 * Detects the user's intent based on the latest message content.
 * Uses a heuristic keyword scoring system.
 */
export function detectIntent(message: string): IntentType {
    const content = message.toLowerCase();

    // 1. Safety/Injury checks (Highest Priority)
    // Even a single mention of pain should trigger safety mode to be safe.
    if (KEYWORDS.INJURY.some(k => content.includes(k))) {
        return 'INJURY';
    }

    // 2. Score other categories
    let progressScore = 0;
    let logisticsScore = 0;

    KEYWORDS.PROGRESS.forEach(k => { if (content.includes(k)) progressScore++; });
    KEYWORDS.LOGISTICS.forEach(k => { if (content.includes(k)) logisticsScore++; });

    if (progressScore > 0 && progressScore >= logisticsScore) return 'PROGRESS';
    if (logisticsScore > 0 && logisticsScore > progressScore) return 'LOGISTICS';

    return 'GENERAL';
}

/**
 * Extracts a specific section from the Master Plan Markdown
 */
function extractSection(markdown: string, sectionHeader: string): string {
    // Try to find specific day or section
    // Example: "#### MONDAY" or "### Phase 1"
    const regex = new RegExp(`(${sectionHeader}[\\s\\S]*?)(?=(#{1,4}\\s|\\Z))`, 'i');
    const match = markdown.match(regex);
    return match ? match[1].trim() : '';
}

/**
 * Builds the dynamic context based on Intent and User State
 */
export async function buildDynamicContext(
    intent: IntentType,
    currentPhase: number,
    currentWeek: number
): Promise<ContextPayload> {

    const planPath = path.join(process.cwd(), 'docs', 'routine_master_plan.md');
    let masterPlan = '';
    try {
        masterPlan = await fs.readFile(planPath, 'utf-8');
    } catch (e) {
        console.error('[ContextRouter] Failed to load Master Plan', e);
        return { intent: 'GENERAL', systemPromptAdditions: '', suggestedTools: [] };
    }

    // Common Header (Profile + Maxes) - Always useful for context
    const headerMatch = masterPlan.match(/^([\s\S]*?)(?=## PHASE 1)/i);
    const commonHeader = headerMatch ? headerMatch[1].trim() : '';

    // Get Current Day (e.g., "Monday")
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();

    let specificContext = '';
    let tools: string[] = [];

    // Phase content extraction (we mostly care about the current phase's template)
    // This extracts EVERYTHING for the phase, which is still a bit large but better than whole doc.
    // For LOGISTICS, we will narrow it down further.
    const phaseRegex = new RegExp(`(## PHASE ${currentPhase}[\\s\\S]*?)(?=## PHASE \\d|$)`, 'i');
    const phaseMatch = masterPlan.match(phaseRegex);
    const fullPhaseContent = phaseMatch ? phaseMatch[1] : '';

    switch (intent) {
        case 'INJURY':
            // SAFETY MODE:
            // Context: Full Phase (to see exercises) + specific Safety emphasis
            // We do NOT filter to just today because they might be asking about yesterday's pain.
            specificContext = `
        *** URGENT: USER REPORTED POTENTIAL INJURY OR MODIFICATION REQUEST ***
        ${fullPhaseContent}
        
        INSTRUCTION:
        - Prioritize pain management and longevity.
        - Suggest regressions or distinct alternatives.
        - Do not push through sharp pain.
      `;
            tools = ['getRecentLogs']; // Check if they did this recently
            break;

        case 'LOGISTICS':
            // FILTER TO TODAY'S ROUTINE ONLY
            // This is the huge token saver.
            // Search for "#### [DAY NAME]" inside the phase content
            const dailyRoutine = extractSection(fullPhaseContent, `#### ${today}`);

            if (dailyRoutine) {
                specificContext = `
            *** FOCUS: LOGISTICS & EXECUTION FOR ${today} ***
            ${dailyRoutine}
            
            INSTRUCTION:
            - Explain the above workout details.
            - Provide warmup tips.
            - Clarify RPE/percentages if asked.
          `;
            } else {
                // Fallback if today isn't found (e.g. Rest day or naming mismatch)
                specificContext = `
             *** FOCUS: LOGISTICS ***
             ${fullPhaseContent}
          `;
            }
            break;

        case 'PROGRESS':
            // ANALYTIC MODE:
            // Need Phase Progression Logic + full context of what they are supposed to be doing.
            const progressionLogic = extractSection(fullPhaseContent, '### Phase [0-9]+ Progression Logic');
            const testLogic = extractSection(fullPhaseContent, '### Week [0-9]+ Checkpoint');

            specificContext = `
        *** FOCUS: PROGRESS & ANALYTICS ***
        ${commonHeader}
        ${progressionLogic}
        ${testLogic}

        INSTRUCTION:
        - Analyze trends.
        - Compare against prescribed maxes.
        - Check compliance.
      `;
            tools = ['getRecentLogs', 'getBiometrics'];
            break;

        case 'GENERAL':
        default:
            // Default to just the phase content summary or full phase if short
            // For General, we might just give the Phase Goals and Schedule overview
            specificContext = `
            *** CURRENT PHASE OVERVIEW ***
            ${fullPhaseContent}
        `;
            tools = ['getBiometrics']; // Good for "how am I doing" general chat
            break;
    }

    return {
        intent,
        systemPromptAdditions: `${commonHeader}\n\n${specificContext}`,
        suggestedTools: tools
    };
}
