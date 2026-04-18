"use client";
import { useState } from "react";
import { registerUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    
    setLoading(true);
    try {
      // Normalize email to avoid duplicate/incorrect entries
      const normalizedEmail = email.trim().toLowerCase();
      
      await registerUser(normalizedEmail, password);
      
      toast.success("Account created! Let's verify your identity.");
      
      // Refresh to sync auth state then push to KYC
      router.refresh();
      router.push("/auth/kyc");
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 p-10 w-full max-w-md border border-gray-100">
        
        {/* Community Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 -rotate-3">
            <span className="text-3xl rotate-3">🌿</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Join Akpu Community</h1>
          <p className="text-secondary font-bold text-[10px] uppercase tracking-[0.2em] mt-1">
            Official Portal • Registration
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. mazi@akpu.com"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Create Password
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Confirm Password
            </label>
            <input 
              type="password" 
              required 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          {/* Security Note */}
          <div className="flex items-center gap-2 px-1">
            <div className={`h-1.5 flex-1 rounded-full ${password.length >= 8 ? 'bg-green-400' : 'bg-gray-100'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${password === confirm && confirm !== "" ? 'bg-green-400' : 'bg-gray-100'}`}></div>
            <div className={`h-1.5 flex-1 rounded-full ${password.length > 12 ? 'bg-green-400' : 'bg-gray-100'}`}></div>
            <span className="text-[9px] font-black text-gray-400 uppercase ml-2">Strength</span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Creating Account...
              </span>
            ) : "Join Now"}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-gray-50 text-center space-y-4">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-black hover:underline">
              Sign In
            </Link>
          </p>
          
          <div className="flex justify-center items-center gap-4">
            <Link href="/" className="text-[10px] font-bold text-gray-300 hover:text-gray-500 uppercase tracking-tight">
              Home
            </Link>
            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
            <Link href="/terms" className="text-[10px] font-bold text-gray-300 hover:text-gray-500 uppercase tracking-tight">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}