"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VILLAGES } from "@/lib/auth";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ 
    full_name: "", 
    phone: "", 
    date_of_birth: "", 
    sex: "", 
    village: "" 
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("users").select("*").eq("id", data.user.id).single()
          .then(({ data: p }) => {
            setProfile(p);
            setForm({ 
              full_name: p?.full_name ?? "", 
              phone: p?.phone ?? "", 
              date_of_birth: p?.date_of_birth ?? "", 
              sex: p?.sex ?? "", 
              village: p?.village ?? "" 
            });
          });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updateData = { ...form, updated_at: new Date().toISOString() };
      
      const { error } = await supabase.from("users").update(updateData).eq("id", user!.id);
      if (error) throw error;
      
      // Update local profile state to reflect changes in UI
      setProfile((p: any) => ({ ...p, ...form }));
      toast.success("Profile updated successfully!");
    } catch (err: any) { 
      toast.error(err.message || "Failed to save changes"); 
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarUpload(file: File) {
    if (file.size > 2 * 1024 * 1024) return toast.error("File must be under 2MB");
    
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = file.name.split(".").pop();
      const path = `${user!.id}/avatar-${Date.now()}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      if (data) {
        const url = supabase.storage.from("avatars").getPublicUrl(data.path).data.publicUrl;
        await supabase.from("users").update({ avatar_url: url }).eq("id", user!.id);
        setProfile((p: any) => ({ ...p, avatar_url: url }));
        toast.success("Profile photo updated!");
      }
    } catch (err: any) { 
      toast.error("Upload failed. Try again."); 
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your identity and preferences in the Akpu Portal.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Status */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <div className={`w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-xl ring-1 ring-gray-100 ${uploading ? 'opacity-50' : ''}`}>
                <img 
                  src={profile?.avatar_url ?? `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=random`}
                  className="w-full h-full object-cover" 
                  alt="Profile"
                />
              </div>
              <button 
                onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-2 -right-2 bg-primary text-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                title="Change Photo"
              >
                📸
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden"
                onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
            </div>
            
            <h2 className="font-black text-gray-900 truncate">{profile?.full_name || "Community Member"}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 mb-4">{profile?.email}</p>
            
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
              profile?.status === "approved" ? "bg-green-50 text-green-600 border border-green-100" : "bg-orange-50 text-orange-600 border border-orange-100"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${profile?.status === "approved" ? "bg-green-500" : "bg-orange-500 animate-pulse"}`}></span>
              {profile?.status || "Pending"}
            </div>
          </div>

          <div className="bg-gray-900 rounded-[2rem] p-6 text-white shadow-xl shadow-gray-200">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Security Notice</h3>
            <p className="text-[11px] leading-relaxed opacity-70">
              Only verified members can participate in Umunna groups and view community files. Keep your profile updated to ensure uninterrupted access.
            </p>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input 
                  value={form.full_name} 
                  onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <input 
                  value={form.phone} 
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Village</label>
                <select 
                  value={form.village} 
                  onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">Select Village</option>
                  {VILLAGES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Date of Birth</label>
                <input 
                  type="date" 
                  value={form.date_of_birth} 
                  onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all" 
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Sex</label>
                <select 
                  value={form.sex} 
                  onChange={e => setForm(p => ({ ...p, sex: e.target.value }))}
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-primary transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Updating Profile..." : "Save Changes"}
              </button>
            </div>
          </form>
          
          <div className="mt-8 flex justify-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
              Joined Akpu Community on {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}