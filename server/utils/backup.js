const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const execPromise = util.promisify(exec);

const performBackup = async () => {
    const mongoUri = process.env.MONGO_URI;
    const tgToken = process.env.TG_TOKEN;
    const chatId = process.env.TG_CHAT_ID;

    if (!mongoUri || !tgToken || !chatId) {
        console.error("❌ Missing required environment variables (MONGO_URI, TG_TOKEN, or TG_CHAT_ID).");
        return;
    }

    // process.cwd() የፕሮጀክቱን ዋና ፎልደር (root directory) በትክክል ለማግኘት ይረዳል
    const binaryPath = path.join(process.cwd(), 'bin', 'mongodump');
    const fileName = `backup_${new Date().toISOString().split('T')[0]}.gz`;
    const tempPath = path.join(process.cwd(), fileName);

    try {
        console.log("🔄 Preparing mongodump binary...");

        // 1. የ mongodump ባይናሪ በቦታው መኖሩን ማረጋገጥ
        if (!fs.existsSync(binaryPath)) {
            throw new Error(`mongodump binary was not found at: ${binaryPath}. Please make sure you committed it inside the "bin" folder.`);
        }

        // 2. በRender (Linux) ላይ Permission Denied እንዳይል ፍቃድ መስጠት
        fs.chmodSync(binaryPath, '755');
        console.log("⚙️ Executable permissions set for mongodump.");

        console.log("🔄 Executing database backup via mongodump...");
        // 3. የ Atlas ዳታቤዝን በ Gzip አሽጎ ጊዜያዊ ቦታ ማስቀመጥ
        const dumpCommand = `"${binaryPath}" --uri="${mongoUri}" --archive="${tempPath}" --gzip`;
        await execPromise(dumpCommand);

        console.log(`✅ Backup archive created successfully at: ${tempPath}`);

        // 4. የተፈጠረውን .gz ፋይል በStream አንብቦ ወደ ቴሌግራም መላክ
        const fileStream = fs.createReadStream(tempPath);
        const form = new FormData();
        form.append('document', fileStream, { filename: fileName });
        form.append('chat_id', chatId);
        form.append('caption', `✅ Atlas Backup Successful: ${fileName}`);

        console.log("📤 Uploading backup to Telegram...");
        await axios.post(`https://api.telegram.org/bot${tgToken}/sendDocument`, form, {
            headers: form.getHeaders(),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        console.log(`✅ Backup successful! Sent to Telegram: ${fileName}`);

    } catch (err) {
        console.error("❌ Backup execution failed:", err.message);
    } finally {
        // 5. ⚠️ የRender ዲስክ እንዳይሞላ ጊዜያዊ ፋይሉን ከሰርቨሩ ላይ ማጥፋት
        if (fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath);
                console.log(`🧹 Cleaned up temporary backup file from server disk.`);
            } catch (unlinkErr) {
                console.error(`❌ Failed to delete temporary file: ${unlinkErr.message}`);
            }
        }
    }
};

module.exports = { performBackup };