import { NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import Parser from "rss-parser";

// Cache this API response for 6 hours (21600 seconds) natively in Next.js!
export const revalidate = 21600;

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
});

export async function GET(request: Request) {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY in environment variables.");
    }

    const rssFeeds = [
      "https://news.google.com/rss/search?q=tech+layoffs",
      "https://news.google.com/rss/search?q=tech+hiring",
      "https://news.google.com/rss/search?q=startup+funding",
      "https://news.google.com/rss/search?q=AI+jobs",
      "https://news.google.com/rss/search?q=software+engineer+salary",
      "https://techcrunch.com/feed/"
    ];

    let allRawItems: any[] = [];

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

    // Deduplicate and filter (newer than 48 hours)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const uniqueLinks = new Set<string>();
    const filteredItems: typeof allRawItems = [];

    for (const item of allRawItems) {
      if (!item.link || !item.title) continue;
      
      const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
      if (pubDate < fortyEightHoursAgo) continue;

      if (!uniqueLinks.has(item.link)) {
        uniqueLinks.add(item.link);
        filteredItems.push({ ...item, pubDate });
      }
    }

    // Sort by newest first and cap to top 15 to control token usage
    filteredItems.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    const topItems = filteredItems.slice(0, 15);

    if (topItems.length === 0) {
      return NextResponse.json({ source: "empty", data: [] });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const arraySchema: Schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          headline: { type: SchemaType.STRING, description: "Use the original article title" },
          source: { type: SchemaType.STRING },
          link: { type: SchemaType.STRING, description: "Original article URL" },
          publishedAt: { type: SchemaType.STRING, description: "ISO date string" },
          category: { type: SchemaType.STRING, description: "Hiring | Layoffs | Funding | Leadership | Salary | Industry Trend" },
          whyItMatters: { type: SchemaType.STRING, description: "2-3 sentences explaining why this news matters specifically for students and job seekers" }
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
      snippet: i.snippet.substring(0, 300) // trim snippet to save tokens
    })), null, 2);

    const prompt = `You are a career advisor for students and early-career job seekers using CareerPilot AI.

For each article below, write ONE short insight (2-3 sentences) explaining why this news matters specifically for students and job seekers — not a general summary of the article, but the career-relevant takeaway. Also assign a category.

Articles:
${articlesJSON}

Skip any article that has no meaningful career relevance for students or job seekers — do not force an insight onto irrelevant content.`;

    let insights: any[] = [];

    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      try {
        insights = JSON.parse(responseText);
      } catch (e) {
        const match = responseText.match(/\[[\s\S]*\]/);
        if (match) insights = JSON.parse(match[0]);
      }
    } catch (geminiError) {
      console.warn("Gemini API failed or key invalid. Falling back to raw RSS data...", geminiError);
      
      // Fallback: Map the raw RSS data into the expected Insights structure
      insights = topItems.map((item, index) => ({
        id: index.toString(),
        headline: item.title,
        source: item.source,
        link: item.link,
        publishedAt: item.pubDate.toISOString(),
        category: "Industry Trend", // Default category
        whyItMatters: item.snippet || "This article highlights recent developments in the tech industry that may affect job market conditions and career strategies."
      }));
    }

    if (insights && Array.isArray(insights) && insights.length > 0) {
      const newInsightsToReturn = insights.map((insight, index) => ({
        id: index.toString(),
        headline: insight.headline || "Tech News Update",
        source: insight.source || "Industry Source",
        link: insight.link,
        category: insight.category || "Industry Trend",
        whyItMatters: insight.whyItMatters || "Important career context for this development.",
        publishedAt: insight.publishedAt || new Date().toISOString(),
      }));

      // Sort by newest published
      newInsightsToReturn.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      
      return NextResponse.json({ source: "live", data: newInsightsToReturn });
    }

    return NextResponse.json({ source: "error", data: [] });

  } catch (error) {
    console.error("News Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch news", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
