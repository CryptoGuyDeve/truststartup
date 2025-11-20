"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  ChevronDown,
  Loader2,
  CheckCircle2,
  Award,
  ChevronUp,
  ChevronDown as ChevronDownSmall,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRouter } from "next/navigation";

/* -------------------------
    SLUGIFY — SAME AS PAGE
-------------------------- */
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function Leaderboard() {
  const [metric, setMetric] = useState<"Revenue" | "MRR">("Revenue");

  const { toast } = useToast();
  const startups = useQuery(api.startups.getAllStartups);
  const fetchLive = useAction(api.startups.getLiveStripeMetrics);

  const prevOrderRef = useRef<string[]>([]);
  const [movedMap, setMovedMap] = useState<Record<string, boolean>>({});
  const [trendMap, setTrendMap] = useState<Record<string, -1 | 0 | 1>>({});
  const [liveData, setLiveData] = useState<Record<string, any>>({});
  const prevValuesRef = useRef<Record<string, number>>({});

  const loading = startups === undefined;
  const HIGHLIGHT_TTL = 2000;

  /* FETCH LIVE STRIPE REVENUE */
  useEffect(() => {
    async function load() {
      if (!startups) return;

      const updated: Record<string, any> = {};
      await Promise.all(
        startups.map(async (s) => {
          const res = await fetchLive({ stripeKey: s.stripeKey });
          updated[s._id] = res;
        })
      );

      setLiveData(updated);
    }
    load();
  }, [startups]);

  /* SORT BY LIVE REVENUE */
  const sorted = useMemo(() => {
    if (!startups) return [];

    return [...startups].sort((a, b) => {
      const A = liveData[a._id]?.revenue ?? 0;
      const B = liveData[b._id]?.revenue ?? 0;
      return B - A;
    });
  }, [startups, liveData]);

  /* DETECT RANK MOVES + TRENDS */
  useEffect(() => {
    if (!startups) return;

    const current = sorted.map((s) => s._id);
    const prev = prevOrderRef.current;

    // highlight movement
    if (prev.length) {
      const moved: Record<string, boolean> = {};
      current.forEach((id, i) => {
        if (prev.indexOf(id) !== i) moved[id] = true;
      });
      setMovedMap(moved);
      setTimeout(() => setMovedMap({}), HIGHLIGHT_TTL);
    }

    // trend arrow (up/down/no change)
    const newTrends: Record<string, -1 | 0 | 1> = {};
    const now: Record<string, number> = {};

    sorted.forEach((s) => {
      const id = s._id;
      const val = liveData[id]?.revenue ?? 0;
      now[id] = val;

      const prevVal = prevValuesRef.current[id];
      if (prevVal === undefined) newTrends[id] = 0;
      else if (val > prevVal) newTrends[id] = 1;
      else if (val < prevVal) newTrends[id] = -1;
      else newTrends[id] = 0;
    });

    prevValuesRef.current = now;
    setTrendMap(newTrends);

    prevOrderRef.current = current;
  }, [sorted]);

  return (
    <div className="w-full max-w-6xl mx-auto mt-8 p-8 bg-white border rounded-xl shadow-sm">
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          Leaderboard
        </h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex gap-2">
              {metric} <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setMetric("Revenue")}>
              Revenue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMetric("MRR")}>
              MRR
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* loading */}
      {loading && (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin w-6 h-6" />
        </div>
      )}

      {/* empty */}
      {!loading && sorted.length === 0 && (
        <div className="text-center text-gray-400 py-20">No startups yet.</div>
      )}

      {/* data */}
      {!loading && sorted.length > 0 && (
        <>
          <div className="grid grid-cols-[50px_2fr_2fr_1fr] font-semibold border-b pb-3 text-sm">
            <div>#</div>
            <div>Startup</div>
            <div>Founder</div>
            <div className="text-right">Revenue</div>
          </div>

          <div className="divide-y">
            {sorted.map((s, i) => (
              <Row
                key={s._id}
                rank={i + 1}
                startup={s}
                moved={movedMap[s._id]}
                trend={trendMap[s._id]}
                live={liveData[s._id]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------
   CLICKABLE ROW COMPONENT
-------------------------- */
function Row({ rank, startup, moved, trend, live }: any) {
  const router = useRouter();
  const slug = slugify(startup.name);

  const revenue = live?.revenue ?? 0;

  const motionVal = useMotionValue(revenue);
  const spring = useSpring(motionVal, { stiffness: 160, damping: 20 });
  const [display, setDisplay] = useState(revenue);

  useEffect(() => {
    motionVal.set(revenue);
  }, [revenue]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(v));
    return () => unsub();
  }, []);

  const Arrow = () => {
    if (trend === 1)
      return <ChevronUp className="w-4 h-4 text-green-600 ml-2 inline" />;
    if (trend === -1)
      return <ChevronDownSmall className="w-4 h-4 text-red-600 ml-2 inline" />;
    return <span className="text-gray-400 ml-2">—</span>;
  };

  return (
    <motion.div
      layout
      onClick={() => router.push(`/startup/${slug}`)}
      className={`grid grid-cols-[50px_2fr_2fr_1fr] items-center py-4 px-2 cursor-pointer hover:bg-gray-50 transition rounded-md ${
        moved ? "bg-yellow-50 ring-1 ring-yellow-300" : ""
      }`}
    >
      <div className="font-bold">#{rank}</div>

      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarImage src={startup.avatar} />
          <AvatarFallback>{startup.name?.[0]}</AvatarFallback>
        </Avatar>

        <div>
          <div className="font-semibold">{startup.name}</div>
          <div className="text-xs text-gray-500">{startup.category}</div>
        </div>
      </div>

      <div>
        {startup.founder ? (
          <>
            <div className="font-medium flex items-center gap-1">
              {startup.founder.firstName} {startup.founder.lastName}
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </div>
            <div
              className="text-xs text-blue-600 hover:underline cursor-pointer"
              onClick={(e) => {
                e.stopPropagation(); // <-- prevents row click redirect
                router.push(`/founder/${startup.founder.username}`);
              }}
            >
              @{startup.founder.username}
            </div>
          </>
        ) : (
          <div className="italic text-gray-400">Anonymous</div>
        )}
      </div>

      <div className="text-right font-bold">
        ${Math.round(display).toLocaleString()}
        <Arrow />
      </div>
    </motion.div>
  );
}
