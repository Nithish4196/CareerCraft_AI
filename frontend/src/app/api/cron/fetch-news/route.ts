import { NextResponse } from "next/server";
import { collection, addDoc, serverTimestamp, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: Request) {
  try {
    // In a real production scenario, you would:
    // 1. Fetch RSS feeds or use web scraping APIs (e.g., NewsAPI) targeting TechCrunch, Bloomberg, etc.
    // 2. Pass the article text to an LLM (Gemini/OpenAI) to generate a 2-3 sentence summary.
    // 3. Classify the article into: Hiring / Layoffs / Leadership Moves / Funding / Salary Reports / Industry Trends.

    // For this demonstration, we generate mock data to simulate the result of this AI process.
    const mockNews = [
      {
        headline: "Tech Giant Announces 10,000 New AI Engineering Roles Globally",
        summary: "In a major push towards artificial intelligence, a leading tech firm has committed to expanding its AI division by 10,000 engineers over the next two years. The new roles will focus on foundational models and enterprise integrations, primarily in hubs like Seattle and London.",
        source: "TechCrunch",
        sourceUrl: "#",
        category: "Hiring",
      },
      {
        headline: "Q3 Compensation Report: Senior ML Engineers See 15% Base Salary Bump",
        summary: "A new compensation analysis reveals that base salaries for Senior Machine Learning Engineers have increased by 15% year-over-year. The data suggests an intensifying talent war, with total compensation packages frequently exceeding $300k when factoring in equity refreshers.",
        source: "Levels.fyi Blog",
        sourceUrl: "#",
        category: "Salary Reports",
      },
      {
        headline: "Prominent AI Researcher Leaves Google to Found New Robotics Startup",
        summary: "A key architect behind several major NLP breakthroughs has departed Google DeepMind. They announced the launch of a new startup focused on applying advanced reinforcement learning to humanoid robotics, backed by a massive $200M seed round.",
        source: "The Information",
        sourceUrl: "#",
        category: "Leadership Moves",
      }
    ];

    const newsRef = collection(db, "techNews");

    // Optional: Clear old news to keep the collection fresh for this demo
    const existingNews = await getDocs(newsRef);
    const batch = writeBatch(db);
    existingNews.forEach((d) => {
      batch.delete(doc(db, "techNews", d.id));
    });
    await batch.commit();

    // Insert new curated news
    for (const news of mockNews) {
      await addDoc(newsRef, {
        ...news,
        publishedAt: serverTimestamp(), // In reality, use the article's actual publish date
        fetchedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, message: "Tech news fetched and updated successfully", count: mockNews.length });
  } catch (error) {
    console.error("Error fetching tech news:", error);
    return NextResponse.json({ error: "Failed to fetch tech news" }, { status: 500 });
  }
}
