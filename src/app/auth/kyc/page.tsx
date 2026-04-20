"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { VILLAGES } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function KYCPage() {
  const [userId, setUserId]   = useState("");
  const [email, setEmail]     = useState("");
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [form, setForm] = useState({
    full_name: "", date_of_birth: "", phone: "", sex: "", village: "",
  });
  const [agreed, setAgreed]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push("/auth/login"); return; }
      setUserId(data.user.id);
      setEmail(data.user.email ?? "");

      // Check if KYC already submitted
      const { data: profile } = await supabase
        .from("users")
        .select("village, full_name, status")
        .eq("id", data.user.id)
        .single();

      if (profile?.village) {
        // KYC already done — redirect based on status
        setAlreadyDone(true);
        if (profile.status === "approved") {
          router.push("/dashboard");
        } else {
          router.push("/auth/pending");
        }
      } else {
        setChecking(false);
      }
    });
  }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim())  return toast.error("Full name is required");
    if (!form.date_of_birth)     return toast.error("Date of birth is required");
    if (!form.phone.trim())      return toast.error("Phone number is required");
    if (form.phone.trim().length < 10) return toast.error("Enter a valid phone number");
    if (!form.sex)               return toast.error("Please select your sex");
    if (!form.village)           return toast.error("Please select your village");
    if (!agreed)                 return toast.error("You must agree to the Terms and Privacy Policy");

    setLoading(true);
    try {
      const { error } = await supabase.from("users").update({
        full_name:     form.full_name.trim(),
        date_of_birth: form.date_of_birth,
        phone:         form.phone.trim(),
        sex:           form.sex,
        village:       form.village,
        updated_at:    new Date().toISOString(),
      }).eq("id", userId);

      if (error) throw error;

      toast.success("KYC submitted successfully! Awaiting admin approval.");
      router.push("/auth/pending");
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1.5px solid #c8e6c9", borderRadius: 10,
    padding: "12px 16px", fontSize: 15, outline: "none",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  if (checking || alreadyDone) {
    return (
      <div style={{ minHeight: "100vh", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#2d6a2d", fontWeight: 600, fontSize: 16 }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#eaf5ea", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px", fontFamily: "Outfit, sans-serif" }}>
      <div style={{ background: "white", borderRadius: 20, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", padding: 36, width: "100%", maxWidth: 480 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 44, margin: "0 0 6px" }}>📋</p>
          <h1 style={{ color: "#2d6a2d", fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>
            Identity Verification
          </h1>
          <p style={{ color: "#6b7280", fontSize: 14, margin: 0 }}>
            Complete your KYC to join the Akpu Community
          </p>
          <p style={{ color: "#9ca3af", fontSize: 12, margin: "4px 0 0" }}>{email}</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Full Name <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input required value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)}
              placeholder="Your full name as known in the community"
              style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Date of Birth <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input type="date" required value={form.date_of_birth}
              onChange={(e) => set("date_of_birth", e.target.value)}
              style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Phone Number <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <input type="tel" required value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="e.g. 08012345678"
              style={inputStyle} />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Sex <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select required value={form.sex}
              onChange={(e) => set("sex", e.target.value)}
              style={inputStyle}>
              <option value="">-- Select --</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
              Village <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <select required value={form.village}
              onChange={(e) => set("village", e.target.value)}
              style={inputStyle}>
              <option value="">-- Select your village --</option>
              {VILLAGES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div style={{ background: "#eaf5ea", border: "1.5px solid #c8e6c9", borderRadius: 10, padding: 14 }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input type="checkbox" checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: "#2d6a2d", flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
                By submitting this form, I agree to the{" "}
                <Link href="/terms" target="_blank" style={{ color: "#2d6a2d", fontWeight: 700 }}>Terms of Use</Link>
                {" "}and{" "}
                <Link href="/privacy" target="_blank" style={{ color: "#2d6a2d", fontWeight: 700 }}>Privacy Policy</Link>
                {" "}guiding this Platform.
              </span>
            </label>
          </div>

          <button type="submit" disabled={loading || !agreed}
            style={{ background: loading || !agreed ? "#9ca3af" : "#2d6a2d", color: "white", border: "none", padding: 14, borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: loading || !agreed ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
            {loading ? "Submitting..." : "Submit KYC"}
          </button>
        </form>
      </div>
    </div>
  );
}
