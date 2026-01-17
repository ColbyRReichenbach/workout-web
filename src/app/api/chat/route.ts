import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { promises as fs } from 'fs';
import path from 'path';
import { getRecentLogs, getBiometrics } from '@/lib/ai/tools';

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    // Load the Master Plan
    const planPath = path.join(process.cwd(), 'docs', 'routine_master_plan.md');
    const masterPlan = await fs.readFile(planPath, 'utf-8');

    const systemPrompt = `
    You are the "Hybrid Athlete Coach", an elite AI coach responsible for managing the training of a high-performance athlete.
    
    YOUR CONSTITUTION (THE MASTER PLAN):
    ${masterPlan}
    
    YOUR ROLE:
    1. Analyze the user's queries in the context of this specific plan.
    2. Check for compliance. If the user logged a "Zone 2 Run" with an Avg HR of 165, you MUST flag it as a violation of the 160 bpm constraint.
    3. Modify sessions based on reported fatigue or injury, BUT ONLY by regressing to safer variants found in the plan or standard physiology principles (e.g., knee pain -> replace Squats with Box Squats or Sled Work).
    4. Be concise, direct, and authoritative. You are a coach, not a cheerleader.
    
    You have access to the user's recent logs via tools. Always utilize them before answering questions about progress or fatigue.
  `;

    const result = streamText({
        model: openai('gpt-4o'),
        system: systemPrompt,
        messages,
        tools: {
            getRecentLogs,
            getBiometrics
        },
    });

    return result.toTextStreamResponse();
}
