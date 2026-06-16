"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Recommendation {
  title: string;
  desc: string;
  action: string;
  link: string;
  priority: number;
}

export default function RecommendedActions() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchRecommendations = async () => {
      try {
        const recs: Recommendation[] = [];

        // 1. Check Resumes (Priority 1)
        const resumesSnap = await getDocs(query(collection(db, `users/${user.uid}/resumes`), orderBy("updatedAt", "desc"), limit(1)));
        if (!resumesSnap.empty) {
          const resume = resumesSnap.docs[0].data();
          if (resume.atsScore < 90 || (resume.analysis?.missingKeywords && resume.analysis.missingKeywords.length > 0)) {
            const topKeywords = resume.analysis?.missingKeywords?.slice(0, 2).join("' and '") || "key skills";
            recs.push({
              title: "Improve Resume Keywords",
              desc: `Add '${topKeywords}' to match recent job applications.`,
              action: "Edit Resume →",
              link: "/dashboard/resume/editor",
              priority: 1
            });
          }
        }

        // 2. Check Mock Interviews (Priority 2)
        const interviewsSnap = await getDocs(query(collection(db, `users/${user.uid}/mockInterviews`), orderBy("date", "desc"), limit(1)));
        if (!interviewsSnap.empty) {
          const session = interviewsSnap.docs[0].data();
          let lowestRound = null;
          let lowestScore = 100;
          session.roundsCompleted?.forEach((r: any) => {
            if (r.score < lowestScore) {
              lowestScore = r.score;
              lowestRound = r.type;
            }
          });

          if (lowestScore < 70 && lowestRound) {
            recs.push({
              title: `Practice ${lowestRound}`,
              desc: `Your score in the last ${lowestRound} round was ${lowestScore}%.`,
              action: "Start Interview →",
              link: "/dashboard/interviews",
              priority: 2
            });
          }
        }

        // 3. Check Saved Jobs (Priority 3)
        // Assume we check saved jobs where matchScore >= 80 and not applied. 
        // For now, we mock reading from appliedJobs/savedJobs. We will just query savedJobs collection if it existed.
        const savedJobsSnap = await getDocs(query(collection(db, `users/${user.uid}/savedJobs`), limit(1)));
        if (!savedJobsSnap.empty) {
          const job = savedJobsSnap.docs[0].data();
          // Assuming job has matchScore
          if (job.matchScore >= 80) {
            recs.push({
              title: "Apply to Saved Job",
              desc: `${job.role || 'Role'} at ${job.company || 'Company'} matches ${job.matchScore}% of your skills.`,
              action: "View Job →",
              link: "/dashboard/jobs",
              priority: 3
            });
          }
        }

        // 4. Check Roadmap (Priority 4)
        // Omitted for brevity unless roadmap collection is present

        // 5. Check Learning (Priority 5)
        const coursesSnap = await getDocs(query(collection(db, `users/${user.uid}/courseProgress`)));
        const staleCourse = coursesSnap.docs.find(d => {
          const data = d.data();
          if (data.status === "in_progress" && data.lastAccessed) {
            const diffDays = (Date.now() - data.lastAccessed.toDate().getTime()) / (1000 * 3600 * 24);
            return diffDays >= 3;
          }
          return false;
        });

        if (staleCourse) {
          const data = staleCourse.data();
          recs.push({
            title: `Continue ${data.courseTitle}`,
            desc: `You haven't continued this course in a few days. Keep learning!`,
            action: "Resume Course →",
            link: `/dashboard/learning?course=${staleCourse.id}`,
            priority: 5
          });
        }

        // Sort by priority
        recs.sort((a, b) => a.priority - b.priority);

        let userHasActivity = false;

        // Check if user has ANY activity across the app
        const anyResumes = !resumesSnap.empty;
        const anyInterviews = !interviewsSnap.empty;
        const anySavedJobs = !savedJobsSnap.empty;
        const anyCourses = !coursesSnap.empty;
        // Check if any activity log exists
        const activitySnap = await getDocs(query(collection(db, `users/${user.uid}/activityLog`), limit(1)));
        const anyActivity = !activitySnap.empty;

        userHasActivity = anyResumes || anyInterviews || anySavedJobs || anyCourses || anyActivity;

        if (!userHasActivity) {
          setRecommendations([]);
          setLoading(false);
          return;
        }

        // We have some activity, but might not have 3 primary recommendations
        // Pad with fallbacks if needed
        const fallbacks: Recommendation[] = [];

        if (!anyResumes) {
          fallbacks.push({
            title: "Get your resume scored",
            desc: "Upload or build your resume to see your ATS score and get personalized tips.",
            action: "Start Resume →",
            link: "/dashboard/resume/score",
            priority: 10
          });
        } else if (resumesSnap.docs[0].data().atsScore < 80) {
          fallbacks.push({
            title: "Push your resume higher",
            desc: `Your resume is at ${resumesSnap.docs[0].data().atsScore || 0}%. A few tweaks could get you ATS-ready.`,
            action: "Edit Resume →",
            link: "/dashboard/resume/editor",
            priority: 14
          });
        }

        if (!anyInterviews) {
          fallbacks.push({
            title: "Try a mock interview",
            desc: "Practice with an AI interviewer to see where you stand.",
            action: "Start Interview →",
            link: "/dashboard/interviews",
            priority: 11
          });
        }

        // Omit Roadmap fallback check since we don't have roadmap subcollection queried right now, 
        // we'll just add "Build a career roadmap" as a general fallback if needed.
        fallbacks.push({
          title: "Build a career roadmap",
          desc: "Get a personalized week-by-week plan for your target role.",
          action: "Build Roadmap →",
          link: "/dashboard/roadmaps",
          priority: 12
        });

        if (!anyCourses) {
          fallbacks.push({
            title: "Explore the Learning Hub",
            desc: "Browse curated courses for your target role.",
            action: "Browse Courses →",
            link: "/dashboard/learning",
            priority: 13
          });
        }

        fallbacks.push({
          title: "Keep up the momentum",
          desc: "You're making progress. Check your dashboard activity to see how far you've come.",
          action: "View Activity →",
          link: "/dashboard/activity",
          priority: 15
        });

        // Add fallbacks to recs without duplicates (by title), until we have 3
        for (const fb of fallbacks) {
          if (recs.length >= 3) break;
          if (!recs.find(r => r.title === fb.title)) {
            recs.push(fb);
          }
        }

        setRecommendations(recs.slice(0, 3));
        setLoading(false);

      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [user]);

  if (loading) {
    return (
      <div className="bg-background rounded-xl border border-muted p-6 shadow-sm flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  // If 0 activity, hide completely as per user request
  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-background rounded-xl border border-muted p-6 shadow-sm h-full flex flex-col">
      <h3 className="text-lg font-bold mb-4">Recommended Next Steps</h3>
      
      <div className="space-y-4 flex-1">
        {recommendations.map((item, i) => (
          <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-muted/30 border border-muted/50 hover:bg-muted/50 transition-colors">
            <div>
              <h4 className="font-medium text-sm">{item.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
            </div>
            <Link href={item.link} className="text-xs font-medium text-background bg-foreground hover:bg-foreground/90 px-3 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0">
              {item.action}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
