"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";
import { useRouter } from "next/navigation";

export default function ActiveLearningStatCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ inProgress: 0, completed: 0, total: 0 });

  useEffect(() => {
    if (!user) return;

    const coursesRef = collection(db, `users/${user.uid}/courseProgress`);
    
    const unsubscribe = onSnapshot(coursesRef, (snapshot) => {
      let inProgress = 0;
      let completed = 0;
      
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.status === "in_progress") {
          inProgress++;
        } else if (d.status === "completed") {
          completed++;
        }
      });
      
      setData({ inProgress, completed, total: snapshot.docs.length });
      setLoading(false);
    }, (error) => {
      console.error("Error fetching course progress:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalCourses = data.total;
  const activeCount = data.inProgress;
  const completedCount = data.completed;

  return (
    <StatCardWrapper
      title="Active Learning"
      value={totalCourses > 0 ? `${activeCount} in progress` : "0 in progress"}
      subtext={totalCourses > 0 ? `${completedCount} courses completed` : "Start learning →"}
      icon={GraduationCap}
      colorClass="bg-muted text-foreground"
      link="#"
      onClick={() => router.push("/dashboard/learning/active")}
      isLoading={loading}
    />
  );
}
