"use client";

import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function CategoryPage() {
  const router = useRouter();
  const [category, setCategory] = useState<string>("");
  const fetchLive = useAction(api.startups.getLiveStripeMetrics);
  const [liveData, setLiveData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      const catSegment = segments[segments.indexOf("category") + 1];
      if (catSegment) {
        setCategory(decodeURIComponent(catSegment));
      }
    }
  }, []);

const allStartups = useQuery(api.startups.getAllStartups);

const filtered = useMemo(
  () =>
    (allStartups ?? []).filter(
      (s: any) => (s.category ?? "").toLowerCase() === category.toLowerCase()
    ),
  [allStartups, category]
);

// Poll live Stripe revenue for startups in this category
useEffect(() => {
  if (!filtered.length) return;

  let cancelled = false;

  async function load() {
    const updates: Record<string, any> = {};
    await Promise.all(
      filtered.map(async (s: any) => {
        if (!s.stripeKey) return;
        try {
          const res = await fetchLive({ stripeKey: s.stripeKey });
          updates[s._id] = res;
        } catch (e) {
          console.error("live stripe fetch error", e);
        }
      })
    );
    if (!cancelled) {
      setLiveData((prev) => ({ ...prev, ...updates }));
    }
  }

  load();
  const id = window.setInterval(load, 10_000);

  return () => {
    cancelled = true;
    window.clearInterval(id);
  };
}, [filtered, fetchLive]);

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading category...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: "#FAFBFC" }}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/")}
              className="mb-2 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to home
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">
              {category.charAt(0).toUpperCase() + category.slice(1)} Startups
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {filtered.length} {filtered.length === 1 ? "startup" : "startups"} in this category
            </p>
          </div>
        </div>

        {/* Startup Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400">No startups found in this category.</p>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="mt-4"
            >
              Browse all startups
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((startup: any) => (
              <motion.div
                key={startup._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <Link href={`/startup/${slugify(startup.name)}`}>
                  <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition cursor-pointer">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={startup.avatar} />
                        <AvatarFallback>{startup.name?.[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {startup.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {startup.bio || "No description"}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <span className="font-bold text-primary">
                            ${Math.round(
                              (liveData[startup._id]?.revenue ?? startup.revenue ?? 0) as number
                            ).toLocaleString()}
                          </span>
                          <span className="text-gray-400">revenue (live)</span>
                        </div>

                        {startup.founder && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                            <span>by</span>
                            <span className="font-medium">
                              {startup.founder.firstName} {startup.founder.lastName}
                            </span>
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
