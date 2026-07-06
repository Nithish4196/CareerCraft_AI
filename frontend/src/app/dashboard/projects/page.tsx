"use client";

import React, { useState, useEffect } from 'react';
import { ProjectBlueprint, ProjectRequest, generateMockBlueprint } from '@/types/project';
import LandingForm from '@/components/projects/LandingForm';
import GeneratingScreen from '@/components/projects/GeneratingScreen';
import BlueprintView from '@/components/projects/BlueprintView';
import SavedProjects from '@/components/projects/SavedProjects';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';

type AppState ="landing" |"generating" |"blueprint" |"saved";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [appState, setAppState] = useState<AppState>("landing");
  const [currentRequest, setCurrentRequest] = useState<ProjectRequest | null>(null);
  const [currentBlueprint, setCurrentBlueprint] = useState<ProjectBlueprint | null>(null);
  const [savedProjects, setSavedProjects] = useState<ProjectBlueprint[]>([]);

  // Load saved projects from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("careerpilot_saved_projects");
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved projects", e);
    }
  }, []);

  // Save to localStorage when updated
  useEffect(() => {
    try {
      localStorage.setItem("careerpilot_saved_projects", JSON.stringify(savedProjects));
    } catch (e) {
      console.error("Failed to save projects to local storage", e);
    }
  }, [savedProjects]);

  const handleGenerate = (req: ProjectRequest) => {
    if (user) logActivity(user.uid, "projectsWorked");
    setCurrentRequest(req);
    setAppState("generating");
    
    // Simulate API Call delay
    setTimeout(() => {
      const blueprint = generateMockBlueprint(req);
      setCurrentBlueprint(blueprint);
      setAppState("blueprint");
    }, 10000); // 10 seconds to allow all messages to rotate
  };

  const handleSaveBlueprint = () => {
    if (!currentBlueprint) return;
    setSavedProjects(prev => {
      // Check if already saved
      if (prev.find(p => p.id === currentBlueprint.id)) return prev;
      return [currentBlueprint, ...prev];
    });
  };

  const handleViewSaved = () => {
    setAppState("saved");
  };

  const handleBackToLanding = () => {
    setCurrentBlueprint(null);
    setCurrentRequest(null);
    setAppState("landing");
  };

  const handleViewBlueprint = (bp: ProjectBlueprint) => {
    setCurrentBlueprint(bp);
    setAppState("blueprint");
  };

  const handleDeleteBlueprint = (id: string) => {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  };

  // Rendering
  if (appState ==="landing") {
    return (
      <LandingForm 
        onSubmit={handleGenerate} 
        onViewSaved={handleViewSaved} 
        hasSaved={savedProjects.length > 0} 
      />
    );
  }

  if (appState ==="generating") {
    return <GeneratingScreen />;
  }

  if (appState ==="blueprint" && currentBlueprint) {
    const isAlreadySaved = savedProjects.some(p => p.id === currentBlueprint.id);
    return (
      <BlueprintView 
        blueprint={currentBlueprint} 
        onSave={handleSaveBlueprint} 
        onBack={handleBackToLanding}
        isSaved={isAlreadySaved}
      />
    );
  }

  if (appState ==="saved") {
    return (
      <SavedProjects 
        savedBlueprints={savedProjects}
        onView={handleViewBlueprint}
        onDelete={handleDeleteBlueprint}
        onBack={handleBackToLanding}
      />
    );
  }

  return null;
}
