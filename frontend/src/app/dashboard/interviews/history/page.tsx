"use client";

import React, { useEffect, useState } from "react";
import { Video, ExternalLink, Target, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import BackButton from "@/components/dashboard/BackButton";

interface MockInterviewSession {
  id: string;
  date: any;
  roleTarget: string;
  overallScore: number;
  roundsCompleted: { type: string; score: number; feedback: string }[];
  strengths: string[];
  improvements: string[];
}

export default function MockInterviewHistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<MockInterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<MockInterviewSession | null>(null);

  useEffect(() => {
    if (!user) return;

    const sessionsRef = collection(db, `users/${user.uid}/mockInterviews`);
    const q = query(sessionsRef, orderBy("date", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MockInterviewSession[];
      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (score >= 60) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BackButton />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Video className="w-8 h-8 text-foreground" />
          Mock Interview History
        </h1>
        <p className="text-muted-foreground mt-2">Review past sessions, scores, and AI feedback.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-20 text-center bg-background border border-muted rounded-xl shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Mock Interviews Yet</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Practice makes perfect. Simulate real interviews across Aptitude, Coding, and HR rounds.
          </p>
          <Link 
            href="/dashboard/interviews" 
            className="inline-block px-6 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors"
          >
            Take Your First Interview →
          </Link>
        </div>
      ) : selectedSession ? (
        /* Detailed Report View */
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
          <button 
            onClick={() => setSelectedSession(null)}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
          >
            ← Back to History List
          </button>

          <div className="bg-muted/10 border border-muted rounded-2xl p-8 text-center relative overflow-hidden shadow-sm">
            <div className="absolute -top-10 -right-10 opacity-5">
              <Target className="w-48 h-48" />
            </div>
            <h3 className="text-lg font-bold text-muted-foreground">{selectedSession.roleTarget} Assessment</h3>
            <div className="text-sm text-muted-foreground mt-1">{formatDate(selectedSession.date)}</div>
            
            <div className="mt-8 mb-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-foreground/20 relative">
                <div className="text-4xl font-extrabold text-foreground">{selectedSession.overallScore}%</div>
              </div>
            </div>
            <p className="text-sm font-medium max-w-md mx-auto">
              Solid performance! Your technical depth is excellent, but communication structure needs refinement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
              <h4 className="font-bold flex items-center gap-2 mb-4 text-emerald-500">
                <CheckCircle className="w-5 h-5" /> Top Strengths
              </h4>
              <ul className="space-y-3">
                {selectedSession.strengths?.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
              <h4 className="font-bold flex items-center gap-2 mb-4 text-amber-500">
                <XCircle className="w-5 h-5" /> Areas to Improve
              </h4>
              <ul className="space-y-3">
                {selectedSession.improvements?.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-4">Round Breakdown</h4>
            <div className="space-y-4">
              {selectedSession.roundsCompleted?.map((round, i) => (
                <div key={i} className="bg-background border border-muted rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-bold">{round.type} Round</h5>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getScoreColor(round.score)}`}>
                      {round.score}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{round.feedback}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* History List */
        <div className="space-y-4">
          {sessions.map(session => (
            <div key={session.id} className="bg-background border border-muted hover:border-foreground/30 rounded-xl p-5 transition-all shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-bold text-lg">{session.roleTarget}</h3>
                  <div className="text-sm text-muted-foreground mt-1">Taken on {formatDate(session.date)}</div>
                  <div className="flex gap-2 mt-3">
                    {session.roundsCompleted?.map((r, i) => (
                      <span key={i} className="text-xs font-medium bg-muted/50 px-2 py-1 rounded-md">
                        {r.type}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Score</div>
                    <div className={`text-xl font-bold px-3 py-1 rounded-lg border ${getScoreColor(session.overallScore)}`}>
                      {session.overallScore}%
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedSession(session)}
                    className="px-4 py-2 border border-muted hover:bg-muted font-medium text-sm rounded-lg transition-colors flex items-center gap-2"
                  >
                    View Report <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
