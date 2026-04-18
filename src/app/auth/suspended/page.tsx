"use client";
import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-red-900/10 p-10 w-full max-w-md text-center border border-red-100 relative overflow-hidden">
        
        {/* Warning Banner */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>

        <div className="relative">
          {/* Suspension Icon */}
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm">
            <span className="text-4xl">🚫</span>
          </div>

          <div className="inline-flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
            Access Revoked
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Account Suspended</h1>
          
          <div className="space-y-4 mb-10">
            <p className="text-gray-500 text-sm leading-relaxed">
              Following a review by the community administrators, your account access to the <span className="font-bold text-gray-900">Akpu Community Portal</span> has been restricted.
            </p>
            <p className="text-gray-400 text-[11px] leading-relaxed italic">
              "This action is usually taken due to violations of community guidelines, unpaid dues, or unauthorized activity."
            </p>
          </div>

          {/* Action Triage */}
          <div className="flex flex-col gap-3">
            <Link 
              href="/contact" 
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-[0.98]"
            >
              Appeal Suspension
            </Link>
            
            <Link 
              href="/" 
              className="w-full bg-gray-50 text-gray-400 py-3 rounded-2xl font-bold text-xs hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              Return to Homepage
            </Link>
          </div>

          {/* Community Footnote */}
          <div className="mt-10 pt-6 border-t border-gray-50">
            <p className="text-[10px] text-gray-300 font-medium uppercase tracking-widest">
              Akpu Community Governance Board
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}