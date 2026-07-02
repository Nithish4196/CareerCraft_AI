import { NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";

export interface Job {
  id: string;
  title: string;
  role: string;
  company: string;
  companyName: string;
  companyLogo: string | null;
  location: string;
  locationType: "Remote" | "Hybrid" | "Onsite";
  workMode: "Remote" | "Hybrid" | "Onsite";
  jobType: string;
  workType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  postedDate: string | null;
  applyUrl: string;
  applyLink: string;
  sourcePlatform: string;
  source: string;
  description: string;
  skills: string[];
  skillsRequired: string[];
  responsibilities: string[];
  benefits: string[];
  hiringProcess: string[];
  companyOverview: string;
  experienceRequired: string;
  experienceLevel: string;
  matchScore: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      query: searchQuery = "",
      location = "",
      locationType = [],
      jobType = [],
      experience = [],
      salaryMin = 0,
      page = 1,
      freshness = "all", // "Posted Today", "Last 7 Days", "Last 30 Days", "all"
      userTargetRole = "",
      userSkills = [],
      userExperience = "Fresher",
    } = body;

    const role = (searchQuery && searchQuery.trim()) || (userTargetRole && userTargetRole.trim()) || "software engineer";
    const city = (location && location !== "Anywhere in India" && location.trim()) || "";

    // 1. Firestore Cache Check (30 mins)
    const cacheKey = `${role.toLowerCase()}_${city.toLowerCase()}_${page}_${freshness.replace(/ /g, "")}_${salaryMin}`;
    let cachedJobs: Job[] = [];
    let isCached = false;
    
    try {
      const cacheRef = collection(db, "job_cache");
      const q = query(cacheRef, where("cacheKey", "==", cacheKey));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Find the newest cache entry if multiple exist
        let latestDoc = snap.docs[0].data();
        snap.docs.forEach(d => {
           if (d.data().createdAt.seconds > latestDoc.createdAt.seconds) latestDoc = d.data();
        });

        const createdAt = latestDoc.createdAt;
        const now = Timestamp.now();
        
        if (now.seconds - createdAt.seconds < 30 * 60) {
          cachedJobs = JSON.parse(latestDoc.jobsData);
          isCached = true;
          console.log(`[CACHE HIT] Adzuna jobs for key: ${cacheKey}`);
        } else {
          console.log(`[CACHE EXPIRED] Adzuna jobs for key: ${cacheKey}`);
        }
      }
    } catch (e) {
      console.warn("Firestore cache check failed:", e);
    }

    let allJobs = cachedJobs;
    let debugInfo = { cached: isCached, adzuna: isCached ? cachedJobs.length : 0 };

    if (!isCached) {
      // 2. Fetch from Adzuna ONLY
      if (!process.env.ADZUNA_APP_ID || !process.env.ADZUNA_APP_KEY) {
         throw new Error("Adzuna API keys are missing in environment variables.");
      }

      const params = new URLSearchParams({
        app_id: process.env.ADZUNA_APP_ID,
        app_key: process.env.ADZUNA_APP_KEY,
        results_per_page: "20",
        what: role,
        "content-type": "application/json",
      });

      if (city) params.set("where", city);
      if (salaryMin > 0) params.set("salary_min", salaryMin.toString());

      if (freshness === "Posted Today") params.set("max_days_old", "1");
      else if (freshness === "Last 7 Days") params.set("max_days_old", "7");
      else if (freshness === "Last 30 Days") params.set("max_days_old", "30");

      const url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?${params.toString()}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Adzuna HTTP ${res.status}`);
      }

      const data = await res.json();
      
      if (data.results && Array.isArray(data.results)) {
        allJobs = data.results.map((job: any): Job => {
          const desc = (job.description || "").toLowerCase();
          const locType = desc.includes("remote") ? "Remote" : desc.includes("hybrid") ? "Hybrid" : "Onsite";
          const extractedSkills = extractSkills(desc);
          const source = "Adzuna";

          return {
            id: `adzuna_${job.id}`,
            title: job.title || "Untitled",
            role: job.title || "Untitled",
            company: job.company?.display_name || "Unknown Company",
            companyName: job.company?.display_name || "Unknown Company",
            companyLogo: null,
            location: job.location?.display_name || city || "India",
            locationType: locType,
            workMode: locType,
            jobType: job.contract_time === "part_time" ? "Part-Time" : "Full-Time",
            workType: job.contract_time === "part_time" ? "Part-Time" : "Full-Time",
            salaryMin: job.salary_min ? Math.round(job.salary_min / 100000) : null,
            salaryMax: job.salary_max ? Math.round(job.salary_max / 100000) : null,
            postedDate: job.created ? new Date(job.created).toISOString() : null,
            applyUrl: job.redirect_url || "",
            applyLink: job.redirect_url || "",
            sourcePlatform: source,
            source: source,
            description: (job.description || "").slice(0, 800),
            skills: extractedSkills,
            skillsRequired: extractedSkills,
            responsibilities: [],
            benefits: [],
            hiringProcess: [],
            companyOverview: "",
            experienceRequired: "Not specified",
            experienceLevel: "0-2 Years",
            matchScore: null,
          };
        });
      }

      debugInfo.adzuna = allJobs.length;

      // Deduplicate
      const seen = new Set<string>();
      allJobs = allJobs.filter((job) => {
        const key = `${job.title.toLowerCase().trim()}_${job.company.toLowerCase().trim()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Save to cache
      try {
        if (allJobs.length > 0) {
          addDoc(collection(db, "job_cache"), {
            cacheKey,
            jobsData: JSON.stringify(allJobs),
            createdAt: Timestamp.now()
          }).catch(console.warn);
        }
      } catch (e) {
        console.warn("Failed to write to cache", e);
      }
    }

    // 3. Post-Fetch Filtering (LocationType, JobType)
    let filtered = allJobs;

    if (locationType && locationType.length > 0) {
      filtered = filtered.filter((job) => locationType.includes(job.locationType));
    }

    const empTypes = (jobType || []).filter((t: string) =>
      ["Full-Time", "Part-Time", "Contract", "Internship"].includes(t)
    );
    if (empTypes.length > 0) {
      filtered = filtered.filter((job) => empTypes.includes(job.jobType));
    }

    // 4. Deterministic Match Scoring (60% Skill, 30% Experience, 10% Location)
    const scoredJobs = filtered.map(job => {
      let score = 0;
      
      // Skills Match (60 points)
      let skillPoints = 0;
      if (job.skillsRequired.length > 0 && userSkills.length > 0) {
        let matches = 0;
        const normalizedUserSkills = userSkills.map((s: string) => s.toLowerCase());
        job.skillsRequired.forEach(sk => {
          if (normalizedUserSkills.includes(sk.toLowerCase())) matches++;
        });
        skillPoints = (matches / job.skillsRequired.length) * 60;
      } else {
        skillPoints = 30; // default middle if no skills to compare
      }
      
      // Experience Match (30 points)
      let expPoints = 15; // Default middle
      if (experience && experience.length > 0) {
        const userExpLower = experience[0].toLowerCase();
        const jobExpLower = job.experienceLevel.toLowerCase();
        
        if (userExpLower.includes("fresher") && jobExpLower.includes("0-2")) expPoints = 30;
        else if (userExpLower.includes("0-2") && jobExpLower.includes("0-2")) expPoints = 30;
        else if (userExpLower.includes("2-5") && jobExpLower.includes("2-5")) expPoints = 30;
        else if (userExpLower.includes("5+") && jobExpLower.includes("5+")) expPoints = 30;
        else expPoints = 10;
      }

      // Location Match (10 points)
      let locPoints = 0;
      if (job.locationType === "Remote") locPoints = 10;
      else if (city && job.location.toLowerCase().includes(city.toLowerCase())) locPoints = 10;
      else if (locationType.includes(job.locationType)) locPoints = 10;
      else locPoints = 5;

      score = Math.round(skillPoints + expPoints + locPoints);
      
      return {
        ...job,
        matchScore: Math.min(100, score)
      };
    });

    // Sort by match score
    scoredJobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    return Response.json({
      jobs: scoredJobs,
      total: scoredJobs.length,
      debug: debugInfo
    });

  } catch (error) {
    console.error("Route-level crash:", error);
    return Response.json(
      { error: "Job search failed", details: String(error), jobs: [], total: 0 },
      { status: 500 }
    );
  }
}

// ============================================
// EXTRACT SKILLS HELPER
// ============================================
function extractSkills(text: string): string[] {
  const commonSkills = ["react", "node.js", "python", "java", "sql", "aws", "docker", "kubernetes", "typescript", "javascript", "excel", "power bi", "machine learning", "html", "css", "c++", "c#", "golang", "angular", "vue", "django", "flask"];
  const textLower = text.toLowerCase();
  const skills = [];
  for (const skill of commonSkills) {
    if (textLower.includes(skill)) {
      skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  }
  return skills.length > 0 ? skills : ["Communication", "Problem Solving"];
}
