import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import axios from "axios";
import { GoogleGenerativeAI, Schema, Type } from "@google/generative-ai";

admin.initializeApp();

const db = admin.firestore();

// We expect these secrets to be set in the Firebase project:
// firebase functions:config:set keys.newsapi="..."
// firebase functions:config:set keys.gemini="..."
// We will also fallback to process.env.GEMINI_API_KEY for local testing

export const fetchTechNews = functions.pubsub
  .schedule("every 6 hours")
  .onRun(async (context) => {
    try {
      const NEWS_API_KEY = functions.config().keys?.newsapi || process.env.NEWS_API_KEY;
      const GEMINI_API_KEY = functions.config().keys?.gemini || process.env.GEMINI_API_KEY;

      if (!NEWS_API_KEY || !GEMINI_API_KEY) {
        console.error("Missing API keys. Please set NEWS_API_KEY and GEMINI_API_KEY.");
        return null;
      }

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

      const queries = ["tech hiring", "tech layoffs", "startup funding", "software engineering salary"];
      const query = queries[Math.floor(Math.random() * queries.length)];

      console.log(`Step 1: Searching news API with query: "${query}"`);

      // Using NewsAPI.org as the provider
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
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

      console.log(`Step 2: Summarizing ${articles.length} articles with Gemini`);

      const summarizedArticles = [];
      
      const schema: Schema = {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A concise 2-sentence summary of how this impacts careers or hiring in the tech industry",
          },
          category: {
            type: Type.STRING,
            description: "Categorize it into exactly one of these: 'Hiring', 'Layoffs', 'Leadership Moves', 'Salary Reports', or 'Industry Trends'",
          },
        },
        required: ["summary", "category"],
      };

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.2,
        },
      });

      for (const article of articles.slice(0, 5)) { // Process top 5 to save LLM costs/time
        if (!article.title || !article.url) continue;

        try {
          const prompt = `Analyze this tech news article:
Title: ${article.title}
Source: ${article.source?.name}
Description: ${article.description || "N/A"}

Provide a concise 2-sentence summary of how this impacts careers or hiring in the tech industry. Also, categorize it into exactly one of these: "Hiring", "Layoffs", "Leadership Moves", "Salary Reports", or "Industry Trends".`;

          const result = await model.generateContent(prompt);
          const responseText = result.response.text();

          let parsed;
          try {
            parsed = JSON.parse(responseText);
          } catch (e) {
            // Fallback parsing if Gemini returned markdown wrapped json
            const match = responseText.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : null;
          }

          if (parsed && parsed.summary && parsed.category) {
            summarizedArticles.push({
              headline: article.title,
              summary: parsed.summary,
              source: article.source?.name || "Tech News",
              sourceUrl: article.url,
              category: parsed.category,
              publishedAt: admin.firestore.Timestamp.fromDate(new Date(article.publishedAt || Date.now())),
              fetchedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          }
        } catch (err) {
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
    } catch (error) {
      console.error("Cloud Function failed:", error);
      throw error;
    }
  });
