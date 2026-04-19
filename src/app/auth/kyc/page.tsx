"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { submitKYC, VILLAGES } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function KYCPage() {
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({
    full_name: "", date_of_birth: "", phone: "", sex: "", village: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push("/auth/login");
      else setUserId(data.user.id);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.date_of_birth || !form.phone || !form.sex || !form.village) {
      return toast.error("All fields are required");
    }
    if (!agreed) return toast.error("You must agree to the Terms of Use and Privacy Policy");
    setLoading(true);
    try {
      await submitKYC(userId, form as any);
      toast.success("KYC submitted! Awaiting approval.");
      router.push("/auth/pending");
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "#eaf5ea" }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">📋</p>
          <h1 className="text-2xl font-extrabold" style={{ color: "#2d6a2d" }}>
            Identity Verification
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete your KYC to join the community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input required value={form.full_name}
              onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
              placeholder="Your full name as known in the community"
              className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
              style={{ borderColor: "#c8e6c9" }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input type="date" required value={form.date_of_birth}
              onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
              style={{ borderColor: "#c8e6c9" }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" required value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="e.g. 08012345678"
              className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
              style={{ borderColor: "#c8e6c9" }} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <select required value={form.sex}
              onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
              style={{ borderColor: "#c8e6c9" }}>
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Village</label>
            <select required value={form.village}
              onChange={(e) => setForm((p) => ({ ...p, village: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
              style={{ borderColor: "#c8e6c9" }}>
              <option value="">-- Select your village --</option>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Terms agreement */}
          <div style={{ background: "#eaf5ea", border: "1px solid #c8e6c9" }}
            className="rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 accent-green-700" />
              <span className="text-sm text-gray-600">
                By completing and submitting this form, you agree to the{" "}
                <Link href="/terms" target="_blank"
                  className="font-semibold hover:underline" style={{ color: "#2d6a2d" }}>
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank"
                  className="font-semibold hover:underline" style={{ color: "#2d6a2d" }}>
                  Privacy Policy
                </Link>{" "}
                guiding this Platform.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !agreed}
            className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-60"
            style={{ background: agreed ? "#2d6a2d" : "#aaa" }}>
            {loading ? "Submitting..." : "Submit KYC"}
          </button>
        </form>
      </div>
    </div>
  );
}
