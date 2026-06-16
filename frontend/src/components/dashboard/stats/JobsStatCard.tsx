"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Briefcase } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";
import { useRouter } from "next/navigation";

export default function JobsStatCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ total: 0, thisWeek: 0 });

  useEffect(() => {
    if (!user) return;

    const jobsRef = collection(db, `users/${user.uid}/appliedJobs`);
    
    const unsubscribe = onSnapshot(jobsRef, (snapshot) => {
      let total = snapshot.docs.length;
      let thisWeek = 0;
      
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        let appliedDate = null;
        if (d.appliedDate?.toDate) {
          appliedDate = d.appliedDate.toDate();
        } else if (d.appliedDate) {
          appliedDate = new Date(d.appliedDate);
        }

        if (appliedDate && appliedDate >= oneWeekAgo) {
          thisWeek++;
        }
      });
      
      setData({ total, thisWeek });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching applied jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const hasJobs = data.total > 0;

  return (
    <StatCardWrapper
      title="Applied Jobs"
      value={hasJobs ? `${data.total} Total` : "0 Total"}
      subtext={hasJobs ? `${data.thisWeek} in last 7 days` : "Start applying →"}
      icon={Briefcase}
      colorClass="bg-muted text-foreground"
      link="#"
      onClick={() => router.push("/dashboard/jobs/tracker")}
      isLoading={loading}
    />
  );
}
