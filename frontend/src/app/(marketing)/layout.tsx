import Link from"next/link";
import { Sparkles } from"lucide-react";
import React from"react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* Left Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background/80 backdrop-blur-md border-r border-muted hidden md:flex flex-col">
        <div className="p-6 border-b border-muted">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <img src="/Logo.webp" alt="CareerPilot AI Logo" className="w-8 h-8 object-contain" />
            CareerCraft<span className="text-primary">AI</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link href="/features" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors duration-150 ease-out transition-colors text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="/roadmaps" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors duration-150 ease-out transition-colors text-muted-foreground hover:text-foreground">Roadmaps</Link>
          <Link href="/interviews" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors duration-150 ease-out transition-colors text-muted-foreground hover:text-foreground">Interviews</Link>
          <Link href="/faq" className="block px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors duration-150 ease-out transition-colors text-muted-foreground hover:text-foreground">FAQ</Link>
        </nav>
        <div className="p-4 border-t border-muted flex flex-col gap-3">
          <Link href="/login" className="w-full text-center py-2.5 text-sm font-medium hover:text-primary transition-colors rounded-lg hover:bg-muted transition-colors duration-150 ease-out ">Sign In</Link>
          <Link href="/signup" className="w-full text-center py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors duration-150 ease-out shadow-md">
            Get Started
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        
        {/* Mobile Header (Visible only on small screens) */}
        <header className="md:hidden h-16 flex items-center justify-between px-6 border-b border-muted bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <img src="/Logo.webp" alt="CareerPilot AI Logo" className="w-12 h-12 object-contain" />
            CareerPilot
          </Link>
          <Link href="/signup" className="text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-full">
            Get Started
          </Link>
        </header>

        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-muted bg-muted/20 py-12 px-6 mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight mb-4">
                <img src="/Logo.webp" alt="CareerPilot AI Logo" className="w-6 h-6 object-contain" />
                CareerCraft<span className="text-primary">AI</span>
              </Link>
              <p className="text-muted-foreground text-sm">Your all-in-one AI career copilot.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/features" className="hover:text-primary">Resume Builder</Link></li>
                <li><Link href="/features" className="hover:text-primary">Job Finder</Link></li>
                <li><Link href="/features" className="hover:text-primary">Learning Hub</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/roadmaps" className="hover:text-primary">Career Roadmaps</Link></li>
                <li><Link href="/interviews" className="hover:text-primary">Interview Prep</Link></li>
                <li><Link href="#" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary">Contact</Link></li>
                <li><Link href="#" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="max-w-7xl mx-auto pt-8 border-t border-muted text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} CareerCraft AI. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
}
