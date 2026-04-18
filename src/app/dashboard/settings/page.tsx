"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { VILLAGES } from "@/lib/auth";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", date_of_birth: "", sex: "", village: "" });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("users").select("*").eq("id", data.user.id).single()
          .then(({ data: p }) => {
            setProfile(p);
            setForm({ full_name: p?.full_name ?? "", phone: p?.phone ?? "", date_of_birth: p?.date_of_birth ?? "", sex: p?.sex ?? "", village: p?.village ?? "" });
          });
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("users").update({ ...form, updated_at: new Date().toISOString() }).eq("id", user!.id);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (err: any) { toast.error(err.message); }
    setLoading(false);
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const path = `${user!.id}/avatar-${Date.now()}.${file.name.split(".").pop()}`;
      const { data } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (data) {
        const url = supabase.storage.from("avatars").getPublicUrl(data.path).data.publicUrl;
        await supabase.from("users").update({ avatar_url: url }).eq("id", user!.id);
        setProfile((p: any) => ({ ...p, avatar_url: url }));
        toast.success("Photo updated!");
      }
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-primary mb-6">Profile Settings</h1>
      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <img src={profile?.avatar_url ?? "/avatar-placeholder.png"}
              className="w-20 h-20 rounded-full object-cover border-4 border-primary shadow" />
            <button onClick={() => avatarRef.current?.click()}
              className="absolute -bottom-1 -right-1 bg-secondary text-white w-7 h-7 rounded-full text-sm flex items-center justify-center hover:bg-secondary-dark">
              ✎
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleAvatarUpload(e.target.files[0]); }} />
          </div>
          <div>
            <p className="font-bold text-lg text-primary">{profile?.full_name || "No name"}</p>
            <p className="text-gray-500 text-sm">{profile?.email}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${profile?.status === "approved" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
              {profile?.status}
            </span>
            {uploading && <p className="text-xs text-primary mt-1">Uploading photo...</p>}
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <select value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
            <select value={form.village} onChange={e => setForm(p => ({ ...p, village: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm">
              <option value="">-- Select --</option>
              {VILLAGES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-60">
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-secondary mb-4">Account Info</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p><span className="font-semibold">Email:</span> {profile?.email}</p>
          <p><span className="font-semibold">Village:</span> {profile?.village || "Not set"}</p>
          <p><span className="font-semibold">Member since:</span> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "Unknown"}</p>
          <p><span className="font-semibold">Account status:</span> {profile?.status}</p>
        </div>
      </div>
    </div>
  );
}
