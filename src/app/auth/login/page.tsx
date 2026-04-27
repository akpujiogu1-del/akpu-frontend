"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      if (error) throw error;

      toast.success("Welcome back!");
      
      // Refresh the router to sync the auth state with the server
      router.refresh();
      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="bg-white rounded-[2rem] shadow-xl shadow-primary/5 p-10 w-full max-w-md border border-gray-100">
        {/* Branding Section */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4 rotate-3">
            <span className="text-4xl -rotate-3">🏘️</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Akpu Community</h1>
          <p className="text-secondary font-bold text-xs uppercase tracking-widest mt-1">
            Land of the Ancients
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Email Address
            </label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
                Password
              </label>
              {/* FIX: Removed 'size' prop and moved text-[10px] into className */}
              <Link href="/auth/reset-password" className="text-[10px] text-secondary font-bold hover:underline">
                FORGOT?
              </Link>
            </div>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: "100%", background: loading ? "#9ca3af" : "#2d6a2d", color: "white", padding: "16px", borderRadius: 16, fontWeight: 700, border: "none", cursor: "pointer", fontSize: 15 }}
          >
            {loading ? "Verifying..." : "Sign In to Portal"}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-50 text-center space-y-3">
          <p className="text-sm text-gray-500">
            Not a member?{" "}
            <Link href="/auth/register" className="text-secondary font-black hover:underline">
              Join the Community
            </Link>
          </p>
          
          <Link href="/" className="inline-block text-[11px] font-bold text-gray-300 hover:text-gray-500 uppercase tracking-tighter transition-colors">
            ← Return to Home Page
          </Link>
        </div>
      </div>
    </div>
  );
}