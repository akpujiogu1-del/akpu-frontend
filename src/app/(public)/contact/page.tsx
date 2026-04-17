"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { CONTACT_RECIPIENTS } from "@/lib/auth";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    subject: "",
    recipient: "",
    body: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert(form);
      if (error) throw error;
      toast.success("Message sent successfully!");
      setForm({
        name: "",
        phone: "",
        email: "",
        subject: "",
        recipient: "",
        body: "",
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary mb-8">Contact Us</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: "name", label: "Full Name", type: "text" },
          { name: "phone", label: "Phone Number", type: "tel" },
          { name: "email", label: "Email", type: "email" },
          { name: "subject", label: "Subject", type: "text" },
        ].map((f) => (
          <div key={f.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label}
            </label>
            <input
              type={f.type}
              required
              value={(form as any)[f.name]}
              onChange={(e) =>
                setForm((p) => ({ ...p, [f.name]: e.target.value }))
              }
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient
          </label>
          <select
            required
            value={form.recipient}
            onChange={(e) =>
              setForm((p) => ({ ...p, recipient: e.target.value }))
            }
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="">-- Select recipient --</option>
            {CONTACT_RECIPIENTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            required
            rows={4}
            value={form.body}
            onChange={(e) =>
              setForm((p) => ({ ...p, body: e.target.value }))
            }
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send Message"}
        </button>
      </form>
    </div>
  );
}