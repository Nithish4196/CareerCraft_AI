import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatCardWrapperProps {
  title: string;
  value: string | React.ReactNode;
  subtext: string | React.ReactNode;
  icon: React.ElementType;
  colorClass: string;
  link: string;
  isLoading: boolean;
  onClick?: () => void;
}

export default function StatCardWrapper({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  link,
  isLoading,
  onClick
}: StatCardWrapperProps) {
  const content = (
    <div className="bg-background rounded-xl p-6 border border-muted shadow-sm hover:shadow-md hover:border-primary/30 transition-all group h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          {isLoading ? (
            <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
          ) : (
            <div className={`p-3 rounded-lg ${colorClass}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
          
          <div className="text-muted-foreground hover:text-primary transition-colors opacity-0 group-hover:opacity-100">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
            <div className="h-8 bg-muted animate-pulse rounded w-3/4" />
            <div className="h-3 bg-muted animate-pulse rounded w-2/3 mt-4" />
          </div>
        ) : (
          <div>
            <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold tracking-tight">{value}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{subtext}</p>
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        {content}
      </button>
    );
  }

  return (
    <Link href={link} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
      {content}
    </Link>
  );
}
