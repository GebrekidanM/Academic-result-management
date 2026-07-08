// translate.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

// ⚠️ 1. የቅንጅቶች ማስተካከያ (Configuration)
const API_KEY = process.env.GEMINI_API_KEY;
const TARGET_LANGUAGE = 'Tigrinya';
const OUTPUT_FILE_NAME = 'ti.js';

const translateJSON = async () => {
    if (!API_KEY) {
        console.error("❌ Error: Please set GEMINI_API_KEY in your .env file.");
        return;
    }

    // ⚠️ 2. የፎልደርህን ስም አስተካክል!
    // የፊት ለፊት ፎልደርህ ስም "client" ከሆነ 'frontend' የሚለውን ወደ 'client' ቀይረው [2]
    const inputPath = path.join(__dirname, '../client/src/shared/locales/en.js'); 
    const outputPath = path.join(__dirname, `../client/src/shared/locales/${OUTPUT_FILE_NAME}`);

    try {
        console.log(`📂 Reading English translation file from: ${inputPath}...`);
        if (!fs.existsSync(inputPath)) {
            // 'client' የሚለውን ፎልደር በራስ-ሰር ለመፈተሽ ጥረት ማድረግ [2]
            const clientPath = path.join(__dirname, '../client/src/shared/locales/en.js');
            if (fs.existsSync(clientPath)) {
                console.log("ℹ️ Auto-detected 'client' folder instead of 'frontend'. Redirecting path.");
                return runTranslation(clientPath, path.join(__dirname, `../client/src/shared/locales/${OUTPUT_FILE_NAME}`));
            }
            throw new Error(`The file en.js was not found at ${inputPath}. Please verify your folder name (frontend vs client).`);
        }

        await runTranslation(inputPath, outputPath);

    } catch (error) {
        console.error("❌ Translation failed:", error.message);
    }
};

const runTranslation = async (inputPath, outputPath) => {
    try {
        const fileContent = fs.readFileSync(inputPath, 'utf8');

        // ⚠️ 3. የጃቫስክሪፕቱን ኮድ አውጥቶ በደህንነት ወደ JS Object የመቀየርያ ሎጂክ
        const objectString = fileContent
            .replace(/export\s+const\s+en\s*=\s*/, '') // export const en = የሚለውን ማጥፋት
            .trim()
            .replace(/;$/, ''); // የስተመጨረሻውን ሴሚኮሎን ማጥፋት
        
        // በደህንነት ወደ ጃቫስክሪፕት ኦብጀክት መለወጥ
        const jsObject = new Function(`return ${objectString}`)();
        const jsonObject = jsObject.translation;

        console.log(`🤖 Sending translation request to Google Gemini API (Free Tier)...`);
        
        const prompt = `You are a professional translator. Translate the values of the following JSON object to ${TARGET_LANGUAGE}. Keep the keys exactly the same. Do not translate or modify the keys. Only return the raw translated JSON object. Do not include any markdown formatting, backticks, or explanation. It must be a valid parseable JSON string.\n\n${JSON.stringify(jsonObject)}`;

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
            {
                contents: [{
                    parts: [{ text: prompt }]
                }]
            }
        );

        let translatedText = response.data.candidates[0].content.parts[0].text;
        translatedText = translatedText.replace(/```json/i, '').replace(/```/g, '').trim();

        // የጸዳውን ጽሁፍ በድጋሚ ወደ JSON ኦብጀክት መለወጥ
        const parsedJSON = JSON.parse(translatedText);

        // የመጨረሻውን የጃቫስክሪፕት (.js) የትርጉም ፋይል መዋቅር መገንባት [2]
        const outputLangCode = OUTPUT_FILE_NAME.split('.')[0]; // ለምሳሌ: om ወይም am
        const finalJSContent = `export const ${outputLangCode} = {\n  translation: ${JSON.stringify(parsedJSON, null, 2)}\n};`;

        // ፎልደሩ ከሌለ አዲስ መፍጠር
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, finalJSContent, 'utf8');
        console.log(`\n🎉 Translation Complete! Successfully saved to: ${outputPath} [2]`);

    } catch (error) {
        console.error("❌ Translation execution failed:", error.message);
    }
};

translateJSON();