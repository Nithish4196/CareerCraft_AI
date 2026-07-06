import React from 'react';
import { Job } from '@/types/job';
import { MapPin, IndianRupee, Clock, Bookmark, Building2, Zap, Briefcase } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { logActivity } from '@/lib/activity';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  isApplied?: boolean;
  onToggleSave?: () => void;
  onClick: (job: Job) => void;
}

export default function JobCard({ job, isSaved = false, isApplied = false, onToggleSave, onClick }: JobCardProps) {
  const { user } = useAuth();
  
  const getScoreStyle = (score: number) => {
    if (score >= 90) return "text-blue-700 bg-blue-50 border-blue-200 font-extrabold";
    if (score >= 70) return "text-gray-800 bg-gray-100 border-gray-300";
    return "text-gray-500 bg-white border-gray-200";
  };

  const getSourceBadge = () => {
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div 
      onClick={() => onClick(job)}
      className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 hover:border-gray-400 cursor-pointer group transition-all"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
            {job.companyLogo ? (
              <img src={job.companyLogo} alt={job.companyName} className="w-8 h-8 object-contain" />
            ) : (
              <Building2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-black group-hover:text-blue-600 transition-colors">{job.role}</h3>
            <p className="text-sm font-medium text-gray-500">{job.companyName}</p>
          </div>
        </div>
        
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            if (onToggleSave) onToggleSave(); 
          }}
          className={`p-2 rounded-full transition-colors ${isSaved ? 'text-black bg-gray-100 border border-gray-300' : 'text-gray-400 hover:text-black hover:bg-gray-100 transition-colors duration-150 ease-out'}`}
        >
          <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1.5 text-sm font-semibold bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md text-black">
          <IndianRupee className="w-4 h-4 text-gray-500" />
          <span>{job.salaryMin ? `₹${job.salaryMin}L - ₹${job.salaryMax}L` : 'Not Disclosed'}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="truncate max-w-[150px]" title={job.location}>{job.location}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
          <Briefcase className="w-4 h-4 text-gray-400" />
          <span>{job.experienceLevel || "Not Specified"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
          <Clock className="w-4 h-4 text-gray-400" />
          <span>{job.workType} • {job.workMode}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-auto">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500">
            {job.postedDate ? new Date(job.postedDate).toLocaleDateString() : 'Recent'}
          </span>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${getSourceBadge()}`}>
            {job.source}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full border text-sm ${getScoreStyle(job.matchScore || 0)}`}>
            <Zap className="w-4 h-4 fill-current" />
            {job.matchScore || 0}% Match
          </div>
          <button 
            disabled={isApplied}
            onClick={(e) => { 
              e.stopPropagation(); 
              if (user) logActivity(user.uid, "jobsApplied");
              if (job.applyLink) window.open(job.applyLink, '_blank');
            }}
            className={`${isApplied ? 'bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-gray-800'} text-sm font-bold px-5 py-2 rounded-lg transition-colors duration-150 ease-out`}
          >
            {isApplied ? 'Applied' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
