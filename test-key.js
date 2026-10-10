// Test Gemini API key directly
// Usage:
//   node test-key.js
//   node test-key.js YOUR_KEY_HERE

const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [k, ...v] = trimmed.split('=');
      if (k && v.length) process.env[k.trim()] = v.join('=').trim();
    }
  }
}

loadEnv();

const key = process.argv[2] || process.env.GEMINI_API_KEY;

if (!key) {
  console.error('\n❌ No API key provided.');
  console.log('Provide key via command line or .env:');
  console.log('  node test-key.js YourKeyHere...\n');
  process.exit(1);
}

console.log(`\n🔑 Testing key: ${key.slice(0, 8)}...${key.slice(-4)}`);

async function testKey() {
  const models = ['gemini-3.5-flash-lite'];
  const ai = new GoogleGenAI({ apiKey: key });

  for (const model of models) {
    try {
      process.stdout.write(`⏳ Testing model "${model}"... `);
      const res = await ai.models.generateContent({
        model,
        contents: 'Reply in exactly 3 words: "Key works fine"',
      });
      console.log('✅ SUCCESS!');
      console.log(`   Model reply: "${res.text?.trim()}"\n`);
      return;
    } catch (err) {
      console.log('❌ FAILED');
      const msg = err.message || JSON.stringify(err);
      if (msg.includes('CONSUMER_SUSPENDED')) {
        console.error('   ⚠️ REASON: This key/project has been SUSPENDED by Google.');
        console.error('   Create a fresh key at: https://aistudio.google.com/app/apikey\n');
        return;
      }
      if (msg.includes('API_KEY_INVALID')) {
        console.error('   ⚠️ REASON: Key is invalid or expired.\n');
        return;
      }
      console.error(`   Error details: ${msg.slice(0, 300)}\n`);
    }
  }
}

testKey();
