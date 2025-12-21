"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "../lib/progress/store.js";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect based on login status
    if (isLoggedIn()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

  // Show loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B82F6] mb-4"></div>
        <p className="text-gray-600">Chargement...</p>
      </div>
    </div>
  );
}
