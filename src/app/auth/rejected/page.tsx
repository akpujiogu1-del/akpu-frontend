"use client";
import Link from "next/link";

export default function RejectedPage() {
  return (
    <div className="min-h-screen bg-[#FFFBFB] flex items-center justify-center px-4">
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-red-900/5 p-10 w-full max-w-md text-center border border-red-50 relative overflow-hidden">
        
        {/* Top Danger Accent */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 to-orange-400 opacity-30"></div>

        <div className="relative">
          {/* Status Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <span className="text-3xl">🛑</span>
          </div>

          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Application Declined</h1>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-8">
            The community administrators were unable to verify your membership based on the details provided. 
          </p>

          {/* Common Reasons Box */}
          <div className="bg-red-50/50 rounded-3xl p-6 mb-8 text-left border border-red-100/50">
            <h3 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3 ml-1">Possible Reasons</h3>
            <ul className="space-y-2">
              {[
                "Information doesn't match community records",
                "Invalid phone number or contact details",
                "Unverifiable village or lineage status"
              ].map((reason, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-gray-700 font-medium">
                  <span className="text-red-400">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              href="/contact" 
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-[0.98]"
            >
              Talk to an Admin
            </Link>
            
            <Link 
              href="/" 
              className="w-full bg-white text-gray-500 py-3 rounded-2xl font-bold text-xs hover:text-gray-900 transition-colors"
            >
              Return to Home
            </Link>
          </div>

          <p className="mt-8 text-[10px] text-gray-400 font-medium leading-relaxed">
            If you believe this was a mistake, please reach out to the Akpu Community Secretariat with your physical ID or community documents.
          </p>
        </div>
      </div>
    </div>
  );
}