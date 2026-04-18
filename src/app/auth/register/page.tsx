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
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    try {
      await registerUser(email, password);
      toast.success("Account created! Please complete your KYC.");
      router.push("/auth/kyc");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🏘️</p>
          <h1 className="text-2xl font-extrabold text-primary">Join Akpu Community</h1>
          <p className="text-secondary text-sm">Land of the Ancients</p>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-6">Create Account</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
              className="w-full border rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary text-sm" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-secondary text-white py-3 rounded-lg font-semibold hover:bg-secondary-dark transition disabled:opacity-60">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          Already a member?{" "}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
        <p className="text-center mt-2">
          <Link href="/" className="text-xs text-gray-400 hover:underline">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
