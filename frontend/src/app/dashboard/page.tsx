"use client";

import React, { useState } from "react";
import { Sparkles, Target } from "lucide-react";
import Link from "next/link";
import ActivityHeatmap from "@/components/dashboard/ActivityHeatmap";
import ResumeProgress from "@/components/dashboard/ResumeProgress";

import ResumeStatCard from "@/components/dashboard/stats/ResumeStatCard";
import JobsStatCard from "@/components/dashboard/stats/JobsStatCard";
import TrendingJobsStatCard from "@/components/dashboard/stats/TrendingJobsStatCard";
import ActiveLearningStatCard from "@/components/dashboard/stats/ActiveLearningStatCard";
import WeeklyActivityStatCard from "@/components/dashboard/stats/WeeklyActivityStatCard";
import InterviewsStatCard from "@/components/dashboard/stats/InterviewsStatCard";
import RecommendedActions from "@/components/dashboard/RecommendedActions";
import IndustryInsightsStatCard from "@/components/dashboard/stats/IndustryInsightsStatCard";

export default function DashboardPage() {

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Career Explorer!</h1>
          <p className="text-muted-foreground mt-1">Here's your career progress overview for today.</p>
        </div>
        <Link 
          href="/dashboard/roadmaps"
          className="inline-flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:bg-foreground/90 transition-colors shadow-sm w-fit"
        >
          <Sparkles className="w-4 h-4" />
          Build New Roadmap
        </Link>
      </div>

      {/* Progress & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ResumeProgress />
        </div>
        <div className="lg:col-span-2">
          <ActivityHeatmap />
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <ResumeStatCard />
        <JobsStatCard />
        <TrendingJobsStatCard />
        <ActiveLearningStatCard />
        <WeeklyActivityStatCard />
        <InterviewsStatCard />
      </div>

      {/* Recent Activity / Next Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecommendedActions />
        <IndustryInsightsStatCard />
      </div>
    </div>
  );
}
