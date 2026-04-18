"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { submitKYC, VILLAGES } from "@/lib/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function KYCPage() {
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({ 
    full_name: "", 
    date_of_birth: "", 
    phone: "", 
    sex: "", 
    village: "" 
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
      } else {
        setUserId(user.id);
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic Validation
    if (Object.values(form).some(val => !val)) {
      return toast.error("Please fill in all identity fields");
    }

    // Age validation check (must be at least 13 or similar community rule)
    const birthDate = new Date(form.date_of_birth);
    if (birthDate > new Date()) {
      return toast.error("Date of birth cannot be in the future");
    }

    setLoading(true);
    try {
      // submitKYC usually updates the 'users' table with status='pending'
      await submitKYC(userId, form as any);
      toast.success("Details submitted for review!");
      
      // Redirect to a 'Thank You / Pending' page
      router.push("/auth/pending");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl shadow-primary/5 p-8 w-full max-w-lg border border-gray-100">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-4">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Identity Verification</h1>
          <p className="text-gray-500 text-sm mt-2">
            This information helps us verify your membership in <span className="text-primary font-bold">Akpu Community</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <input 
              required 
              value={form.full_name} 
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Enter your legal name"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* DOB */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
              <input 
                type="date" 
                required 
                value={form.date_of_birth} 
                onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
              />
            </div>
            {/* Sex */}
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sex</label>
              <select 
                required 
                value={form.sex} 
                onChange={e => setForm(p => ({ ...p, sex: e.target.value }))}
                className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
            <input 
              type="tel" 
              required 
              value={form.phone} 
              onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="080 0000 0000"
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
            />
          </div>

          {/* Village */}
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Village</label>
            <select 
              required 
              value={form.village} 
              onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
              className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all"
            >
              <option value="">-- Choose your village --</option>
              {VILLAGES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          {/* Warning Note */}
          <div className="p-4 bg-orange-50 rounded-2xl flex gap-3 items-start">
            <span className="text-lg">⚠️</span>
            <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
              Ensure these details are correct. You won't be able to change them once you submit for verification.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </span>
            ) : "Submit Verification"}
          </button>
        </form>
      </div>
    </div>
  );
}