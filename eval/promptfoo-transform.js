module.exports = (output, context) => {
    try {
        if (typeof output === 'string') {
            // Check for JSON error response first
            if (output.trim().startsWith('{')) {
                try {
                    const json = JSON.parse(output);
                    if (json.error || json.message) return JSON.stringify(json);
                } catch (e) { }
            }

            // Parse Vercel AI SDK Data Stream
            const lines = output.split('\n');
            let text = '';
            let foundStream = false;

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    foundStream = true;
                    // Remove 'data: ' prefix
                    const data = trimmed.slice(6);
                    if (data.trim() === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        // Extract text deltas
                        if (parsed.type === 'text-delta' && parsed.delta) {
                            text += parsed.delta;
                        }
                        // We could also extract tool outputs here if needed
                    } catch (e) {
                        // Ignore parse errors for individual lines
                    }
                }
            }

            // If we found stream data and extracted text, return the joined text.
            // Otherwise, if we found stream lines but no text (e.g. only tool calls), return text (empty) or something descriptive? 
            // Better to return the text if we found valid stream format.
            if (foundStream) {
                return text;
            }

            return output;
        }
    } catch (e) {
        return output;
    }
    return output;
};
