"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-gray-500 hover:bg-red-950/30 hover:text-red-400 text-sm transition-colors font-medium"
    >
      <span>🚪</span> Sair
    </button>
  );
}
