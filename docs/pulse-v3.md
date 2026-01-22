# Pulse V3 Roadmap: The "Sentient" Update
**Repository**: [ColbyRReichenbach/workout-web](https://github.com/ColbyRReichenbach/workout-web)

This document outlines the scope for the **Pulse V3** iteration, focusing heavily on evolving the AI Coach from a passive responder to a dynamic, multi-persona training partner.

## 1. AI Coach Evolution
The current AI is functional but static. V3 will introduce **4 Distinct Coaching Personas**, allowing users to tailor the feedback style to their psychological needs.

### A. The 4 Personas
1.  **The Drill Sergeant (Command Mode)**
    *   *Tone*: Authoritative, concise, demanding. No fluff.
    *   *Focus*: Compliance, grit, execution.
    *   *Prompting*: "Stop making excuses. Do the work."
2.  **The Scientist (Analytical Mode)**
    *   *Tone*: Data-driven, objective, precise.
    *   *Focus*: Biometrics, recovery metrics, physiological adaptation.
    *   *Prompting*: "Your HRV dropped 10% today; I recommend reducing volume by 15% to optimize supercompensation."
3.  **The Stoic (Philosopher Mode)**
    *   *Tone*: Calm, minimalist, profound.
    *   *Focus*: Mental resilience, consistency, long-term vision.
    *   *Prompting*: "The weight is heavy to teach you the strength you already possess."
4.  **The Empathetic Friend (Support Mode)**
    *   *Tone*: Encouraging, warm, understanding.
    *   *Focus*: Lifestyle balance, mental health, celebration.
    *   *Prompting*: "It's okay to have a bad day. You've been crushing it lately, let's just get some movement in."

### B. Technical Implementation
-   **Frontend**: Add a "Coach Settings" modal in `AiCoach.tsx` to switch personas instantly.
-   **Backend**: Update `api/chat/route.ts` to accept a `persona` parameter and dynamically inject the corresponding System Prompt.
-   **Memory**: Implement vector-based RAG (Supabase pgvector) to allow the AI to recall past conversations and long-term trends, rather than just the current session.


## 2. Context-Aware AI Architecture (The "Brain")
To achieve sub-second latency and minimize token costs, the AI must stop "reading the whole book" to answer a simple question. We will implement a **Context-Aware Tool Suite**.

### A. The Challenge: "All or Nothing"
Currently, if a user asks "How was my sleep?", we fetch *all* logs for 7-30 days. This is wasteful. If they ask "Substitute Bench Press", we don't need *any* history, just today's workout.

### B. The Solution: Granular Tooling
We will replace the generic `getRecentLogs` with precision instruments:

| Tool | Purpose | Use Case | Token Cost |
| :--- | :--- | :--- | :--- |
| **`get_daily_context(date)`** | Fetches *only* today's scheduled workout & last night's logs. | "What should I do today?", "My shoulder hurts." | Low (~500 tokens) |
| **`get_exercise_history(name, limit)`** | Fetches history for *one specific movement*. | "What is my Squat PR?", "Am I stalling on Bench?" | Medium (~1k tokens) |
| **`get_biometric_trends(metric, days)`** | Fetches *one* metric (e.g., HRV) over time. | "Is my recovery improving?", "Why am I tired?" | Low (~200 tokens) |
| **`search_knowledge_base(query)`** | Semantic search over the Master Plan (RAG). | "Why do we do Zone 2?", "Explain the philosophy." | Medium (~800 tokens) |

### C. Intelligent Routing (Router Chain)
We will implement a "Router" step in `api/chat/route.ts` that classifies the user's intent *before* calling tools.
*   **Intent: `immediate_modification`** -> Call `get_daily_context`.
*   **Intent: `long_term_analysis`** -> Call `get_biometric_trends` or `get_exercise_history`.
*   **Intent: `education`** -> Call `search_knowledge_base`.

## 3. Advanced Analytics (Dashboard V3)
-   **Verification**: Ensure the "Macro-Cycle" chart is fully populated with real data.
-   **Forecasting**: Use the AI to predict future 1RM performance based on current trends.


## 3. Codebase Improvements
-   **Testing**: Introduce Vitest/Jest for unit testing the logic in `generate_52_weeks.js` and `conversions.ts`.
-   **Error Handling**: Create a unified `AppError` class for consistent backend error reporting.
-   **PWA**: Improve manifest and offline capabilities for a true "App-like" feel on mobile.

## 4. Next Steps
1.  **Branch**: `pulse-v3` (Created)
2.  **Priority**: Implement the Persona Selector and Backend Logic first.
