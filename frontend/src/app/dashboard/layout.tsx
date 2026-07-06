"use client";

import React, { useState, useEffect } from"react";
import Link from"next/link";
import { useRouter, usePathname } from"next/navigation";
import { useAuth } from"@/context/AuthContext";
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Video, 
  Code, 
  Map as MapIcon, 
  Settings, 
  Sparkles,
  Menu,
  X,
  LogOut,
  Bell,
  Loader2
} from "lucide-react";
import ChatBot from"@/components/dashboard/ChatBot";
import ProfileDropdown from"@/components/dashboard/ProfileDropdown";

const sidebarLinks = [
  { name:"Dashboard", href:"/dashboard", icon: LayoutDashboard },
  { name:"Resume Builder", href:"/dashboard/resume", icon: FileText },
  { name:"Job Finder", href:"/dashboard/jobs", icon: Briefcase },
  { name:"Learning Hub", href:"/dashboard/learning", icon: GraduationCap },
  { name:"CareerCraft Classroom", href:"/dashboard/classroom", icon: Code },
  { name:"Mock Interviews", href:"/dashboard/interviews", icon: Video },
  { name:"Project Builder", href:"/dashboard/projects", icon: Code },
  { name:"Career Roadmaps", href:"/dashboard/roadmaps", icon: MapIcon },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const { user, userProfile, loading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/sign-in");
      } else if (userProfile && !userProfile.onboardingCompleted) {
        router.replace("/onboarding");
      }
    }
  }, [user, userProfile, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  const isFullScreenRoute = ["/dashboard/resume/score","/dashboard/jobs/tracker","/dashboard/trending-jobs","/dashboard/learning/active","/dashboard/activity","/dashboard/interviews/history","/dashboard/insights"
  ].includes(pathname) || pathname.startsWith("/dashboard/interviews/history/");

  if (isFullScreenRoute) {
    return <div className="flex min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-muted transform transition-transform ease-in-out md:relative md:translate-x-0 flex flex-col ${
          isMobileMenuOpen ?"translate-x-0" :"-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-24 flex items-center px-6 border-b border-muted">
          <div className="flex items-center gap-3">
            <img src="/Logo.webp" alt="CareerCraft AI Logo" className="w-12 h-12 object-contain scale-125 origin-left" />
            <span className="text-xl font-bold tracking-tight">
              CareerCraft<span className="text-primary">AI</span>
            </span>
          </div>
          <button 
            className="ml-auto md:hidden text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive 
                    ?"bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    :"text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 ease-out "
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <link.icon className={`w-5 h-5 ${isActive ?"text-primary-foreground" :"text-muted-foreground"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-muted space-y-1">
          <Link
            href="/dashboard/settings"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname ==="/dashboard/settings"
                ?"bg-primary text-primary-foreground shadow-md shadow-primary/20"
                :"text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150 ease-out "
            }`}
          >
            <Settings className={`w-5 h-5 ${pathname ==="/dashboard/settings" ?"text-primary-foreground" :"text-muted-foreground"}`} />
            Settings
          </Link>
          <button
            onClick={() => setIsSignOutModalOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors duration-150 ease-out transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Unified Top Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-background border-b border-muted shrink-0 z-10">
          {/* Mobile Branding */}
          <Link href="/" className="flex items-center font-black text-sm text-black darknpm run dev:text-white md:hidden pr-4 leading-tight italic">
            "Turning ambition into achievement..."
          </Link>

          {/* Desktop Slogan */}
          <div className="hidden md:flex flex-1 justify-start">
            <span className="text-xl font-black text-foreground leading-tight italic">
              "Turning ambition into achievement..."
            </span>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4 ml-auto">
            {/* Mobile Menu Toggle */}
            <button 
              className="p-2 rounded-md text-muted-foreground hover:bg-muted transition-colors duration-150 ease-out md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <button className="text-muted-foreground hover:text-foreground transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-background"></span>
              </button>
              
              <ProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {children}
        </div>
      </main>

      {/* Global AI Chatbot */}
      <ChatBot />

      {/* Sign Out Confirmation Modal */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-muted rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                <LogOut className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Sign Out</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Are you sure you want to sign out of CareerCraft AI?
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setIsSignOutModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-muted font-medium text-sm hover:bg-muted transition-colors duration-150 ease-out transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setIsSignOutModalOpen(false);
                    signOut();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 hover:bg-red-600 transition-colors duration-150 ease-out font-medium text-sm text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
