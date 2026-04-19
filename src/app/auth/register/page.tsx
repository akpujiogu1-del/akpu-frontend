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
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await registerUser(email, password);
      setDone(true);
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#eaf5ea" }}>
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
          <p className="text-5xl mb-4">📧</p>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: "#2d6a2d" }}>
            Check Your Email
          </h1>
          <p className="text-gray-600 mb-4 font-semibold">
            Verify your email and complete the KYC form.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            We sent a verification link to <strong>{email}</strong>.
            Click the link in the email to verify your address and you will
            be directed to complete your KYC form. Your account will then
            be reviewed by the admin before you get full access.
          </p>
          <div style={{ background: "#eaf5ea", border: "1px solid #c8e6c9" }}
            className="rounded-xl p-4 text-sm text-left space-y-2">
            <p style={{ color: "#2d6a2d" }} className="font-semibold">What happens next?</p>
            <p className="text-gray-600">✅ Click the link in your email</p>
            <p className="text-gray-600">✅ Complete your KYC form</p>
            <p className="text-gray-600">✅ Wait for admin approval</p>
            <p className="text-gray-600">✅ Get full access to the platform</p>
          </div>
          <Link href="/" className="inline-block mt-6 text-sm font-semibold hover:underline"
            style={{ color: "#6b3a1f" }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#eaf5ea" }}>
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🏘️</p>
          <h1 className="text-2xl font-extrabold" style={{ color: "#2d6a2d" }}>
            Join Akpu Community
          </h1>
          <p className="text-sm" style={{ color: "#6b3a1f" }}>Land of the Ancients</p>
        </div>
        <form onSubmit={handleRegister} className="space-y-4">
          {[
            { label: "Email Address", value: email, set: setEmail, type: "email" },
            { label: "Password", value: password, set: setPassword, type: "password" },
            { label: "Confirm Password", value: confirm, set: setConfirm, type: "password" },
          ].map((f) => (
            <div key={f.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type} required value={f.value}
                onChange={(e) => f.set(e.target.value)}
                className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
                style={{ borderColor: "#c8e6c9" }}
                onFocus={(e) => e.target.style.borderColor = "#2d6a2d"}
                onBlur={(e) => e.target.style.borderColor = "#c8e6c9"} />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-60"
            style={{ background: "#6b3a1f" }}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Already a member?{" "}
          <Link href="/auth/login" className="font-semibold hover:underline"
            style={{ color: "#2d6a2d" }}>Sign In</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-xs text-gray-400 hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
