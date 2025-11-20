"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Leaderboard from "@/components/leaderboard";
import SignupDialog from "@/components/signup";
import AddStartupDialog from "@/components/addstartup";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import * as React from "react";
import Footer from "@/components/footer";
import { PointerHighlight } from "@/components/ui/pointer-highlight";

export default function Home() {
  const [openAddStartup, setOpenAddStartup] = React.useState(false);

  /* ------------------------ SEARCH STATE ------------------------ */
  const [query, setQuery] = React.useState("");
  const [showDropdown, setShowDropdown] = React.useState(false);

  // Live realtime results from Convex
  const searchResults = useQuery(
    api.startups.searchStartups,
    query.trim() ? { q: query } : "skip"
  );

  const results = query.trim() ? (searchResults ?? []) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAFBFC" }}>
      {/* Soft Background Glow and Grid */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 blur-3xl rounded-full opacity-50 animate-pulse" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] bg-center" />
      </div>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-start text-center px-4 pt-28 pb-16 relative">
        {/* Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 backdrop-blur-xl bg-white/70 px-6 py-2 rounded-full border border-gray-200 shadow-sm"
        >
          <h2 className="text-sm md:text-base font-medium tracking-tight text-gray-700">
            trust<span className="text-primary font-semibold">startup</span> —
            Transparency for Founders
          </h2>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl leading-tight bg-gradient-to-br from-gray-900 via-gray-700 to-gray-500 bg-clip-text text-transparent"
        >
          Track the growth behind{" "}
          <span className="text-primary">real startups</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-4 text-gray-500 text-base md:text-lg max-w-2xl leading-relaxed"
        >
          Discover transparent startup insights, revenue data, and growth
          analytics — empowering founders, investors, and creators to see what’s
          really working.
        </motion.p>

        {/* Search + Add + Signup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3 }}
          className="relative mt-10 flex flex-col sm:flex-row items-center justify-center w-full max-w-2xl gap-3"
        >
          {/* Search Box */}
          <div className="flex items-center w-full rounded-2xl bg-white border border-gray-200 shadow-sm backdrop-blur-md focus-within:ring-2 focus-within:ring-primary/40 transition-all relative">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search startups, founders, or categories..."
                className="w-full border-none bg-transparent pl-12 pr-4 h-12 text-gray-900 placeholder-gray-400 focus-visible:ring-0 focus-visible:outline-none"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => query && setShowDropdown(true)}
              />
            </div>

            {/* Add Startup */}
            <Button
              size="lg"
              onClick={() => setOpenAddStartup(true)}
              className="h-12 px-6 rounded-none rounded-r-2xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-all"
            >
              Add Startup
            </Button>

            {/* SEARCH DROPDOWN */}
            {showDropdown && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[105%] left-0 w-full bg-white border border-gray-200 shadow-xl rounded-xl py-2 z-50"
              >
                {results.map((r: any) => (
                  <div
                    key={r._id}
                    onClick={() => {
                      setQuery(r.name);
                      setShowDropdown(false);

                      const el = document.getElementById(`startup-${r._id}`);
                      if (el)
                        el.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 transition-all flex items-center gap-3"
                  >
                    <img
                      src={r.avatar || "/placeholder.png"}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-gray-500">{r.category}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Signup Button */}
          <SignupDialog />
        </motion.div>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="mt-16 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent w-full max-w-4xl"
        />
      </section>

      {/* Leaderboard Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="flex justify-center px-4 pb-24"
      >
        <Leaderboard />
      </motion.section>

      <AddStartupDialog
        open={openAddStartup}
        onOpenChange={setOpenAddStartup}
      />
    </div>
  );
}
