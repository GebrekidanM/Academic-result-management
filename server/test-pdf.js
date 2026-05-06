const { PDFParse } = require('pdf-parse');
async function test() {
    try {
        // Test with empty buffer (might throw error about invalid PDF, but checking if method exists)
        const parser = new PDFParse(Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<Root 1 0 R>>\n%%EOF'));
        if (typeof parser.getText === 'function') {
            console.log('Success: getText method found');
        } else {
            console.log('getText is not a function:', typeof parser.getText);
        }
    } catch (err) {
        console.log('Error:', err.message);
    }
}
test();
