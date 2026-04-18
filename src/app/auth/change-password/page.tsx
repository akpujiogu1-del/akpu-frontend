"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");

    setLoading(true);
    try {
      // 1. Update the password in Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Get the current user to update their profile flag
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 3. Clear the force_password_change flag in your public.users table
        const { error: dbError } = await supabase
          .from("users")
          .update({ force_password_change: false })
          .eq("id", user.id);
          
        if (dbError) {
          console.error("Profile update error:", dbError);
          // We don't necessarily want to halt here if the password itself 
          // was changed, but we should log it.
        }
      }

      toast.success("Security updated! Welcome back.");
      
      // 4. Refresh the session and redirect
      router.refresh(); 
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "An error occurred while updating your password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900">Secure Your Account</h1>
          <p className="text-gray-500 text-sm mt-2">
            Please set a new password to activate your Akpu Community membership.
          </p>
        </div>

        <form onSubmit={handleChange} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              New Password
            </label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary text-sm transition-all" 
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Confirm Password
            </label>
            <input 
              type="password" 
              required 
              value={confirm} 
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 outline-none focus:ring-2 focus:ring-primary text-sm transition-all" 
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-[11px] text-blue-700 leading-relaxed">
              <strong>Tip:</strong> Use a mix of letters, numbers, and symbols to make your account more secure.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? "Updating Security..." : "Set New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}