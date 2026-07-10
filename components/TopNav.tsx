"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

function TopNav() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleSignOut() {
    await fetch("/auth/signout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="fixed top-0 z-40 flex w-full items-center justify-end gap-3 px-8 py-4">
      {user && (
        <>
          {/* Avatar */}
          {user.user_metadata?.avatar_url ? (
            <Image
              src={user.user_metadata.avatar_url as string}
              alt={user.user_metadata?.full_name ?? "User avatar"}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-content">
              {(user.user_metadata?.full_name as string)?.[0]?.toUpperCase() ??
                user.email?.[0]?.toUpperCase() ??
                "?"}
            </div>
          )}

          {/* Name */}
          <span className="hidden text-sm font-medium sm:inline">
            {(user.user_metadata?.full_name as string) ?? user.email}
          </span>

          {/* Logout button */}
          <button
            id="topnav-signout"
            onClick={handleSignOut}
            className="btn btn-ghost btn-sm"
          >
            Sign out
          </button>
        </>
      )}
    </div>
  );
}

export default TopNav;
