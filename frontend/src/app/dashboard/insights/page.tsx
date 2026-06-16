"use client";

import React, { useEffect, useState } from "react";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/dashboard/BackButton";

interface InsightItem {
  id: string;
  headline: string;
  whyItMatters: string;
  source: string;
  sourceUrl?: string;
  link?: string;
  category: string;
  publishedAt: any;
  fetchedAt: any;
}

export default function IndustryInsightsPage() {
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const result = await res.json();
          setInsights(result.data || []);
        }
      } catch (error) {
        console.error("Error fetching industry insights:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, []);

  const filteredInsights = filter === "All" ? insights : insights.filter(n => n.category === filter);

  const getHoursAgo = (dateStr: string) => {
    if (!dateStr) return "Unknown";
    const d = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60));
    if (diff < 1) return "Just now";
    if (diff < 24) return `${diff}h ago`;
    return `${Math.floor(diff / 24)}d ago`;
  };

  const categories = ["All", "Hiring", "Layoffs", "Funding", "Leadership", "Salary", "Industry Trend"];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BackButton />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Newspaper className="w-8 h-8 text-foreground" />
          Industry Insights
        </h1>
        <p className="text-muted-foreground mt-2">Curated, AI-summarized tech news and what it means for your career.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap ${
              filter === c 
                ? "bg-foreground text-background border-foreground" 
                : "bg-background text-foreground border-muted hover:border-foreground/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="py-20 text-center bg-background border border-muted rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Newspaper className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Insights Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            No insights available right now. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredInsights.map(item => (
            <div key={item.id} className="bg-background border border-muted rounded-xl p-6 hover:border-foreground/30 transition-colors shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="px-2 py-1 bg-muted rounded text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {item.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" /> {getHoursAgo(item.publishedAt)}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {item.source}
                    </span>
                  </div>
                  <h3 className="font-bold text-xl mb-4 leading-tight text-foreground hover:text-muted-foreground transition-colors">
                    <Link href={item.sourceUrl || item.link || "#"} target="_blank">{item.headline}</Link>
                  </h3>
                  
                  <div className="bg-muted/30 border border-muted rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-sm text-foreground mb-1">Why this matters:</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.whyItMatters}
                    </p>
                  </div>

                  <Link 
                    href={item.sourceUrl || item.link || "#"} 
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline transition-colors"
                  >
                    Read Full Article <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
