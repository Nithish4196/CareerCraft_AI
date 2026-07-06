const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function testAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ No API key found in .env.local");
    return;
  }

  console.log(`🔑 Testing with API Key starting with: ${apiKey.substring(0, 10)}...`);
  const genAI = new GoogleGenerativeAI(apiKey);

  const testConfigs = [
    { model: "gemini-1.5-flash", apiVersion: "v1" },
    { model: "gemini-1.5-flash", apiVersion: "v1beta" },
    { model: "gemini-1.5-pro", apiVersion: "v1" },
    { model: "gemini-pro", apiVersion: "v1beta" }
  ];

  let successCount = 0;

  for (const conf of testConfigs) {
    console.log(`\n======================================`);
    console.log(`⏳ Testing Model: [${conf.model}] on API Version: [${conf.apiVersion}]`);
    try {
      const model = genAI.getGenerativeModel({ model: conf.model }, { apiVersion: conf.apiVersion });
      const result = await model.generateContent("Reply with the word 'Hello'.");
      console.log(`✅ SUCCESS! Response: "${result.response.text().trim()}"`);
      successCount++;
    } catch (error) {
      console.error(`❌ FAILED! Error: ${error.message}`);
    }
  }
  
  console.log(`\n======================================`);
  if (successCount === 0) {
    console.log("🚨 FATAL: All requests failed. Your API key does not have access to the Generative Language API, or your Google Cloud Project is not properly configured for Gemini.");
  } else {
    console.log("🎉 Some models worked! We can use those in the codebase.");
  }
}

testAllModels();
