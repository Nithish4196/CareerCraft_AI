import React from 'react';
import { FileText, Search, Map, Video, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex w-full">

      {/* Left Panel - Hidden on Mobile */}
      <div className="hidden md:flex w-1/2 bg-foreground text-background flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-50"></div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <img src="/Logo.webp" alt="CareerPilot AI Logo" className="w-20 h-20 object-contain" />
            <span className="text-2xl font-extrabold tracking-tight">CareerPilot AI</span>
          </Link>

          <h1 className="text-4xl font-black mb-4">Your AI Career Copilot.</h1>
          <p className="text-background/70 text-lg mb-12 max-w-md">
            Build resumes, discover jobs, learn in-demand skills, prepare for interviews, and get hired faster with AI.
          </p>

          <div className="space-y-6">
            {[
              { icon: FileText, title: "AI Resume Builder", desc: "ATS-optimized templates & scoring" },
              { icon: Search, title: "Smart Job Finder", desc: "Multi-platform remote job aggregation" },
              { icon: Video, title: "Mock Interview System", desc: "Practice coding & HR rounds with AI" },
              { icon: Map, title: "Personalized Career Roadmap", desc: "Step-by-step learning paths" },
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="p-2 bg-background/10 rounded-lg">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-background">{feature.title}</h3>
                  <p className="text-background/60 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>



      </div>

      {/* Right Panel - Form Content */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-background relative">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  );
}
