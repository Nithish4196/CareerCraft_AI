"use client";

import React, { useState } from 'react';
import { signInWithEmail, resendVerificationEmail } from '@/lib/auth';
import AuthLayout from '@/components/auth/AuthLayout';
import OAuthButtons from '@/components/auth/OAuthButtons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showResend, setShowResend] = useState(false);

  const router = useRouter();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setShowResend(false);
    setIsLoading(true);

    const { success, error } = await signInWithEmail(email, password);
    setIsLoading(false);

    if (success) {
      toast.success("Welcome back!");
      router.push("/dashboard");
    } else {
      setErrorMsg(error ||"Invalid email or password.");
      if (error ==="Please verify your email before signing in.") {
        setShowResend(true);
      }
    }
  };

  const handleResend = async () => {
    const { success, error } = await resendVerificationEmail();
    if (success) {
      toast.success("Verification email resent. Please check your inbox.");
      setShowResend(false);
    } else {
      toast.error(error ||"Failed to resend email.");
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        <h2 className="text-2xl font-extrabold mb-2">Welcome back</h2>
        <p className="text-muted-foreground mb-8">Sign in to your CareerCraft AI account.</p>

        <OAuthButtons />

        <form onSubmit={handleSignIn} className="space-y-4">
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
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" id="remember" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                className="rounded border-muted text-primary focus:ring-primary"
              />
              <label htmlFor="remember" className="text-sm font-bold text-muted-foreground">Remember me</label>
            </div>
            <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-lg text-center flex flex-col items-center gap-2">
              <span>{errorMsg}</span>
              {showResend && (
                <button type="button" onClick={handleResend} className="text-xs font-bold underline hover:text-red-400">
                  Resend verification email
                </button>
              )}
            </div>
          )}

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-3 bg-foreground text-background font-bold rounded-xl hover:bg-foreground/90 transition-colors duration-150 ease-out flex justify-center items-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> :"Sign In"}
          </button>

        </form>

        <p className="text-center text-sm font-bold text-muted-foreground mt-8">
          Don't have an account? <Link href="/sign-up" className="text-foreground hover:underline">Sign up →</Link>
        </p>

      </div>
    </AuthLayout>
  );
}
