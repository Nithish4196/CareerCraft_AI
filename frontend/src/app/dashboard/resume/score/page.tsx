"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BackButton from "@/components/dashboard/BackButton";

export default function ResumeScorePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!user) return;
    
    const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file.");
      return;
    }

    try {
      setUploading(true);

      const resumeId = `resume_${Date.now()}`;
      const storageRef = ref(storage, `users/${user.uid}/resumes/${resumeId}_${file.name}`);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      const docRef = doc(db, `users/${user.uid}/resumes`, resumeId);
      await setDoc(docRef, {
        id: resumeId,
        fileName: file.name,
        fileUrl,
        uploadedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: "uploaded",
        rawText: "Extracting...",
        atsScore: null,
        status: "analyzing"
      });

      setUploading(false);
      setAnalyzing(true);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl })
      });

      if (!response.ok) throw new Error("Analysis failed");

      const analysisData = await response.json();

      await updateDoc(docRef, {
        atsScore: analysisData.atsScore,
        analysis: analysisData,
        status: "analyzed",
        updatedAt: serverTimestamp(),
      });

      toast.success("Resume analyzed successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during upload/analysis.");
      setUploading(false);
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      <BackButton />

      <h1 className="text-3xl font-bold mb-2">Upload Your Resume</h1>
      <p className="text-muted-foreground mb-8">Get an instant ATS score and personalized improvement tips.</p>
      
      <div className="bg-background border border-muted rounded-2xl shadow-sm p-6 md:p-10">
        {(uploading || analyzing) ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-12 h-12 text-foreground animate-spin" />
            <div className="text-center">
              <h3 className="font-bold text-lg">{uploading ? "Uploading File..." : "AI is analyzing your resume..."}</h3>
              <p className="text-muted-foreground text-sm mt-1">This may take a few seconds to extract and score.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Option A</h3>
              
              <div 
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                  isDragging ? "border-foreground bg-muted" : "border-muted hover:border-foreground/50 hover:bg-muted/30"
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
              <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Option B</h3>
              <button 
                onClick={() => router.push("/dashboard/resume")}
                className="w-full flex items-center justify-between p-6 border border-muted rounded-xl hover:border-foreground/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-lg bg-foreground text-background flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-lg font-bold group-hover:text-muted-foreground transition-colors">Build Resume Instead</div>
                    <div className="text-muted-foreground">Use our AI-powered templates</div>
                  </div>
                </div>
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">→</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
