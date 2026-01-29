

class CustomChatProvider {
    constructor(options) {
        this.options = options || {};
    }

    id() {
        return 'custom-chat-provider';
    }

    async callApi(prompt, context) {
        // Grab messages from context vars or parse prompt
        const messages = context.vars.messages || JSON.parse(prompt);

        try {
            const response = await fetch("http://localhost:3000/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Cookie": "guest-mode=true",
                },
                body: JSON.stringify({ messages }),
            });

            const text = await response.text();
            return { output: text };
        } catch (e) {
            return { error: `API Call Failed: ${e.message}` };
        }
    }
}

module.exports = CustomChatProvider;
