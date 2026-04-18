"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type Category = "dues" | "levy" | "fine" | "donation";

interface Props {
  userId: string;
  email: string;
  groupId?: string;
  category: Category;
  amount: number;
  label?: string;
}

export default function PaymentButton({
  userId,
  email,
  groupId,
  category,
  amount,
  label,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const reference = `AKPU-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`;

      await supabase.from("payments").insert({
        user_id: userId,
        group_id: groupId ?? null,
        category,
        amount,
        reference,
        status: "pending",
      });

      toast.success("Payment recorded. Integration coming soon.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-primary-dark transition disabled:opacity-60"
    >
      {loading
        ? "Processing..."
        : label ?? `Pay NGN ${amount.toLocaleString()} (${category})`}
    </button>
  );
}
