"use client";

import React, { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function ResumeProgress() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [percentage, setPercentage] = useState(0);
  const [feedbackText, setFeedbackText] = useState("Upload or build your resume to see your score.");
  const [hasResume, setHasResume] = useState(false);
  const [offset, setOffset] = useState(0);

  const circleRadius = 45;
  const circumference = 2 * Math.PI * circleRadius;

  useEffect(() => {
    if (!user) return;

    const resumesRef = collection(db, `users/${user.uid}/resumes`);
    const q = query(resumesRef, orderBy("updatedAt", "desc"), limit(1));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestResume = snapshot.docs[0].data();
        const score = latestResume.atsScore || 0;
        
        setPercentage(score);
        setHasResume(true);

        const analysis = latestResume.analysis || {};
        const sectionScores = analysis.sectionScores || {};
        const improvementTips = analysis.improvementTips || [];
        const missingKeywords = analysis.missingKeywords || [];

        // Find weakest section
        let weakestSection = "experience";
        let lowestScore = 100;
        for (const [section, val] of Object.entries(sectionScores)) {
          if (typeof val === 'number' && val < lowestScore) {
            lowestScore = val;
            weakestSection = section;
          }
        }

        const missingItem = missingKeywords.length > 0 ? missingKeywords[0] : (improvementTips.length > 0 ? improvementTips[0].toLowerCase() : "details");

        let text = "";
        if (score === 0) {
          text = "Upload or build your resume to see your score.";
        } else if (score >= 1 && score <= 40) {
          text = `Your resume needs work. Your ${weakestSection} section is the biggest gap — let's fix that first.`;
        } else if (score >= 41 && score <= 60) {
          text = `You're making progress. Focus on your ${weakestSection} section to boost your score.`;
        } else if (score >= 61 && score <= 80) {
          text = `Good foundation. Add more ${missingItem} to push higher.`;
        } else if (score >= 81 && score <= 94) {
          text = `Your resume is looking great! Add a few more ${missingItem} to reach 100%.`;
        } else {
          text = "Excellent! Your resume is in top shape for ATS systems.";
        }

        setFeedbackText(text);

      } else {
        setPercentage(0);
        setHasResume(false);
        setFeedbackText("Upload or build your resume to see your score.");
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const progressOffset = circumference - (percentage / 100) * circumference;
    setOffset(progressOffset);
  }, [percentage, circumference]);

  const handleClick = () => {
    if (hasResume) {
      router.push("/dashboard/resume/editor");
    } else {
      router.push("/dashboard/resume/score");
    }
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-background rounded-xl border border-muted p-6 shadow-sm flex items-center justify-between cursor-pointer hover:border-foreground/30 transition-colors"
    >
      <div>
        <h3 className="text-lg font-bold mb-1">Resume Level</h3>
        <p className="text-sm text-muted-foreground max-w-[200px]">
          {feedbackText}
        </p>
      </div>
      
      <div className="relative flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            className="text-muted"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={circleRadius}
            cx="64"
            cy="64"
          />
          {/* Progress Circle */}
          <circle
            className="text-foreground transition-all duration-1000 ease-out"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={circleRadius}
            cx="64"
            cy="64"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <FileText className="w-5 h-5 text-foreground mb-1" />
          <span className="text-xl font-bold tracking-tight">{percentage}%</span>
        </div>
      </div>
    </div>
  );
}
