const fs = require('fs');
const path = require('path');

const inputFile = process.argv[2] || 'promptfoo-report-final-clean.json';
const outputFile = process.argv[3] || 'promptfoo_report.csv';

try {
    const jsonContent = fs.readFileSync(inputFile, 'utf8');
    const data = JSON.parse(jsonContent);

    const results = data.results?.results || [];

    if (results.length === 0) {
        console.log('No results found in JSON.');
        process.exit(1);
    }

    // Define CSV headers
    const headers = ['Test Case', 'Prompt', 'Response', 'Passed', 'Score', 'Reason'];

    // Helper to escape CSV fields
    const escapeCsv = (field) => {
        if (field === null || field === undefined) return '';
        const stringField = String(field);
        // Escape double quotes by doubling them
        return `"${stringField.replace(/"/g, '""')}"`;
    };

    const csvRows = [headers.join(',')];

    results.forEach(r => {
        const description = r.testCase?.description || 'N/A';
        const prompt = r.prompt?.raw || '';
        const response = r.response?.output || '';
        const passed = r.gradingResult?.pass ? 'TRUE' : 'FALSE';
        const score = r.gradingResult?.score || 0;
        const reason = r.gradingResult?.reason || '';

        const row = [
            description,
            prompt,
            response,
            passed,
            score,
            reason
        ].map(escapeCsv).join(',');

        csvRows.push(row);
    });

    fs.writeFileSync(outputFile, csvRows.join('\n'));
    console.log(`Successfully converted ${inputFile} to ${outputFile}`);

} catch (error) {
    console.error('Error converting JSON to CSV:', error.message);
    process.exit(1);
}
