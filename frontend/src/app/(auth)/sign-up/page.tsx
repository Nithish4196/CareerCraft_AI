"use client";

import React, { useState } from 'react';
import { signUpWithEmail } from '@/lib/auth';
import AuthLayout from '@/components/auth/AuthLayout';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const router = useRouter();

  // Password strength meter
  const getPasswordStrength = () => {
    if (!password) return { label:"", color:"bg-muted", width:"0%" };
    if (password.length < 8) return { label:"Weak", color:"bg-red-500", width:"25%" };
    
    let strength = 0;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;

    if (password.length >= 8 && strength === 0) return { label:"Fair", color:"bg-amber-500", width:"50%" };
    if (password.length >= 8 && strength > 0 && password.length < 12) return { label:"Strong", color:"bg-green-500", width:"75%" };
    if (password.length >= 12 && strength >= 2) return { label:"Very Strong", color:"bg-blue-500", width:"100%" };
    
    return { label:"Fair", color:"bg-amber-500", width:"50%" };
  };

  const strength = getPasswordStrength();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    if (!terms) {
      setErrorMsg("You must agree to the Terms of Service.");
      return;
    }

    setIsLoading(true);
    const { success, error } = await signUpWithEmail(email, password, name);
    setIsLoading(false);

    if (success) {
      toast.success("Account created successfully!");
      router.push("/verify-email");
    } else {
      setErrorMsg(error ||"An error occurred during sign up.");
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h2 className="text-2xl font-extrabold mb-2">Create an account</h2>
        <p className="text-muted-foreground mb-8">Join CareerCraft AI to accelerate your career.</p>

        <OAuthButtons />

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">Full Name</label>
            <input 
              required type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-muted/30 border border-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. Jane Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Email</label>
            <input 
              required type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-muted/30 border border-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Password</label>
            <div className="relative">
              <input 
                required type={showPassword ?"text" :"password"} value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-muted/30 border border-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors pr-10"
                placeholder="Minimum 8 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Strength Meter */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-muted-foreground">Password strength</span>
                  <span className={`text-xs font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color}`} style={{ width: strength.width }}></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">Confirm Password</label>
            <div className="relative">
              <input 
                required type={showConfirm ?"text" :"password"} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-muted/30 border border-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors pr-10"
                placeholder="Confirm your password"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-start gap-2 pt-2">
            <input 
              type="checkbox" required id="terms" checked={terms} onChange={e => setTerms(e.target.checked)}
              className="mt-1 rounded border-muted text-primary focus:ring-primary"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              I agree to the <a href="#" className="text-foreground font-bold hover:underline">Terms of Service</a> and <a href="#" className="text-foreground font-bold hover:underline">Privacy Policy</a>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-lg text-center">
              {errorMsg}
            </div>
          )}

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors duration-150 ease-out flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :"Create Account"}
          </button>

        </form>

        <p className="text-center text-sm font-bold text-muted-foreground mt-8">
          Already have an account? <Link href="/sign-in" className="text-foreground hover:underline">Sign in →</Link>
        </p>

      </div>
    </AuthLayout>
  );
}
