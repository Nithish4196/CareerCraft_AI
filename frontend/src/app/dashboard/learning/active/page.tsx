"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GraduationCap, ExternalLink, Award, PlayCircle, Clock } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/dashboard/BackButton";

interface CourseProgress {
  id: string;
  courseId: string;
  courseTitle: string;
  platform: string;
  totalModules: number;
  completedModules: number;
  status: "in_progress" | "completed";
  lastAccessed: any;
  completedAt?: any;
  certificateUrl?: string;
}

export default function ActiveLearningPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"in_progress" | "completed">("in_progress");

  useEffect(() => {
    if (!user) return;

    const coursesRef = collection(db, `users/${user.uid}/courseProgress`);
    const q = query(coursesRef, orderBy("lastAccessed", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as CourseProgress[];
      setCourses(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const activeCourses = courses.filter(c => c.status === "in_progress");
  const completedCourses = courses.filter(c => c.status === "completed").sort((a, b) => b.completedAt?.toDate().getTime() - a.completedAt?.toDate().getTime());

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BackButton />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-foreground" />
          Learning Center
        </h1>
        <p className="text-muted-foreground mt-2">Track your current courses, pick up where you left off, and review earned certificates.</p>
      </div>

      <div className="flex gap-4 mb-6 border-b border-muted pb-2 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setView("in_progress")}
          className={`pb-2 px-1 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${view === "in_progress" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          In Progress ({activeCourses.length})
        </button>
        <button 
          onClick={() => setView("completed")}
          className={`pb-2 px-1 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${view === "completed" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          Completed ({completedCourses.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : view === "in_progress" ? (
        activeCourses.length === 0 ? (
          <div className="py-20 text-center bg-background border border-muted rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <PlayCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Active Courses</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Ready to learn something new? Check out the Learning Hub for recommended courses.
            </p>
            <Link 
              href="/dashboard/learning" 
              className="inline-block px-6 py-3 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Explore Learning Hub →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeCourses.map(course => {
              const progress = Math.round((course.completedModules / course.totalModules) * 100);
              return (
                <div key={course.id} className="bg-background border border-muted hover:border-foreground/30 rounded-xl p-5 md:p-6 transition-all shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-foreground bg-muted px-2 py-1 rounded">
                          {course.platform}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Last active {formatDate(course.lastAccessed)}
                        </span>
                      </div>
                      <h3 className="font-bold text-lg leading-tight mb-3">{course.courseTitle}</h3>
                      
                      {/* Progress Bar */}
                      <div className="w-full">
                        <div className="flex justify-between text-xs mb-1 text-muted-foreground font-medium">
                          <span>{course.completedModules} / {course.totalModules} Modules</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Link 
                      href={`/dashboard/learning?course=${course.courseId}`}
                      className="shrink-0 w-full md:w-auto text-center px-6 py-2.5 bg-foreground text-background font-medium text-sm rounded-lg hover:bg-foreground/90 transition-colors"
                    >
                      Resume Learning
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        completedCourses.length === 0 ? (
          <div className="py-20 text-center bg-background border border-muted rounded-xl shadow-sm">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Certificates Yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Finish your active courses to earn certificates and add them to your profile.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedCourses.map(course => (
              <div key={course.id} className="bg-background border border-muted rounded-xl p-5 hover:border-foreground/30 transition-colors shadow-sm">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Award className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-bold mb-1 leading-tight">{course.courseTitle}</h3>
                <div className="text-sm text-muted-foreground mb-4">
                  Completed {formatDate(course.completedAt)} • {course.platform}
                </div>
                {course.certificateUrl ? (
                  <Link 
                    href={course.certificateUrl}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                  >
                    View Certificate <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Certificate not provided</span>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
