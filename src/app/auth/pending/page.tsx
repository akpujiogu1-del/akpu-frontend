"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function PendingPage() {
  const router = useRouter();

  // Polling or periodic check (Optional)
  // You could add an effect here that checks the user status every 30 seconds
  // and automatically redirects to /dashboard if they get approved while on this page.

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-primary/5 p-10 w-full max-w-md text-center border border-gray-100 relative overflow-hidden">
        
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary opacity-20"></div>

        <div className="relative">
          {/* Animated Status Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping opacity-25"></div>
            <div className="relative bg-white shadow-inner rounded-full w-20 h-20 flex items-center justify-center text-4xl border border-primary/10">
              ⏳
            </div>
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Verification in Progress</h1>
          
          <div className="space-y-3 mb-8">
            <p className="text-gray-600 text-sm leading-relaxed">
              Welcome to the Akpu Community Portal! Your KYC details are currently being reviewed by our village administrators.
            </p>
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-secondary rounded-full animate-pulse"></span>
              Status: Awaiting Admin Approval
            </div>
          </div>

          {/* Timeline Process */}
          <div className="bg-gray-50 rounded-3xl p-6 mb-8 border border-gray-100">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 text-left ml-1">The Verification Flow</h3>
            <div className="space-y-4">
              {[
                { label: "KYC Submission", status: "complete", desc: "Successfully received" },
                { label: "Identity Audit", status: "current", desc: "Admins are verifying details" },
                { label: "Full Access", status: "pending", desc: "Join groups & start chatting" }
              ].map((step, i) => (
                <div key={i} className="flex gap-3 text-left">
                  <div className="flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      step.status === 'complete' ? 'bg-green-500 text-white' : 
                      step.status === 'current' ? 'bg-primary text-white animate-pulse' : 
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {step.status === 'complete' ? '✓' : i + 1}
                    </div>
                    {i !== 2 && <div className="w-0.5 h-full bg-gray-100 min-h-[15px]"></div>}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</p>
                    <p className="text-[10px] text-gray-500">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              href="/" 
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-[0.98]"
            >
              Return Home
            </Link>
            
            <p className="text-[10px] text-gray-400 font-medium">
              Waiting longer than 48 hours? <button className="text-secondary font-bold hover:underline">Contact Support</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}