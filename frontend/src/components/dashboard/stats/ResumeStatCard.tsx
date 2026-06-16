"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FileText } from "lucide-react";
import StatCardWrapper from "./StatCardWrapper";
import { useRouter } from "next/navigation";

export default function ResumeStatCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [resumeData, setResumeData] = useState<{ score: number | null, total: number }>({
    score: null,
    total: 0
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const resumesRef = collection(db, `users/${user.uid}/resumes`);
    const q = query(resumesRef, orderBy("updatedAt", "desc")); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setResumeData({ score: null, total: 0 });
      } else {
        let highestScore = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.atsScore && data.atsScore > highestScore) {
            highestScore = data.atsScore;
          }
        });
        
        setResumeData({ 
          score: highestScore > 0 ? highestScore : null, 
          total: snapshot.docs.length 
        });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching resumes:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const hasResume = resumeData.total > 0;
  
  const valueDisplay = hasResume ? (
    <div className="flex items-center gap-2">
      {resumeData.score !== null ? `${resumeData.score}/100` : "0/100"}
      {resumeData.total > 1 && (
        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full" title={`Best of ${resumeData.total} resumes`}>
          Best of {resumeData.total}
        </span>
      )}
    </div>
  ) : (
    "0%"
  );

  const handleClick = () => {
    if (hasResume) {
      router.push("/dashboard/resume/editor"); 
    } else {
      router.push("/dashboard/resume/score");
    }
  };

  return (
    <StatCardWrapper
      title="Resume Score"
      value={valueDisplay}
      subtext={hasResume ? (resumeData.score ? "Based on ATS checks" : "Edit to calculate score") : "Upload your resume to see your score"}
      icon={FileText}
      colorClass="bg-muted text-foreground"
      link="#"
      onClick={handleClick}
      isLoading={loading}
    />
  );
}
