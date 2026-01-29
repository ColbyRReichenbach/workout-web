const fs = require('fs');
const path = require('path');

// Default config
const inputFile = process.argv[2] || 'promptfoo-report-final-conversation.json';
const historyDir = 'eval-history';
const historyFile = path.join(historyDir, 'promptfoo_history.csv');

try {
    // 1. Ensure history directory exists
    if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
        console.log(`Created directory: ${historyDir}`);
    }

    // 2. Read and parse JSON input
    if (!fs.existsSync(inputFile)) {
        console.error(`Input file not found: ${inputFile}`);
        process.exit(1);
    }
    const jsonContent = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(jsonContent);
    const results = data.results?.results || [];

    if (results.length === 0) {
        console.log('No results found in JSON input.');
        process.exit(0);
    }

    // 3. Prepare CSV Data
    // Define headers - now including Timestamp
    const headers = ['Timestamp', 'Test Case', 'Prompt', 'Response', 'Passed', 'Score', 'LatencyMs', 'Reason'];

    // Check if we need to write headers (new file)
    const isNewFile = !fs.existsSync(historyFile);

    const timestamp = new Date().toISOString();

    const escapeCsv = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        return `"${stringField.replace(/"/g, '""')}"`; // Escape double quotes
    };

    const rows = results.map(r => {
        const description = r.testCase?.description || 'N/A';
        const prompt = r.prompt?.raw || r.prompt?.label || '';
        const response = r.response?.output || '';
        const passed = r.gradingResult?.pass ? 'TRUE' : 'FALSE';
        const score = r.gradingResult?.score || 0;
        const latency = r.latencyMs || 0;
        const reason = r.gradingResult?.reason || '';

        return [
            timestamp,
            description,
            prompt,
            response,
            passed,
            score,
            latency,
            reason
        ].map(escapeCsv).join(',');
    });

    // 4. Write/Append to CSV
    let csvContent = '';
    if (isNewFile) {
        csvContent = headers.join(',') + '\n' + rows.join('\n') + '\n';
        fs.writeFileSync(historyFile, csvContent);
        console.log(`Created new history file at ${historyFile}`);
    } else {
        csvContent = rows.join('\n') + '\n';
        fs.appendFileSync(historyFile, csvContent);
        console.log(`Appended ${rows.length} results to ${historyFile}`);
    }

} catch (error) {
    console.error('Error updating CSV history:', error.message);
    process.exit(1);
}
