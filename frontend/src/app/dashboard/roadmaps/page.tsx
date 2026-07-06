"use client";

import React, { useState, useEffect } from 'react';
import { CareerRoadmap, RoadmapRequest, generateMockRoadmap } from '@/types/roadmap';
import LandingForm from '@/components/roadmaps/LandingForm';
import GeneratingScreen from '@/components/roadmaps/GeneratingScreen';
import RoadmapView from '@/components/roadmaps/RoadmapView';
import SavedRoadmaps from '@/components/roadmaps/SavedRoadmaps';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';

type AppState ="landing" |"generating" |"roadmap" |"saved";

export default function RoadmapsPage() {
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppState>("landing");
  const [currentRequest, setCurrentRequest] = useState<RoadmapRequest | null>(null);
  const [currentRoadmap, setCurrentRoadmap] = useState<CareerRoadmap | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<CareerRoadmap[]>([]);

  // Load saved roadmaps from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("careerpilot_saved_roadmaps");
      if (stored) {
        setSavedRoadmaps(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved roadmaps", e);
    }
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem("careerpilot_saved_roadmaps", JSON.stringify(savedRoadmaps));
    } catch (e) {
      console.error("Failed to save roadmaps to local storage", e);
    }
  }, [savedRoadmaps]);

  const handleGenerate = (req: RoadmapRequest) => {
    if (user) logActivity(user.uid, "roadmapTasksCompleted");
    setCurrentRequest(req);
    setAppState("generating");
    
    // Simulate API Call delay
    setTimeout(() => {
      const roadmap = generateMockRoadmap(req);
      setCurrentRoadmap(roadmap);
      setAppState("roadmap");
    }, 12000); // 12 seconds to allow all messages to rotate
  };

  const handleSaveRoadmap = () => {
    if (!currentRoadmap) return;
    setSavedRoadmaps(prev => {
      // Check if already saved
      if (prev.find(p => p.id === currentRoadmap.id)) return prev;
      return [currentRoadmap, ...prev];
    });
  };

  const handleViewSaved = () => {
    setAppState("saved");
  };

  const handleBackToLanding = () => {
    setCurrentRoadmap(null);
    setCurrentRequest(null);
    setAppState("landing");
  };

  const handleViewRoadmap = (rm: CareerRoadmap) => {
    setCurrentRoadmap(rm);
    setAppState("roadmap");
  };

  const handleDeleteRoadmap = (id: string) => {
    setSavedRoadmaps(prev => prev.filter(p => p.id !== id));
  };

  // Rendering
  if (appState ==="landing") {
    return (
      <LandingForm 
        onSubmit={handleGenerate} 
        onViewSaved={handleViewSaved} 
        hasSaved={savedRoadmaps.length > 0} 
      />
    );
  }

  if (appState ==="generating") {
    return <GeneratingScreen />;
  }

  if (appState ==="roadmap" && currentRoadmap) {
    const isAlreadySaved = savedRoadmaps.some(p => p.id === currentRoadmap.id);
    return (
      <RoadmapView 
        roadmap={currentRoadmap} 
        onSave={handleSaveRoadmap} 
        onRegenerate={handleBackToLanding}
        isSaved={isAlreadySaved}
      />
    );
  }

  if (appState ==="saved") {
    return (
      <SavedRoadmaps 
        savedRoadmaps={savedRoadmaps}
        onView={handleViewRoadmap}
        onDelete={handleDeleteRoadmap}
        onBack={handleBackToLanding}
      />
    );
  }

  return null;
}
