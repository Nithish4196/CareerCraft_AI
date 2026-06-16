"use client";

import React, { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TrendingUp, Building2, MapPin, DollarSign, ExternalLink, Briefcase } from "lucide-react";
import Link from "next/link";
import BackButton from "@/components/dashboard/BackButton";

interface TrendingJob {
  id: string;
  role: string;
  companies: string[];
  salaryRange: string;
  vacancyLevel: string; // High, Medium, Low
  isHot: boolean;
}

const getVacancyColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "high": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    case "medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    case "low": return "text-red-500 bg-red-500/10 border-red-500/20";
    default: return "text-muted-foreground bg-muted border-muted";
  }
};

export default function TrendingJobsPage() {
  const [jobs, setJobs] = useState<TrendingJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this might come from a global 'trendingJobs' collection
    const jobsRef = collection(db, "trendingJobs");
    const q = query(jobsRef, orderBy("isHot", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TrendingJob[];
      
      // Fallback data if collection is empty
      if (data.length === 0) {
        setJobs([
          { id: "1", role: "AI Prompt Engineer", companies: ["OpenAI", "Anthropic", "Google"], salaryRange: "₹15L - ₹30L", vacancyLevel: "High", isHot: true },
          { id: "2", role: "Frontend Developer (Next.js)", companies: ["Vercel", "Stripe", "Airbnb"], salaryRange: "₹12L - ₹28L", vacancyLevel: "High", isHot: true },
          { id: "3", role: "Data Engineer", companies: ["Snowflake", "Databricks", "Amazon"], salaryRange: "₹18L - ₹35L", vacancyLevel: "Medium", isHot: false },
          { id: "4", role: "Cloud Security Architect", companies: ["Microsoft", "CrowdStrike", "Palo Alto"], salaryRange: "₹25L - ₹50L", vacancyLevel: "Low", isHot: false },
        ]);
      } else {
        setJobs(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BackButton />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-foreground" />
          Trending Jobs
        </h1>
        <p className="text-muted-foreground mt-2">Discover high-demand roles, top hiring companies, and market salary ranges.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="bg-background border border-muted hover:border-foreground/30 rounded-xl p-6 transition-colors shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-xl">{job.role}</h3>
                    {job.isHot && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-foreground text-background">
                        HOT
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Hiring Now
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${getVacancyColor(job.vacancyLevel)}`}>
                    {job.vacancyLevel} Demand
                  </div>
                  <div className="text-lg font-bold flex items-center text-foreground">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    {job.salaryRange}
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Top Companies Hiring
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.companies.map((company, i) => (
                    <span key={i} className="px-3 py-1.5 bg-background border border-muted rounded-md text-sm font-medium">
                      {company}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Link 
                  href={`/dashboard/jobs?search=${encodeURIComponent(job.role)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background font-medium text-sm rounded-lg hover:bg-foreground/90 transition-colors"
                >
                  Find Openings <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
