"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";
import { useRouter } from "next/navigation";

export default function InterviewsStatCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ total: 0, avgScore: 0 });

  useEffect(() => {
    if (!user) return;

    const interviewsRef = collection(db, `users/${user.uid}/mockInterviews`);
    
    const unsubscribe = onSnapshot(interviewsRef, (snapshot) => {
      let total = snapshot.docs.length;
      let sum = 0;
      let countWithScore = 0;

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (typeof d.overallScore === 'number') {
          sum += d.overallScore;
          countWithScore++;
        }
      });
      
      const avgScore = countWithScore > 0 ? Math.round(sum / countWithScore) : 0;
      
      setData({ total, avgScore });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching mock interviews:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const hasInterviews = data.total > 0;

  return (
    <StatCardWrapper
      title="Mock Interviews"
      value={hasInterviews ? `${data.total} Taken` : "0 Taken"}
      subtext={hasInterviews ? `Avg Score: ${data.avgScore}` : "Take your first mock interview →"}
      icon={Video}
      colorClass="bg-muted text-foreground"
      link="#"
      onClick={() => router.push("/dashboard/interviews/history")}
      isLoading={loading}
    />
  );
}
