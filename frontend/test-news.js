const { GoogleGenerativeAI } = require("@google/generative-ai");
const Parser = require("rss-parser");
require("dotenv").config({ path: ".env.local" });

async function test() {
  const parser = new Parser();
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("No Gemini Key");

  const rssFeeds = [
    "https://news.google.com/rss/search?q=tech+layoffs",
    "https://techcrunch.com/feed/"
  ];

  let allRawItems = [];

  // Fetch all RSS feeds in parallel
  await Promise.allSettled(
    rssFeeds.map(async (feedUrl) => {
      try {
        const feed = await parser.parseURL(feedUrl);
        const sourceName = feedUrl.includes('techcrunch') ? 'TechCrunch' : 'Google News';
        feed.items.forEach(item => {
          allRawItems.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            snippet: item.contentSnippet || item.content || "",
            source: sourceName
          });
        });
      } catch (e) {
        console.warn(`Failed to fetch RSS feed: ${feedUrl}`);
      }
    })
  );

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const uniqueLinks = new Set();
  const filteredItems = [];

  for (const item of allRawItems) {
    if (!item.link || !item.title) continue;

    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
    if (pubDate < fortyEightHoursAgo) continue;

    if (!uniqueLinks.has(item.link)) {
      uniqueLinks.add(item.link);
      filteredItems.push({ ...item, pubDate });
    }
  }

  filteredItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
  const topItems = filteredItems.slice(0, 5); // reduce to 5 for test speed

  console.log(`Found ${topItems.length} items to summarize`);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const arraySchema = {
    type: "array",
    items: {
      type: "object",
      properties: {
        headline: { type: "string" },
        source: { type: "string" },
        link: { type: "string" },
        publishedAt: { type: "string" },
        category: { type: "string" },
        whyItMatters: { type: "string" }
      },
      required: ["headline", "source", "link", "publishedAt", "category", "whyItMatters"]
    }
  };

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: arraySchema,
      temperature: 0.2,
    },
  });

  const articlesJSON = JSON.stringify(topItems.map(i => ({
    title: i.title,
    source: i.source,
    link: i.link,
    publishedAt: i.pubDate.toISOString(),
    snippet: i.snippet.substring(0, 300)
  })), null, 2);

  const prompt = `You are a career advisor for students and early-career job seekers using CareerPilot AI.

For each article below, write ONE short insight (2-3 sentences) explaining why this news matters specifically for students and job seekers — not a general summary of the article, but the career-relevant takeaway. Also assign a category.

Articles:
${articlesJSON}

Skip any article that has no meaningful career relevance for students or job seekers — do not force an insight onto irrelevant content.`;

  try {
    const result = await model.generateContent(prompt);
    console.log("Raw Response:");
    console.log(result.response.text());
  } catch (err) {
    console.error("Gemini Error:", err);
  }
}

test();
