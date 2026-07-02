"use client";

import React, { useState, useEffect, useRef } from 'react';

interface ExplainerStep {
  stepNumber: number;
  heading: string;
  explanation: string;
  highlightLines: number[];
  analogy: string;
  commonMistake: string;
}

interface ExplainerData {
  codeLanguage: string;
  title: string;
  code: string;
  steps: ExplainerStep[];
  summary: string;
  conceptsCovered: string[];
}

export default function CodeVisualExplainer({ data }: { data: ExplainerData }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(5000);
  const [showPlainText, setShowPlainText] = useState(false);
  const codePanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= data.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, data.steps.length]);

  useEffect(() => {
    if (codePanelRef.current && !showPlainText) {
      const highlightedLines = codePanelRef.current.querySelectorAll('.highlighted');
      if (highlightedLines.length > 0) {
        highlightedLines[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentStep, showPlainText]);

  const codeLines = data.code.split('\n');

  return (
    <div className="bg-background border border-muted rounded-xl p-4 my-2 text-sm flex flex-col gap-4">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-lg">{data.title}</h3>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
            {data.codeLanguage}
          </span>
          {data.conceptsCovered.map((concept, i) => (
            <span key={i} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
              {concept}
            </span>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {!showPlainText ? (
            <button 
              onClick={() => setShowPlainText(true)}
              className="text-xs text-primary underline"
            >
              View as plain text
            </button>
          ) : (
            <button 
              onClick={() => setShowPlainText(false)}
              className="text-xs text-primary underline"
            >
              View visual player
            </button>
          )}
        </div>
      </div>

      {showPlainText ? (
        <div className="space-y-4">
          <p className="font-medium text-foreground">{data.summary}</p>
          <div className="space-y-4">
            {data.steps.map((step, idx) => (
              <div key={idx} className="border-l-2 border-primary/30 pl-3">
                <p className="font-bold mb-1">{step.heading}</p>
                <p className="text-muted-foreground">{step.explanation}</p>
                {step.analogy && <p className="text-muted-foreground mt-1 text-xs italic">Think of it like: {step.analogy}</p>}
                {step.commonMistake && <p className="text-red-500/80 mt-1 text-xs">Common mistake: {step.commonMistake}</p>}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground pt-2">
            Concepts covered: {data.conceptsCovered.join(', ')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Section 1 */}
          <div className="flex flex-col md:flex-row gap-4 h-[300px]">
            {/* Left Column - Code Panel */}
            <div 
              ref={codePanelRef}
              className="w-full md:w-[45%] bg-[#0d1117] text-white p-3 rounded-lg overflow-y-auto font-mono text-[13px] leading-relaxed"
            >
              {codeLines.map((lineHtml, index) => {
                const lineNumber = index + 1;
                const isHighlighted = data.steps[currentStep].highlightLines.includes(lineNumber);
                return (
                  <div 
                    key={index} 
                    className={`flex gap-3 px-1 rounded transition-colors duration-300 ${
                      isHighlighted ? 'bg-primary/20 border-l-2 border-primary highlighted' : 'opacity-40 dimmed'
                    }`}
                  >
                    <span className="select-none text-gray-500 text-right min-w-[1.5rem] shrink-0">
                      {lineNumber}
                    </span>
                    <pre className="m-0 p-0 font-inherit whitespace-pre-wrap">{lineHtml || ' '}</pre>
                  </div>
                );
              })}
            </div>

            {/* Right Column - Explanation Panel */}
            <div className="w-full md:w-[55%] flex flex-col gap-3 overflow-y-auto pr-2">
              <p className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">
                Step {currentStep + 1} of {data.steps.length}
              </p>
              <h4 className="font-bold text-base text-primary">{data.steps[currentStep].heading}</h4>
              <p className="text-foreground leading-relaxed">
                {data.steps[currentStep].explanation}
              </p>
              
              {data.steps[currentStep].analogy && (
                <div className="mt-2 bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-blue-500 mb-1">Think of it like:</p>
                  <p className="text-sm text-foreground/90">{data.steps[currentStep].analogy}</p>
                </div>
              )}
              
              {data.steps[currentStep].commonMistake && (
                <div className="mt-2 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  <p className="text-xs font-semibold text-red-500 mb-1">Common mistake:</p>
                  <p className="text-sm text-foreground/90">{data.steps[currentStep].commonMistake}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section 2 - Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-muted">
            <div className="flex gap-2 items-center">
              <button 
                disabled={currentStep === 0}
                onClick={() => { setCurrentStep(prev => prev - 1); setIsPlaying(false); }}
                className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
              >
                ← Prev
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button 
                disabled={currentStep === data.steps.length - 1}
                onClick={() => { setCurrentStep(prev => prev + 1); setIsPlaying(false); }}
                className="px-3 py-1.5 text-xs font-medium bg-muted text-foreground rounded hover:bg-muted/80 disabled:opacity-50"
              >
                Next →
              </button>
            </div>

            <div className="flex items-center gap-2">
              <select 
                value={speed}
                onChange={(e) => {
                  setSpeed(Number(e.target.value));
                  if (isPlaying) {
                    setIsPlaying(false);
                    setTimeout(() => setIsPlaying(true), 10);
                  }
                }}
                className="bg-background border border-muted text-xs rounded px-2 py-1"
              >
                <option value={8000}>0.5x</option>
                <option value={5000}>1x</option>
                <option value={3000}>1.5x</option>
                <option value={2000}>2x</option>
              </select>
            </div>
          </div>
          
          {/* Progress Bar & Dots */}
          <div className="flex flex-col gap-2 w-full">
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${((currentStep + 1) / data.steps.length) * 100}%` }}
              />
            </div>
            <div className="flex gap-1 justify-center w-full">
              {data.steps.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx <= currentStep ? 'w-4 bg-primary' : 'w-2 bg-muted'
                  }`}
                  aria-label={`Go to step ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Completion state */}
          {currentStep === data.steps.length - 1 && !isPlaying && (
            <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
              <h4 className="font-bold text-primary">Explanation complete</h4>
              <p className="text-sm text-foreground">{data.summary}</p>
              <p className="text-xs text-muted-foreground font-medium">
                Concepts covered: {data.conceptsCovered.join(', ')}
              </p>
              <button 
                onClick={() => { setCurrentStep(0); setIsPlaying(false); }}
                className="mt-2 self-start px-4 py-2 bg-background border border-primary/50 text-primary text-xs font-semibold rounded hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Replay from beginning
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
