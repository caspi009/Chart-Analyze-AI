"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(() => {
        router.replace("/");
      });
    } else {
      router.replace("/");
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
