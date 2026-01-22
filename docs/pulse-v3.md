# Pulse V3 Roadmap: The "Sentient" Update

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

## 2. Advanced Analytics (Dashboard V3)
-   **Verification**: Ensure the "Macro-Cycle" chart is fully populated with real data.
-   **Forecasting**: Use the AI to predict future 1RM performance based on current trends.

## 3. Codebase Improvements
-   **Testing**: Introduce Vitest/Jest for unit testing the logic in `generate_52_weeks.js` and `conversions.ts`.
-   **Error Handling**: Create a unified `AppError` class for consistent backend error reporting.
-   **PWA**: Improve manifest and offline capabilities for a true "App-like" feel on mobile.

## 4. Next Steps
1.  **Branch**: `pulse-v3` (Created)
2.  **Priority**: Implement the Persona Selector and Backend Logic first.
