"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Github, Twitter, Globe, Mail } from "lucide-react";

export default function Footer() {
  // Fetch all startups
  const startups = useQuery(api.startups.getAllStartups);

  // Extract unique categories
  const categories = React.useMemo(() => {
    if (!startups) return [];
    const set = new Set<string>();
    startups.forEach((s: any) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [startups]);

  return (
    <footer className="w-full border-t border-white/10 bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-xl mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-extrabold text-black group-hover:text-gray-700 transition">
              TrustStartup
            </h2>
            <p className="text-sm text-gray-500 mt-3 leading-relaxed">
              The easiest way to verify & showcase real revenue from Stripe.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-800">
              Navigation
            </h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li>
                <a href="/" className="hover:text-black transition">Home</a>
              </li>
              <li>
                <a href="/" className="hover:text-black transition">
                  Leaderboard
                </a>
              </li>
            </ul>
          </div>

          {/* Browse Startups by Category */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-800">
              Browse Startups
            </h3>

            {categories.length === 0 && (
              <p className="text-gray-500 text-sm">No categories yet.</p>
            )}

            <ul className="space-y-2 text-gray-600 text-sm">
              {categories.map((category) => (
                <li key={category}>
                  <a
                    href={`/category/${category.toLowerCase().replace(/\s+/g, "-")}`}
                    className="hover:text-black transition"
                  >
                    {category}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-800">
              Legal
            </h3>
            <ul className="space-y-2 text-gray-600 text-sm">
              <li><a href="/terms" className="hover:text-black transition">Terms of Service</a></li>
              <li><a href="/privacy" className="hover:text-black transition">Privacy Policy</a></li>
              <li><a href="/cookies" className="hover:text-black transition">Cookie Policy</a></li>
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="my-10 border-t border-white/10"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Socials */}
          <div className="flex items-center gap-4">
            <a
              href="https://twitter.com"
              target="_blank"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <Twitter size={18} className="text-gray-800" />
            </a>

            <a
              href="https://github.com"
              target="_blank"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <Github size={18} className="text-gray-800" />
            </a>

            <a
              href="https://yourwebsite.com"
              target="_blank"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <Globe size={18} className="text-gray-800" />
            </a>

            <a
              href="mailto:support@truststartup.com"
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
            >
              <Mail size={18} className="text-gray-800" />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-xs text-gray-500 text-center md:text-right">
            © {new Date().getFullYear()} TrustStartup — All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
