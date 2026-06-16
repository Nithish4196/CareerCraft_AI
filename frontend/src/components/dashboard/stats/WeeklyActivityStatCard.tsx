"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";
import { useRouter } from "next/navigation";

export default function WeeklyActivityStatCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ thisWeekCount: 0, lastWeekCount: 0 });

  useEffect(() => {
    if (!user) return;

    const logRef = collection(db, `users/${user.uid}/activityLog`);
    
    const unsubscribe = onSnapshot(logRef, (snapshot) => {
      let thisWeek = 0;
      let lastWeek = 0;
      
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(now.getDate() - 14);

      snapshot.docs.forEach(doc => {
        // doc.id is YYYY-MM-DD
        const docDate = new Date(doc.id);
        const data = doc.data();
        
        if (docDate >= oneWeekAgo && docDate <= now) {
          thisWeek += data.actions || 0;
        } else if (docDate >= twoWeeksAgo && docDate < oneWeekAgo) {
          lastWeek += data.actions || 0;
        }
      });
      
      setData({ thisWeekCount: thisWeek, lastWeekCount: lastWeek });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activity:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const diff = data.thisWeekCount - data.lastWeekCount;
  const diffText = diff >= 0 ? `+${diff} vs last week` : `${diff} vs last week`;
  const hasLogs = data.thisWeekCount > 0;

  return (
    <StatCardWrapper
      title="Weekly Activity"
      value={hasLogs ? `${data.thisWeekCount} Actions` : "0 Actions"}
      subtext={hasLogs ? `${diffText}` : "Log your first action →"}
      icon={Activity}
      colorClass="bg-muted text-foreground"
      link="#"
      onClick={() => router.push("/dashboard/activity")}
      isLoading={loading}
    />
  );
}
