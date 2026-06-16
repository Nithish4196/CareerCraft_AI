"use client";

import React, { useState } from 'react';
import JobSearchHeader from '@/components/jobs/JobSearchHeader';
import JobSidebarFilters from '@/components/jobs/JobSidebarFilters';
import JobCard from '@/components/jobs/JobCard';
import JobDetailsPanel from '@/components/jobs/JobDetailsPanel';
import ApplicationTrackerView from '@/components/jobs/ApplicationTrackerView';
import { Job, mockJobs } from '@/types/job';
import { Sparkles } from 'lucide-react';

export default function JobsPage() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'tracker'>('search');
  const [visibleCount, setVisibleCount] = useState(3);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);

  const toggleSaveJob = (jobId: string) => {
    setSavedJobs(prev => prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]);
  };
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState({ role: "", location: "", experience: "", salary: "" });
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});

  const handleSearch = (q: any) => {
    if (typeof q === 'string') {
      // It's a chip click
      setSearchQuery(prev => ({ ...prev, role: q }));
      setActiveFilters({}); // Optional: clear filters on chip click to guarantee matches
    } else {
      setSearchQuery(q);
    }
    setVisibleCount(3); // Reset load more
  };

  const handleFilterChange = (category: string, item: string, isChecked: boolean) => {
    setActiveFilters(prev => {
      const current = prev[category] || [];
      if (isChecked) {
        return { ...prev, [category]: [...current, item] };
      } else {
        return { ...prev, [category]: current.filter(i => i !== item) };
      }
    });
    setVisibleCount(3); // Reset load more
  };

  const handleClearAll = () => {
    setActiveFilters({});
    setSearchQuery({ role: "", location: "", experience: "", salary: "" });
    setVisibleCount(3);
  };

  // Mock Filtering Logic
  const filteredJobs = mockJobs.filter(job => {
    let matches = true;
    
    // Role matching
    if (searchQuery.role) {
      let q = searchQuery.role.toLowerCase();
      // Handle common typos specifically for this demo
      if (q.includes("dana") || q.includes("analytic")) {
        q = "data analyst";
      }

      // Broaden search logic for mock testing
      if (q.includes("fresher")) {
        if (!job.experienceLevel.toLowerCase().includes("0-2") && !job.experienceLevel.toLowerCase().includes("fresher")) matches = false;
      } else if (q.includes("high package")) {
        if (job.salaryMin < 15) matches = false;
      } else {
        if (!job.role.toLowerCase().includes(q) && !job.companyName.toLowerCase().includes(q)) matches = false;
      }
    }

    // Location matching
    if (searchQuery.location) {
      let qLoc = searchQuery.location.toLowerCase();
      if (qLoc === "banglore") qLoc = "bangalore"; // Handle common typo
      if (!job.location.toLowerCase().includes(qLoc)) matches = false;
    }

    // Experience matching
    if (searchQuery.experience) {
      const exp = searchQuery.experience.toLowerCase();
      if (exp.includes("fresher")) {
        if (!job.experienceLevel.toLowerCase().includes("0-2") && !job.experienceLevel.toLowerCase().includes("fresher")) matches = false;
      } else {
        if (!job.experienceLevel.toLowerCase().includes(exp)) matches = false;
      }
    }

    // Salary matching
    if (searchQuery.salary) {
      const sal = parseInt(searchQuery.salary);
      if (job.salaryMin < sal) matches = false;
    }

    // Source Filter
    if (activeFilters.source && activeFilters.source.length > 0) {
      if (!activeFilters.source.includes(job.source)) matches = false;
    }

    return matches;
  });

  const visibleJobs = filteredJobs.slice(0, visibleCount);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Page Tabs */}
      <div className="flex items-center justify-between mb-6 border-b border-muted">
        <h1 className="text-3xl font-extrabold tracking-tight mb-4">Find Your Next Opportunity</h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'search' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Search Jobs
          </button>
          <button 
            onClick={() => setActiveTab('tracker')}
            className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tracker' ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Application Tracker
          </button>
        </div>
      </div>

      {activeTab === 'tracker' ? (
        <ApplicationTrackerView />
      ) : (
        <>
          {/* Header & Search */}
          <div>
            <JobSearchHeader 
              onSearch={handleSearch} 
              onChipSelect={(chip) => handleSearch(chip)} 
            />
          </div>

      {/* Recommended Section */}
      <div className="bg-foreground text-background rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles className="w-32 h-32" />
        </div>
        <h2 className="text-xl font-bold mb-2 flex items-center gap-2 relative z-10">
          <Sparkles className="w-5 h-5 text-background fill-current" /> Recommended For You
        </h2>
        <p className="text-background/80 text-sm mb-6 relative z-10 max-w-2xl">
          Based on your resume and skill profile, our AI engine has matched you with these highly relevant opportunities.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
          {mockJobs.slice(0, 3).map(job => (
            <div 
              key={job.id} 
              onClick={() => setSelectedJob(job)}
              className="bg-background/10 border border-background/20 rounded-xl p-4 cursor-pointer hover:bg-background/20 transition-colors backdrop-blur-sm"
            >
              <h3 className="font-bold">{job.role}</h3>
              <p className="text-sm opacity-90 mb-3">{job.companyName}</p>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span>₹{job.salaryMin}L - ₹{job.salaryMax}L</span>
                <span className="text-background">{job.aiMatch.score}% Match</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar */}
        <JobSidebarFilters 
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange} 
          onClearAll={handleClearAll}
        />

        {/* Right Job Feed */}
        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-lg">Showing {filteredJobs.length} Jobs</h2>
            <select className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer focus:ring-0">
              <option>Sort by: Best Match</option>
              <option>Sort by: Most Recent</option>
              <option>Sort by: Salary (High to Low)</option>
            </select>
          </div>

          <div className="space-y-4">
            {visibleJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                isSaved={savedJobs.includes(job.id)}
                onToggleSave={() => toggleSaveJob(job.id)}
                onClick={(job) => setSelectedJob(job)} 
              />
            ))}
            {visibleJobs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p>No matching opportunities found.</p>
              </div>
            )}
          </div>

          {/* Load More (Mock) */}
          {visibleCount < filteredJobs.length && (
            <button 
              onClick={() => setVisibleCount(v => v + 3)}
              className="w-full py-4 text-sm font-bold border border-muted rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-8"
            >
              Load More Opportunities
            </button>
          )}
        </div>
      </div>

      <JobDetailsPanel 
        job={selectedJob} 
        isSaved={selectedJob ? savedJobs.includes(selectedJob.id) : false}
        onToggleSave={() => selectedJob && toggleSaveJob(selectedJob.id)}
        onClose={() => setSelectedJob(null)} 
      />
        </>
      )}

    </div>
  );
}
