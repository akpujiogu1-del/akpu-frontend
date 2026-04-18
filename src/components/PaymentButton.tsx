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
    const reference = `AKPU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const { error } = await supabase.from("payments").insert({
      user_id: userId,
      group_id: groupId ?? null,
      category,
      amount,
      reference,
      status: "pending",
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    try {
      // The "as any" on the string prevents TypeScript from checking node_modules
      const PaystackModule = await import("@paystack/inline-js" as any);
      const PaystackPop = PaystackModule.default;
      const popup = new PaystackPop();

      popup.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        email,
        amount: amount * 100,
        ref: reference,
        currency: "NGN",
        metadata: { userId, groupId, category },

        onSuccess: async (transaction: any) => {
          const res = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference: transaction.reference }),
          });
          const data = await res.json();
          if (data.success) toast.success("Payment successful! ✅");
          else toast.error("Payment verification failed.");
          setLoading(false);
        },

        onCancel: () => {
          toast.error("Payment cancelled.");
          setLoading(false);
        },
      });
    } catch (err) {
      console.error("Paystack load error:", err);
      toast.error("Could not load payment gateway.");
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-60"
    >
      {loading ? "Processing..." : label ?? `Pay ₦${amount.toLocaleString()}`}
    </button>
  );
}