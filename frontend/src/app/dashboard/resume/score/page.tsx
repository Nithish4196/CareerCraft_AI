"use client";

import React, { useState, useRef, useEffect } from "react";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, RefreshCcw, Target, Sparkles, Briefcase } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { collection, query, orderBy, limit, getDocs, doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BackButton from "@/components/dashboard/BackButton";
import { logActivity } from "@/lib/activity";

const CircularProgress = ({ value, size = 120, strokeWidth = 10, color = "#2563eb", showText = true }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle 
          className="text-muted/30" 
          strokeWidth={strokeWidth} 
          stroke="currentColor" 
          fill="transparent" 
          r={radius} 
          cx={size/2} 
          cy={size/2} 
        />
        <circle 
          stroke={color} 
          strokeWidth={strokeWidth} 
          strokeDasharray={circumference} 
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent" 
          r={radius} 
          cx={size/2} 
          cy={size/2} 
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {showText && (
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-xs text-muted-foreground font-medium">/ 100</span>
        </div>
      )}
    </div>
  );
};

const SectionScore = ({ label, score }: { label: string, score: number }) => {
  let color = "bg-red-500";
  if (score > 60) color = "bg-yellow-500";
  if (score > 80) color = "bg-green-500";
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium capitalize">{label}</span>
        <span className="font-bold">{score}/100</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${score}%` }}></div>
      </div>
    </div>
  );
};

const QUICK_ROLES = [
  "Frontend Developer", 
  "Backend Developer", 
  "Full Stack Engineer",
  "Data Scientist", 
  "Product Manager",
  "UX/UI Designer"
];

export default function ResumeScorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [viewState, setViewState] = useState<"loading" | "zero" | "role_selection" | "analyzing" | "results">("loading");
  const [resumeData, setResumeData] = useState<any>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [statusIndex, setStatusIndex] = useState(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");

  const [addressedWeaknesses, setAddressedWeaknesses] = useState<Record<number, boolean>>({});
  const [addressedTips, setAddressedTips] = useState<Record<number, boolean>>({});

  const STATUS_MESSAGES = [
    "Reading your resume...",
    "Checking ATS compatibility...",
    "Identifying strengths and gaps...",
    "Finalizing your score..."
  ];

  useEffect(() => {
    if (!user) return;
    const fetchLatestResume = async () => {
      try {
        const q = query(collection(db, `users/${user.uid}/resumes`), orderBy("updatedAt", "desc"), limit(1));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const latestDoc = snapshot.docs[0].data();
          if (latestDoc.analysis) {
            setResumeData(latestDoc);
            setViewState("results");
          } else {
            setViewState("zero");
          }
        } else {
          setViewState("zero");
        }
      } catch (err) {
        console.error("Failed to fetch resume:", err);
        setViewState("zero");
      }
    };
    fetchLatestResume();
  }, [user]);

  useEffect(() => {
    if (viewState === "analyzing") {
      const interval = setInterval(() => {
        setStatusIndex(prev => (prev + 1) % STATUS_MESSAGES.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [viewState]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }
    
    setSelectedFile(file);
    setViewState("role_selection");
  };

  const processFile = async (file: File, role: string) => {
    if (!user) return;

    try {
      if (resumeData?.atsScore) {
        setPreviousScore(resumeData.atsScore);
      }
      
      setViewState("analyzing");
      setStatusIndex(0);

      const resumeId = `resume_${Date.now()}`;
      const filePath = `users/${user.uid}/resumes/${resumeId}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Careerpilot_Resumes')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('Careerpilot_Resumes')
        .getPublicUrl(filePath);

      const fileUrl = urlData.publicUrl;

      const docRef = doc(db, `users/${user.uid}/resumes`, resumeId);
      await setDoc(docRef, {
        id: resumeId,
        fileName: file.name,
        fileUrl,
        targetRole: role,
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: "uploaded",
        rawText: "Extracting...",
        atsScore: null,
        status: "analyzing"
      });

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl, targetRole: role })
      });

      if (!response.ok) throw new Error("Analysis failed");

      const analysisData = await response.json();

      await updateDoc(docRef, {
        atsScore: analysisData.atsScore,
        analysis: analysisData,
        parsedData: analysisData.parsedData || null,
        status: "analyzed",
        updatedAt: serverTimestamp(),
      });

      setAddressedWeaknesses({});
      setAddressedTips({});

      setResumeData({
        id: resumeId,
        atsScore: analysisData.atsScore,
        analysis: analysisData,
        parsedData: analysisData.parsedData || null,
        targetRole: role,
        updatedAt: new Date()
      });
      
      logActivity(user.uid, "resumeEdits");
      toast.success(`Resume analyzed for ${role}!`);
      setViewState("results");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during upload/analysis.");
      setViewState(resumeData ? "results" : "zero");
    }
  };

  const renderZeroState = () => (
    <div className="bg-background border border-muted rounded-2xl shadow-sm p-6 md:p-10">
      <div className="space-y-10">
        <div>
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
              isDragging ? "border-primary bg-primary/5" : "border-muted hover:border-foreground/50 hover:bg-muted/30 transition-colors duration-150 ease-out "
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 rounded-full bg-muted text-foreground flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold mb-2">Click to upload or drag and drop</h4>
            <p className="text-muted-foreground">PDF or DOCX (max 5MB)</p>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              accept=".pdf,.docx" 
              onChange={handleFileSelect}
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-muted"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground font-medium">OR</span>
          </div>
        </div>

        <div>
          <button 
            onClick={() => router.push("/dashboard/resume")}
            className="w-full flex items-center justify-between p-6 border border-muted rounded-xl hover:border-foreground/50 hover:shadow-md group transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-lg bg-foreground text-background flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                <div className="text-lg font-bold group-hover:text-muted-foreground transition-colors">Don't have a resume yet? Build one</div>
                <div className="text-muted-foreground">Use our AI-powered templates and creation flow</div>
              </div>
            </div>
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderRoleSelectionState = () => (
    <div className="bg-background border border-muted rounded-2xl shadow-sm p-6 md:p-10 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
        <Briefcase className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold mb-2">File Ready: {selectedFile?.name}</h3>
      <p className="text-muted-foreground mb-8">What role are you targeting with this resume?</p>
      
      <div className="max-w-md mx-auto space-y-6 text-left">
        <div>
          <label className="block text-sm font-medium mb-2">Target Role</label>
          <input 
            type="text" 
            placeholder="e.g., Senior React Developer"
            className="w-full bg-background border border-muted rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && targetRole.trim()) {
                processFile(selectedFile!, targetRole);
              }
            }}
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Quick Select</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_ROLES.map(role => (
              <button
                key={role}
                onClick={() => setTargetRole(role)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  targetRole === role 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button 
            onClick={() => processFile(selectedFile!, targetRole)}
            disabled={!targetRole.trim()}
            className="w-full bg-foreground text-background font-bold py-4 rounded-xl hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" /> Analyze for this Role
          </button>
          <button
            onClick={() => {
              setSelectedFile(null);
              setTargetRole("");
              setViewState("zero");
            }}
            className="w-full text-muted-foreground text-sm font-medium hover:text-foreground transition-colors py-2"
          >
            Cancel and upload a different file
          </button>
        </div>
      </div>
    </div>
  );

  const renderAnalyzingState = () => (
    <div className="bg-background border border-muted rounded-2xl shadow-sm p-16 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
        <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
      </div>
      <h3 className="font-bold text-xl mt-8 mb-2">AI is analyzing your resume</h3>
      <p className="text-muted-foreground h-6 animate-pulse transition-all text-center">
        {STATUS_MESSAGES[statusIndex]}
        <br />
        <span className="text-sm opacity-70">Optimizing for: <strong className="text-foreground">{targetRole}</strong></span>
      </p>
    </div>
  );

  const renderResultsState = () => {
    if (!resumeData || !resumeData.analysis) return null;
    
    const analysis = resumeData.analysis;
    const score = resumeData.atsScore;
    
    let scoreColor = "#ef4444"; // Red
    let scoreText = "Needs significant improvement";
    if (score > 40) { scoreColor = "#f97316"; scoreText = "Fair, but could be much better"; }
    if (score > 60) { scoreColor = "#eab308"; scoreText = "Good start, let's optimize it"; }
    if (score > 80) { scoreColor = "#22c55e"; scoreText = "Strong resume, almost perfect!"; }
    if (score > 94) { scoreColor = "#3b82f6"; scoreText = "Excellent! You're ready to apply."; }

    const toggleAddressed = (stateSetter: any, index: number) => {
      stateSetter((prev: any) => ({ ...prev, [index]: !prev[index] }));
    };

    const delta = previousScore !== null ? score - previousScore : 0;

    return (
      <div className="space-y-6">
        {/* Top Score Banner */}
        <div className="bg-background border border-muted rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
          <div className="p-8 md:w-1/3 bg-muted/20 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-muted relative">
            
            {resumeData.targetRole && (
              <div className="absolute top-4 left-4 right-4 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-background border border-muted rounded-full text-xs font-semibold text-muted-foreground shadow-sm">
                  <Briefcase className="w-3.5 h-3.5" /> {resumeData.targetRole}
                </span>
              </div>
            )}

            <div className="mt-6">
              <CircularProgress value={score} size={160} color={scoreColor} strokeWidth={12} />
            </div>
            
            <div className="mt-4 text-center font-semibold" style={{ color: scoreColor }}>
              {scoreText}
            </div>
            
            {previousScore !== null && delta !== 0 && (
              <div className={`mt-2 flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full ${delta > 0 ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                {delta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {delta > 0 ? "+" : ""}{delta} points since your last upload
              </div>
            )}
          </div>
          <div className="p-8 md:w-2/3 flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Section Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <SectionScore label="Summary" score={analysis.sectionScores?.summary || 0} />
              <SectionScore label="Experience" score={analysis.sectionScores?.experience || 0} />
              <SectionScore label="Skills" score={analysis.sectionScores?.skills || 0} />
              <SectionScore label="Education" score={analysis.sectionScores?.education || 0} />
              <div className="sm:col-span-2">
                <SectionScore label="Formatting" score={analysis.sectionScores?.formatting || 0} />
              </div>
            </div>
          </div>
        </div>

        {/* Biggest Opportunity */}
        {analysis.improvementTips?.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary mb-1">Your biggest opportunity</h3>
              <p className="text-foreground/80 leading-relaxed">{analysis.improvementTips[0]}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strengths */}
          <div className="bg-background border border-muted rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              What's working
            </h3>
            <ul className="space-y-3">
              {analysis.strengths?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></div>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-background border border-muted rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              What needs work
            </h3>
            <ul className="space-y-4">
              {analysis.weaknesses?.map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 group">
                  <button 
                    onClick={() => toggleAddressed(setAddressedWeaknesses, i)}
                    className={`mt-0.5 shrink-0 transition-colors ${addressedWeaknesses[i] ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {addressedWeaknesses[i] ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>}
                  </button>
                  <span className={`text-muted-foreground transition-all ${addressedWeaknesses[i] ? "line-through opacity-50" : ""}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Missing Keywords */}
        {analysis.missingKeywords?.length > 0 && (
          <div className="bg-background border border-muted rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-2">Keywords to add</h3>
            <p className="text-sm text-muted-foreground mb-4">These keywords commonly appear in job postings for your target role and aren't currently in your resume.</p>
            <div className="flex flex-wrap gap-2">
              {analysis.missingKeywords.map((keyword: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm font-medium border border-muted-foreground/20">
                  + {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Additional Tips */}
        {analysis.improvementTips?.length > 1 && (
          <div className="bg-background border border-muted rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-bold mb-4">Suggested next steps</h3>
            <ul className="space-y-4">
              {analysis.improvementTips.slice(1).map((item: string, i: number) => (
                <li key={i} className="flex items-start gap-3 group">
                  <button 
                    onClick={() => toggleAddressed(setAddressedTips, i)}
                    className={`mt-0.5 shrink-0 transition-colors ${addressedTips[i] ? "text-green-500" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {addressedTips[i] ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>}
                  </button>
                  <span className={`text-muted-foreground transition-all ${addressedTips[i] ? "line-through opacity-50" : ""}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            onClick={() => router.push(`/dashboard/resume/editor?resumeId=${resumeData.id}`)}
            className="flex-1 bg-foreground text-background py-4 px-6 rounded-xl font-bold hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
          >
            Edit in Resume Builder <TrendingUp className="w-5 h-5" />
          </button>
          <button 
            onClick={() => {
              setViewState("zero");
              setTargetRole("");
              if (resumeData?.atsScore) {
                setPreviousScore(resumeData.atsScore);
              }
            }}
            className="flex-1 bg-muted text-foreground py-4 px-6 rounded-xl font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw className="w-5 h-5" /> Upload a Different Resume
          </button>
        </div>
      </div>
    );
  };

  if (viewState === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
      <BackButton />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {viewState === "results" ? "Your Resume Analysis" : "Check your resume score"}
        </h1>
        <p className="text-muted-foreground">
          {viewState === "results" 
            ? "Here is your detailed AI breakdown and personalized feedback." 
            : "Upload your updated resume to see your ATS score and personalized feedback."}
        </p>
      </div>
      
      {viewState === "zero" && renderZeroState()}
      {viewState === "role_selection" && renderRoleSelectionState()}
      {viewState === "analyzing" && renderAnalyzingState()}
      {viewState === "results" && renderResultsState()}

    </div>
  );
}
