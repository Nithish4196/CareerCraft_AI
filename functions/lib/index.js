"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchTechNews = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios_1 = require("axios");
const sdk_1 = require("@anthropic-ai/sdk");
admin.initializeApp();
const db = admin.firestore();
// We expect these secrets to be set in the Firebase project:
// firebase functions:config:set keys.newsapi="..."
// firebase functions:config:set keys.anthropic="..."
// Alternatively, with Secret Manager (v2), use defineSecret. 
// We will use standard env config for broader compatibility here.
exports.fetchTechNews = functions.pubsub
    .schedule("every 6 hours")
    .onRun(async (context) => {
    var _a, _b, _c, _d, _e;
    try {
        const NEWS_API_KEY = ((_a = functions.config().keys) === null || _a === void 0 ? void 0 : _a.newsapi) || process.env.NEWS_API_KEY;
        const ANTHROPIC_API_KEY = ((_b = functions.config().keys) === null || _b === void 0 ? void 0 : _b.anthropic) || process.env.ANTHROPIC_API_KEY;
        if (!NEWS_API_KEY || !ANTHROPIC_API_KEY) {
            console.error("Missing API keys. Please set NEWS_API_KEY and ANTHROPIC_API_KEY.");
            return null;
        }
        const anthropic = new sdk_1.default({
            apiKey: ANTHROPIC_API_KEY,
        });
        const queries = ["tech hiring", "tech layoffs", "startup funding", "software engineering salary"];
        const query = queries[Math.floor(Math.random() * queries.length)];
        console.log(`Step 1: Searching news API with query: "${query}"`);
        // Using NewsAPI.org as the provider
        const response = await axios_1.default.get(`https://newsapi.org/v2/everything`, {
            params: {
                q: query,
                language: 'en',
                sortBy: 'publishedAt',
                pageSize: 10,
                apiKey: NEWS_API_KEY
            }
        });
        const articles = response.data.articles || [];
        console.log(`Step 1 result: ${articles.length} articles found`);
        if (articles.length === 0) {
            return null;
        }
        console.log(`Step 2: Summarizing ${articles.length} articles with Claude`);
        const summarizedArticles = [];
        for (const article of articles.slice(0, 5)) { // Process top 5 to save LLM costs/time
            if (!article.title || !article.url)
                continue;
            try {
                const prompt = `Analyze this tech news article:
Title: ${article.title}
Source: ${(_c = article.source) === null || _c === void 0 ? void 0 : _c.name}
Description: ${article.description || "N/A"}

Provide a concise 2-sentence summary of how this impacts careers or hiring in the tech industry. Also, categorize it into exactly one of these: "Hiring", "Layoffs", "Leadership Moves", "Salary Reports", or "Industry Trends". 
Return your response strictly in this JSON format:
{
  "summary": "...",
  "category": "..."
}`;
                const msg = await anthropic.messages.create({
                    model: "claude-3-haiku-20240307",
                    max_tokens: 300,
                    temperature: 0.2,
                    messages: [{ role: "user", content: prompt }]
                });
                const contentText = ((_d = msg.content[0]) === null || _d === void 0 ? void 0 : _d.type) === 'text' ? msg.content[0].text : '{}';
                let parsed;
                try {
                    parsed = JSON.parse(contentText);
                }
                catch (e) {
                    // Fallback parsing if Claude returned markdown wrapped json
                    const match = contentText.match(/\{[\s\S]*\}/);
                    parsed = match ? JSON.parse(match[0]) : null;
                }
                if (parsed && parsed.summary && parsed.category) {
                    summarizedArticles.push({
                        headline: article.title,
                        summary: parsed.summary,
                        source: ((_e = article.source) === null || _e === void 0 ? void 0 : _e.name) || "Tech News",
                        sourceUrl: article.url,
                        category: parsed.category,
                        publishedAt: admin.firestore.Timestamp.fromDate(new Date(article.publishedAt || Date.now())),
                        fetchedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            catch (err) {
                console.error(`Failed to process article: ${article.title}`, err);
            }
        }
        console.log(`Step 2 result: ${summarizedArticles.length} summaries generated`);
        if (summarizedArticles.length > 0) {
            console.log(`Step 3: Writing ${summarizedArticles.length} documents to Firestore`);
            const newsRef = db.collection("techNews");
            // Clear existing news to keep it fresh
            const existingDocs = await newsRef.get();
            const batch = db.batch();
            existingDocs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            // Add new articles
            summarizedArticles.forEach((article) => {
                batch.set(newsRef.doc(), article);
            });
            await batch.commit();
            console.log(`Step 3 result: write completed successfully`);
        }
        return null;
    }
    catch (error) {
        console.error("Cloud Function failed:", error);
        throw error;
    }
});
//# sourceMappingURL=index.js.map