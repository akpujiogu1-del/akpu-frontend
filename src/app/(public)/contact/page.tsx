"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { CONTACT_RECIPIENTS } from "@/lib/auth";
import Link from "next/link";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", phone: "", email: "", subject: "", recipient: "", body: "",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("contact_messages").insert(form);
      if (error) throw error;
      setSent(true);
      toast.success("Message sent successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: "#eaf5ea" }}>
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-2xl font-extrabold mb-3" style={{ color: "#2d6a2d" }}>
            Message Sent!
          </h1>
          <p className="text-gray-600 mb-6">
            Your message has been delivered to the {form.recipient}. You will be contacted soon.
          </p>
          <Link href="/"
            className="inline-block px-8 py-3 rounded-full font-semibold text-white"
            style={{ background: "#2d6a2d" }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Link href="/"
        className="inline-flex items-center gap-2 mb-6 text-sm font-semibold hover:underline"
        style={{ color: "#6b3a1f" }}>
        ← Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#2d6a2d" }}>
        Contact Us
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Send a message to any of our community leaders or officers.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: "name",    label: "Full Name",    type: "text"  },
          { name: "phone",   label: "Phone Number", type: "tel"   },
          { name: "email",   label: "Email",        type: "email" },
          { name: "subject", label: "Subject",      type: "text"  },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
            <input type={f.type} required
              value={(form as any)[f.name]}
              onChange={(e) => setForm((p) => ({ ...p, [f.name]: e.target.value }))}
              className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
              style={{ borderColor: "#c8e6c9" }} />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
          <select required value={form.recipient}
            onChange={(e) => setForm((p) => ({ ...p, recipient: e.target.value }))}
            className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
            style={{ borderColor: "#c8e6c9" }}>
            <option value="">-- Select recipient --</option>
            {CONTACT_RECIPIENTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea required rows={4} value={form.body}
            onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
            className="w-full border rounded-lg px-4 py-2.5 outline-none text-sm"
            style={{ borderColor: "#c8e6c9" }} />
        </div>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-60"
          style={{ background: "#2d6a2d" }}>
          {loading ? "Sending..." : "Send Message"}
        </button>

        <Link href="/"
          className="block text-center text-sm font-semibold hover:underline mt-2"
          style={{ color: "#6b3a1f" }}>
          ← Back to Home
        </Link>
      </form>
    </div>
  );
}
