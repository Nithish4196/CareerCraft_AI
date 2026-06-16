"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, query, orderBy, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Activity, Flame, TrendingUp, Calendar as CalendarIcon, Briefcase, FileText, Video, GraduationCap, Code } from "lucide-react";
import BackButton from "@/components/dashboard/BackButton";

interface ActivityLog {
  id: string;
  module: string;
  action: string;
  timestamp: any;
}

export default function WeeklyActivityPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<{ dateStr: string; day: string; actions: number }[]>([]);
  const [moduleStats, setModuleStats] = useState<Record<string, number>>({});
  const [trend, setTrend] = useState({ current: 0, previous: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchActivity = async () => {
      try {
        const now = new Date();
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(now.getDate() - 14);

        const logsRef = collection(db, `users/${user.uid}/activityLog`);
        const q = query(
          logsRef, 
          where("timestamp", ">=", Timestamp.fromDate(fourteenDaysAgo)),
          orderBy("timestamp", "desc")
        );
        
        const snapshot = await getDocs(q);
        const allLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ActivityLog[];
        
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const currentWeekLogs = allLogs.filter(log => log.timestamp.toDate() >= sevenDaysAgo);
        const prevWeekLogs = allLogs.filter(log => log.timestamp.toDate() < sevenDaysAgo);

        setTrend({
          current: currentWeekLogs.length,
          previous: prevWeekLogs.length
        });

        const tempDays: { dateStr: string; day: string; actions: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          tempDays.push({
            dateStr: d.toDateString(),
            day: d.toLocaleDateString("en-US", { weekday: "short" }),
            actions: 0
          });
        }

        const mods: Record<string, number> = {
          "Resume": 0, "Jobs": 0, "Interviews": 0, "Learning": 0, "Projects": 0
        };

        currentWeekLogs.forEach(log => {
          const logDate = log.timestamp.toDate().toDateString();
          const dayIndex = tempDays.findIndex(d => d.dateStr === logDate);
          if (dayIndex !== -1) {
            tempDays[dayIndex].actions += 1;
          }
          
          if (mods[log.module] !== undefined) {
            mods[log.module] += 1;
          } else {
            mods[log.module] = 1;
          }
        });

        setChartData(tempDays);
        setModuleStats(mods);
        setLogs(currentWeekLogs.slice(0, 10)); 
        setLoading(false);

      } catch (error) {
        console.error("Error fetching activity:", error);
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  const maxActions = Math.max(...chartData.map(d => d.actions), 1);
  const trendPercent = trend.previous === 0 ? 100 : Math.round(((trend.current - trend.previous) / trend.previous) * 100);

  const getModuleIcon = (mod: string) => {
    switch (mod) {
      case "Jobs": return <Briefcase className="w-4 h-4" />;
      case "Resume": return <FileText className="w-4 h-4" />;
      case "Interviews": return <Video className="w-4 h-4" />;
      case "Learning": return <GraduationCap className="w-4 h-4" />;
      case "Projects": return <Code className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const mostActiveDay = [...chartData].sort((a, b) => b.actions - a.actions)[0];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <BackButton />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Activity className="w-8 h-8 text-foreground" />
          Weekly Activity
        </h1>
        <p className="text-muted-foreground mt-2">Analyze your career development momentum over the last 7 days.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Chart & Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <Flame className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-bold text-muted-foreground">Total Actions</h3>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold">{trend.current}</span>
                  <span className={`flex items-center text-sm font-medium mb-1 ${trendPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    <TrendingUp className={`w-4 h-4 mr-1 ${trendPercent < 0 && 'rotate-180'}`} />
                    {Math.abs(trendPercent)}% vs last week
                  </span>
                </div>
              </div>

              <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <CalendarIcon className="w-5 h-5 text-foreground" />
                  </div>
                  <h3 className="font-bold text-muted-foreground">Most Active Day</h3>
                </div>
                <div className="flex items-end gap-3">
                  <span className="text-4xl font-extrabold">{mostActiveDay?.actions > 0 ? mostActiveDay.day : "None"}</span>
                  {mostActiveDay?.actions > 0 && (
                    <span className="text-sm font-medium mb-1 text-muted-foreground">
                      {mostActiveDay.actions} actions
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Chart */}
            <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-6">7-Day Volume</h3>
              <div className="h-48 flex items-end justify-between gap-2">
                {chartData.map((d, i) => {
                  const height = d.actions === 0 ? "4px" : `${(d.actions / maxActions) * 100}%`;
                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="w-full flex justify-center relative h-full items-end pb-2">
                        {/* Tooltip */}
                        <div className="absolute -top-8 bg-foreground text-background text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {d.actions}
                        </div>
                        {/* Bar */}
                        <div 
                          className={`w-full max-w-[40px] rounded-t-md transition-all duration-500 ${d.actions > 0 ? 'bg-foreground hover:bg-foreground/80' : 'bg-muted'}`}
                          style={{ height }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Module Breakdown & Recent Log */}
          <div className="space-y-6">
            <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">Module Focus</h3>
              <div className="space-y-4">
                {Object.entries(moduleStats).sort((a, b) => b[1] - a[1]).map(([mod, count]) => {
                  if (count === 0) return null;
                  const pct = Math.round((count / trend.current) * 100);
                  return (
                    <div key={mod}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-2 font-medium">
                          {getModuleIcon(mod)} {mod}
                        </span>
                        <span className="text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {trend.current === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No module activity this week.</p>
                )}
              </div>
            </div>

            <div className="bg-background border border-muted rounded-xl p-6 shadow-sm">
              <h3 className="font-bold mb-4">Recent Actions</h3>
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent actions.</p>
                ) : (
                  logs.map(log => {
                    const date = log.timestamp.toDate();
                    return (
                      <div key={log.id} className="flex gap-3">
                        <div className="mt-0.5 p-1.5 bg-muted rounded-full shrink-0">
                          {getModuleIcon(log.module)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
