"use client";

import { useEffect } from "react";
import { animatePageIn } from "@/animations";

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    animatePageIn();
  }, []);

  return (
    <div>
      <div
        id="transition-element"
        className="fixed left-0 top-0 z-[999] h-screen w-screen bg-primary"
      />
      {children}
    </div>
  );
}
