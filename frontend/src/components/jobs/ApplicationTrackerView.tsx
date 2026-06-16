"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building2, Calendar, DollarSign, ExternalLink, ChevronDown, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface Application {
  id: string;
  company: string;
  role: string;
  appliedDate: any; // Firestore Timestamp
  status: string;
  statusHistory: { status: string; date: any }[];
  salaryRange?: string;
  jobUrl?: string;
  logo?: string;
}

const STATUS_OPTIONS = [
  "Applied",
  "Under Review",
  "Interview Scheduled",
  "Interviewed",
  "Offer Received",
  "Rejected",
  "Withdrawn"
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Applied": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "Under Review": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "Interview Scheduled": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
    case "Interviewed": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "Offer Received": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case "Rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
    case "Withdrawn": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    default: return "bg-muted text-foreground border-muted";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Offer Received": return <CheckCircle className="w-3.5 h-3.5" />;
    case "Rejected": case "Withdrawn": return <XCircle className="w-3.5 h-3.5" />;
    default: return <Clock className="w-3.5 h-3.5" />;
  }
};

export default function ApplicationTrackerView() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const appsRef = collection(db, `users/${user.uid}/appliedJobs`);
    const q = query(appsRef, orderBy("appliedDate", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Application[];
      setApplications(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleStatusUpdate = async (appId: string, newStatus: string) => {
    if (!user) return;
    try {
      const appRef = doc(db, `users/${user.uid}/appliedJobs`, appId);
      await updateDoc(appRef, {
        status: newStatus,
        statusHistory: arrayUnion({
          status: newStatus,
          date: new Date() // Ideally use serverTimestamp(), but we need to read it immediately or just let snapshot handle it. Let's use new Date() for array objects if arrayUnion has issues with serverTimestamp inside objects, though Firestore supports it now. Using new Date() is safer for arrays.
        })
      });
      toast.success("Status updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
    }
  };

  const filteredApps = filter === "All" 
    ? applications 
    : applications.filter(app => {
        if (filter === "Interviewing") {
          return ["Interview Scheduled", "Interviewed"].includes(app.status);
        }
        if (filter === "Offer") {
          return app.status === "Offer Received";
        }
        return app.status === filter;
      });

  const formatDate = (date: any) => {
    if (!date) return "Unknown date";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-background border border-muted rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Applications Yet</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You haven't applied to any jobs through CareerPilot AI yet. Start exploring the job board to find your next opportunity!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "Applied", "Under Review", "Interviewing", "Offer", "Rejected"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
              filter === f 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-background text-foreground border-muted hover:border-primary/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredApps.map((app) => (
          <div key={app.id} className="bg-background border border-muted rounded-xl overflow-hidden transition-all hover:border-primary/50">
            {/* Main Row */}
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
                  {app.logo || app.company.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{app.role}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <Building2 className="w-4 h-4" /> {app.company}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> Applied {formatDate(app.appliedDate)}
                    </span>
                    {app.salaryRange && (
                      <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                        <DollarSign className="w-4 h-4" /> {app.salaryRange}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${getStatusColor(app.status)}`}>
                  {getStatusIcon(app.status)}
                  {app.status}
                </div>

                {/* Update Status Dropdown */}
                <select 
                  className="bg-background border border-muted text-sm rounded-lg px-3 py-2 focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                  value={app.status}
                  onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                >
                  <option value="" disabled>Update Status</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>

                {app.jobUrl && (
                  <Link href={app.jobUrl} target="_blank" className="p-2 border border-muted rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" title="View Original Job">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}

                <button 
                  onClick={() => setExpandedAppId(expandedAppId === app.id ? null : app.id)}
                  className="p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedAppId === app.id ? "rotate-180" : ""}`} />
                </button>
              </div>
            </div>

            {/* Expanded Timeline */}
            {expandedAppId === app.id && (
              <div className="bg-muted/10 p-6 border-t border-muted">
                <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Application Timeline</h4>
                <div className="space-y-4">
                  {app.statusHistory?.map((historyEntry, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1.5"></div>
                        {idx !== app.statusHistory.length - 1 && (
                          <div className="w-px h-full bg-border my-1"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <div className="font-medium text-sm">{historyEntry.status}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{formatDate(historyEntry.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
