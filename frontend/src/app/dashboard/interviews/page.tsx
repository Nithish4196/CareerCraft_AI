"use client";

import React, { useState } from 'react';
import { AppState, InterviewConfig, RoundResult } from '@/types/interview';
import LandingPage from '@/components/interview/LandingPage';
import SetupFlow from '@/components/interview/SetupFlow';
import SessionShell from '@/components/interview/SessionShell';
import AptitudeRound from '@/components/interview/AptitudeRound';
import HRRound from '@/components/interview/HRRound';
import TechnicalRound from '@/components/interview/TechnicalRound';
import CodingRound from '@/components/interview/CodingRound';
import GDRound from '@/components/interview/GDRound';
import FinalReport from '@/components/interview/FinalReport';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';

export default function MockInterviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State Machine
  const [appState, setAppState] = useState<AppState>("landing");
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [modalState, setModalState] = useState<{ show: boolean, score: number, feedback: string[] } | null>(null);

  // Handlers
  const handleStartQuick = (quickConfig: InterviewConfig) => {
    setConfig(quickConfig);
    setCurrentRoundIndex(0);
    setResults([]);
    setModalState(null);
    setAppState("session");
    if (user) logActivity(user.uid, "mockInterviews");
  };

  const handleStartCustom = () => {
    setAppState("setup");
  };

  const handleSetupComplete = (customConfig: InterviewConfig) => {
    setConfig(customConfig);
    setCurrentRoundIndex(0);
    setResults([]);
    setModalState(null);
    setAppState("session");
    if (user) logActivity(user.uid, "mockInterviews");
  };

  const handleRoundFinish = (score: number, feedback: string[]) => {
    if (user) {
      logActivity(user.uid,"mockInterviews");
    }
    setModalState({ show: true, score, feedback });
  };

  const handleTimeUp = () => {
    setModalState({ 
      show: true, 
      score: 30, 
      feedback: ["Time ran out before you could finish.","Work on time management for this section."] 
    });
  };

  const handleNextRound = () => {
    if (!config || !modalState) return;

    const newResult: RoundResult = {
      type: config.rounds[currentRoundIndex],
      score: modalState.score,
      feedback: modalState.feedback
    };
    
    const newResults = [...results, newResult];
    setResults(newResults);
    setModalState(null);

    if (currentRoundIndex + 1 < config.rounds.length) {
      setCurrentRoundIndex(currentRoundIndex + 1);
    } else {
      setAppState("report");
    }
  };

  const handleEndInterviewEarly = () => {
    // If they quit early, just show report with what we have, or back to landing if none
    if (results.length > 0) {
      setAppState("report");
    } else {
      setAppState("landing");
    }
  };

  // Rendering logic
  if (appState ==="landing") {
    return <LandingPage onStartQuick={handleStartQuick} onStartCustom={handleStartCustom} />;
  }

  if (appState ==="setup") {
    return <SetupFlow onComplete={handleSetupComplete} />;
  }

  if (appState ==="report" && config) {
    return (
      <FinalReport 
        config={config} 
        results={results} 
        onRetake={() => setAppState("landing")}
        onGoToLearning={() => router.push('/dashboard/learning')}
      />
    );
  }

  if (appState ==="session" && config) {
    const currentRoundType = config.rounds[currentRoundIndex];

    const renderRoundComponent = () => {
      switch (currentRoundType) {
        case"Aptitude":
          return <AptitudeRound onFinish={handleRoundFinish} />;
        case"HR":
          return <HRRound onFinish={handleRoundFinish} />;
        case"Technical":
          return <TechnicalRound role={config.role} onFinish={handleRoundFinish} />;
        case"Coding":
          return <CodingRound difficulty={config.difficulty} onFinish={handleRoundFinish} />;
        case"Group Discussion":
          return <GDRound onFinish={handleRoundFinish} triggerEnd={modalState?.show} />;
        default:
          return <div>Unknown Round Type</div>;
      }
    };

    return (
      <SessionShell
        roundType={currentRoundType}
        currentRoundNum={currentRoundIndex + 1}
        totalRounds={config.rounds.length}
        onEndInterview={handleEndInterviewEarly}
        onTimeUp={handleTimeUp}
        modalState={modalState}
        onNextRound={handleNextRound}
      >
        {renderRoundComponent()}
      </SessionShell>
    );
  }

  return null;
}
