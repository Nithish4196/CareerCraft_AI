"use client";

import React, { useState } from 'react';
import { COURSE_DATA, CareerPath } from '@/types/learning';
import PathCard from '@/components/learning/PathCard';
import CourseCard from '@/components/learning/CourseCard';
import VideoCard from '@/components/learning/VideoCard';
import RoadmapTimeline from '@/components/learning/RoadmapTimeline';
import { 
  Search, X, Map as MapIcon, PlayCircle, BookOpen, 
  ArrowLeft, SearchX, Route, Video
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';

export default function LearningHubPage() {
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<CareerPath | null>(null);
  const [activeTab, setActiveTab] = useState<"courses" |"roadmap" |"videos">("courses");
  const [courseFilter, setCourseFilter] = useState<"all" |"certification" |"free" |"high">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const paths = Object.values(COURSE_DATA);

  // Filter paths for Home View
  const filteredPaths = paths.filter(path => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return path.title.toLowerCase().includes(q) || path.description.toLowerCase().includes(q);
  });

  // Home View
  if (!selectedPath) {
    return (
      <div className="space-y-8 pb-10">
        
        {/* Header Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Learning Hub</h1>
            <p className="text-muted-foreground text-lg">Choose a career path to explore courses, roadmaps, and source videos.</p>
          </div>

          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search career paths or skills (e.g. Python, React, SQL…)"
              className="w-full bg-background border border-muted rounded-2xl pl-12 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-foreground/20 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 ease-out rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-muted">
              <Route className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-foreground">12</span>
              <span className="text-sm text-muted-foreground font-medium">Career Paths</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-muted">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-foreground">200+</span>
              <span className="text-sm text-muted-foreground font-medium">Free Courses</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full border border-muted">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span className="font-bold text-foreground">500+</span>
              <span className="text-sm text-muted-foreground font-medium">Source Videos</span>
            </div>
          </div>
        </div>

        {/* Path Grid */}
        {filteredPaths.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-4">
            {filteredPaths.map(path => (
              <PathCard key={path.id} path={path} onClick={(p) => {
                setSelectedPath(p);
                if (user) logActivity(user.uid, "coursesStudied");
              }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-muted border-dashed rounded-2xl bg-muted/10">
            <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">No paths match"{searchQuery}"</h3>
            <p className="text-muted-foreground">Try a skill like"Python","React", or"SQL".</p>
            <button 
              onClick={() => setSearchQuery("")}
              className="mt-6 px-6 py-2 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors duration-150 ease-out transition-colors"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    );
  }

  // Detail View
  const Icon = selectedPath.icon;
  
  // Filter courses for the selected path
  const filteredCourses = selectedPath.courses.filter(course => {
    if (courseFilter ==="all") return true;
    if (courseFilter ==="certification") return course.type ==="certification";
    if (courseFilter ==="free") return course.free;
    if (courseFilter ==="high") return course.demand ==="high";
    return true;
  });

  return (
    <div className="space-y-8 pb-10">
      
      {/* Detail Header */}
      <div className="border-b border-muted pb-8 space-y-6">
        <button 
          onClick={() => { setSelectedPath(null); setActiveTab("courses"); }}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Paths
        </button>

        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-8 h-8 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">{selectedPath.title}</h1>
            <p className="text-muted-foreground font-medium">{selectedPath.description}</p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-2">
          <button 
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border ${
              activeTab ==="courses" 
                ?"bg-foreground text-background border-foreground" 
                :"bg-background text-muted-foreground border-muted hover:border-foreground/50 hover:text-foreground"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Courses
          </button>
          <button 
            onClick={() => setActiveTab("roadmap")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border ${
              activeTab ==="roadmap" 
                ?"bg-foreground text-background border-foreground" 
                :"bg-background text-muted-foreground border-muted hover:border-foreground/50 hover:text-foreground"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Career Roadmap
          </button>
          <button 
            onClick={() => setActiveTab("videos")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold border ${
              activeTab ==="videos" 
                ?"bg-foreground text-background border-foreground" 
                :"bg-background text-muted-foreground border-muted hover:border-foreground/50 hover:text-foreground"
            }`}
          >
            <PlayCircle className="w-4 h-4" />
            Source Videos
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        
        {/* COURSES TAB */}
        {activeTab ==="courses" && (
          <div className="space-y-6">
            {/* Course Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-muted-foreground mr-2">Filter:</span>
              {[
                { id:"all", label:"All Courses" },
                { id:"certification", label:"Certifications" },
                { id:"free", label:"Free Courses" },
                { id:"high", label:"High Demand" }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setCourseFilter(f.id as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                    courseFilter === f.id
                      ?"bg-foreground text-background border-foreground"
                      :"bg-background text-muted-foreground border-muted hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
              {filteredCourses.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-muted rounded-2xl">
                  No courses match the selected filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab ==="roadmap" && (
          <div className="bg-muted/10 border border-muted rounded-3xl p-4 sm:p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Step-by-Step Curriculum</h2>
              <p className="text-muted-foreground">Follow this roadmap to master the {selectedPath.title} role.</p>
            </div>
            <RoadmapTimeline roadmap={selectedPath.roadmap} />
          </div>
        )}

        {/* VIDEOS TAB */}
        {activeTab ==="videos" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedPath.videos.map(video => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
