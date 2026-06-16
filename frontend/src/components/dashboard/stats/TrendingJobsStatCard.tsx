"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";
import { useRouter } from "next/navigation";

export default function TrendingJobsStatCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ topRole: "", growthPercent: 0, totalTrending: 0 });

  useEffect(() => {
    // Query the global trendingJobs collection
    const trendingRef = collection(db, "trendingJobs");
    // Get the top ranked one by growthPercent descending
    const q = query(trendingRef, orderBy("growthPercent", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const topDoc = snapshot.docs[0].data();
        setData({ 
          topRole: topDoc.roleName || "Data Analyst", 
          growthPercent: topDoc.growthPercent || 0,
          totalTrending: snapshot.docs.length
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trending jobs:", error);
      // Fallback data if collection doesn't exist yet
      setData({ topRole: "Software Engineer", growthPercent: 18, totalTrending: 12 });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <StatCardWrapper
      title="Trending Jobs"
      value="Market Insights"
      subtext="View high-demand roles →"
      icon={TrendingUp}
      colorClass="bg-muted text-foreground"
      link="#"
      onClick={() => router.push("/dashboard/trending-jobs")}
      isLoading={loading}
    />
  );
}
