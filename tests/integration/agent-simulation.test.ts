// @vitest-environment node
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load test cases
const casesPath = path.join(process.cwd(), 'tests/fixtures/agent-cases.json');
const testCases = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));

describe('Agent Simulation Integration Tests', () => {
    // We will run this against the running server or mocking the handler.
    // Ideally, integration tests run against the real API endpoint.
    // Ensure the app is running or use a test server setup.
    // For this setup, we assume the app is running on localhost:3000 as per promptfoo config.
    // OR we can import the POST handler directly if we mock the request.

    // Since we are "simulating" conversations, fetching from localhost is cleanest for "black box" testing.
    const BASE_URL = 'http://localhost:3000/api/chat';

    testCases.forEach((testCase: any) => {
        it(`should handle case: ${testCase.id}`, async () => {
            // Construct the request body
            const body = {
                messages: testCase.inputs
            };

            // Send request
            const response = await fetch(BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': 'guest-mode=true'
                },
                body: JSON.stringify(body)
            });

            // Handle potential 400/500 errors
            if (testCase.expected.error) {
                // If we expect an error (like unsafe request), status might be 4xx
                if (!response.ok) {
                    const errorData = await response.json();
                    // Check error message
                    if (testCase.expected.substrings) {
                        const errorMessage = errorData.error?.message || JSON.stringify(errorData);
                        testCase.expected.substrings.forEach((sub: string) => {
                            expect(errorMessage).toContain(sub);
                        });
                    }
                    return; // Pass
                }
                // If it didn't fail but expected error:
                // Depending on how api handles it. If it returns 200 with text refusal, we check text.
            }

            const text = await response.text();

            // Parse SSE if success
            if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
                let fullText = '';
                const lines = text.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr.trim() === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.type === 'text-delta') {
                                fullText += parsed.delta || '';
                            } else if (parsed.type === 'tool-output-available') {
                                fullText += parsed.output || '';
                            }
                        } catch (e) { }
                    }
                }

                // Assertions
                if (testCase.expected.substrings) {
                    testCase.expected.substrings.forEach((sub: string) => {
                        expect(fullText).toContain(sub);
                    });
                }
            } else {
                // Non-SSE response (or error)
                if (testCase.expected.substrings) {
                    testCase.expected.substrings.forEach((sub: string) => {
                        expect(text).toContain(sub);
                    });
                }
            }
        });
    });
});
