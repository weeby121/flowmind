// apps/web/app/profile/page.tsx
"use client";

import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#0B0C10] text-slate-200 font-sans p-8">
      {/* Top Navigation */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/Dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold transition-all">
          <ArrowLeft size={16} /> Back to Canvas
        </Link>
      </div>

      {/* Clerk Profile Component centered on screen */}
      <div className="flex justify-center items-center">
        <UserProfile 
          routing="hash"
          appearance={{
            elements: {
              card: "bg-[#1A1C23] border border-white/10 shadow-2xl",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              profileSectionTitleText: "text-white",
              profileSectionPrimaryButton: "text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10",
              formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
            }
          }}
        />
      </div>
    </div>
  );
}