"use client";

import Link from "next/link";
import React from "react";

export default function Header() {
  return (
    <header
      className="w-full"
      style={{ backgroundColor: "#FAFBFC" }} // same as page background
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center group">
          <span className="text-2xl font-extrabold text-black group-hover:text-gray-700 transition">
            TrustStartup
          </span>
        </Link>
      </div>
    </header>
  );
}
