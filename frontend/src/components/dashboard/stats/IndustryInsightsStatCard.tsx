"use client";

import React, { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import { useRouter } from "next/navigation";

export default function IndustryInsightsStatCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ headline: "", source: "", category: "Industry Trends", whyItMatters: "", publishedAt: null as Date | null });

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const result = await res.json();
          if (result.data && result.data.length > 0) {
            const topDoc = result.data[0];
            setData({ 
              headline: topDoc.headline || "Industry Insights", 
              source: topDoc.source || "Industry News",
              category: topDoc.category || "Industry Trends",
              whyItMatters: topDoc.whyItMatters || "",
              publishedAt: new Date(topDoc.publishedAt)
            });
          }
        }
      } catch (error) {
        console.error("Error fetching industry insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  const getHoursAgo = (date: Date | null) => {
    if (!date) return "";
    const diff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60));
    return diff === 0 ? "Just now" : `${diff} hours ago`;
  };

  return (
    <>
      <div className="bg-background rounded-xl border border-muted p-6 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-foreground" />
            Industry Insights
          </h3>
          
          {loading ? (
             <div className="animate-pulse space-y-3">
               <div className="h-4 bg-muted rounded w-3/4"></div>
               <div className="h-4 bg-muted rounded w-1/2"></div>
             </div>
          ) : !data.headline ? (
            <div className="space-y-4 py-4">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                No insights available right now. Check back soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-muted text-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {data.category}
              </div>
              <h4 className="text-xl font-bold leading-tight line-clamp-2 hover:text-muted-foreground transition-colors cursor-pointer" onClick={() => router.push("/dashboard/insights")}>
                {data.headline}
              </h4>
              <p className="text-sm text-muted-foreground line-clamp-3">
                <span className="font-semibold text-foreground">Why it matters: </span>
                {data.whyItMatters}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-2 pt-2">
                <span className="font-medium text-foreground">{data.source}</span>
                <span>•</span>
                <span>{getHoursAgo(data.publishedAt)}</span>
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-8">
          <button 
            onClick={() => router.push("/dashboard/insights")}
            className="inline-flex items-center justify-center w-full bg-muted/50 border border-muted text-foreground font-medium text-sm px-4 py-3 rounded-lg hover:bg-muted transition-colors"
          >
            View All Insights →
          </button>
        </div>
      </div>
    </>
  );
}
