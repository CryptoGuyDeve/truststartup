// components/RevenueChart.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Point = { date: number; revenue: number };

export default function RevenueChart({ startupId }: { startupId: string }) {
  const [range, setRange] = useState<"7d" | "30d" | "90d">("30d");
  const [data, setData] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);

  // 1) obtain stripe key from startup doc
  const stripeKeyData = useQuery(api.startups.getStartupStripeKey, {
    id: startupId as any,
  });

  // 2) actions
  const getRevenueHistory = useAction(api.startups.getRevenueHistoryAction);
  const getStripeSummary = useAction(api.startups.getStripeSummaryMetrics);

  // summary metrics (flat lines)
  const [mrr, setMrr] = useState<number | null>(null);
  const [last30, setLast30] = useState<number | null>(null);

  // fetch both history and summary; keep polling for "realtime" feel
  useEffect(() => {
    let mounted = true;
    let pollTimer: number | null = null;

    async function loadAll() {
      if (!stripeKeyData?.stripeKey) {
        if (mounted) {
          setData([]);
          setMrr(null);
          setLast30(null);
        }
        return;
      }

      setLoading(true);
      try {
        // parallel: history + summary
        const [history, summary] = await Promise.all([
          getRevenueHistory({ stripeKey: stripeKeyData.stripeKey, range }),
          getStripeSummary({ stripeKey: stripeKeyData.stripeKey }),
        ]);

        if (!mounted) return;

        // history may return date as ms or ISO string or date string, handle both
        const fixed: Point[] =
          (history || []).map((p: any) => {
            let timestamp: number;
            // server code returns ms timestamps in many of your actions; handle both
            if (typeof p.date === "number") timestamp = p.date;
            else if (typeof p.date === "string" && /^\d+$/.test(p.date)) {
              timestamp = parseInt(p.date, 10);
            } else {
              const d = new Date(p.date);
              timestamp = isNaN(d.getTime()) ? Date.now() : d.getTime();
            }
            return { date: timestamp, revenue: Number(p.revenue ?? 0) };
          })
          .filter((pt) => !isNaN(pt.date))
          .sort((a, b) => a.date - b.date);

        // ensure continuous points for the range: if server already returns continuous daily points it's okay
        // otherwise keep server data as-is (server action should already fill days)
        setData(fixed);

        // set flat-line values from summary (if present)
        if (summary) {
          setMrr(Number(summary.mrr ?? 0));
          setLast30(Number(summary.last30 ?? 0));
        } else {
          setMrr(null);
          setLast30(null);
        }
      } catch (err) {
        console.error("RevenueChart load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAll();

    // poll every 10 seconds while component is mounted for near-realtime updates
    pollTimer = window.setInterval(loadAll, 10_000);

    return () => {
      mounted = false;
      if (pollTimer !== null) window.clearInterval(pollTimer);
    };
  }, [stripeKeyData?.stripeKey, range, getRevenueHistory, getStripeSummary]);

  // Build series data: revenue per day plus constant mrr & last30 fields across points
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // If last30 or mrr are null, fallback to startup db values won't be available here;
    // caller (startup page) already shows fallback cards - chart will show zeros if summary missing.
    return data.map((pt) => ({
      ...pt,
      mrr: mrr ?? 0,
      last30: last30 ?? 0,
    }));
  }, [data, mrr, last30]);

  // Y-axis formatting helper
  const formatYAxisTick = (v: number) => {
    // show large numbers shortened
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
    return `$${v}`;
  };

  return (
    <Card className="pt-0 border border-gray-200 shadow-sm bg-white">
      <CardHeader className="flex items-center gap-2 border-b py-5">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl font-bold">Revenue</CardTitle>
          <CardDescription className="text-sm">
            Live Stripe revenue — daily + summary lines
          </CardDescription>
        </div>

        <Select
          value={range}
          onValueChange={(v) => setRange(v as "7d" | "30d" | "90d")}
        >
          <SelectTrigger className="w-[160px] rounded-lg">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-3 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={{
            revenue: { label: "Revenue", color: "var(--chart-1)" },
            last30: { label: "Last 30d", color: "var(--chart-2)" },
            mrr: { label: "MRR", color: "var(--chart-3)" },
          }}
          className="h-[320px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 12, bottom: 8 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.7} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                </linearGradient>

                <linearGradient id="fillLast30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.04} />
                </linearGradient>

                <linearGradient id="fillMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-3)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--chart-3)" stopOpacity={0.04} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.25} />

              <YAxis
                tickFormatter={formatYAxisTick}
                tick={{ fontSize: 12 }}
                domain={[0, "auto"]}
                width={90}
                axisLine={false}
                tickLine={false}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={20}
                tickFormatter={(value: number) =>
                  new Date(value).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }
              />

              <ChartTooltip
                content={
                  <ChartTooltipContent
                    indicator="dot"
                    // Custom formatter so we can show the date + nicely formatted value.
                    formatter={(value: any, name: any, item: any) => {
                      const rawDate = item?.payload?.date;
                      const d = typeof rawDate === "number" ? new Date(rawDate) : new Date(rawDate ?? 0);
                      const isValid = !isNaN(d.getTime());
                      const dateLabel = isValid
                        ? d.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "";

                      const valueLabel = `$${Number(value ?? 0).toLocaleString()}`;

                      return (
                        <div className="flex flex-col gap-1 min-w-[8rem]">
                          {dateLabel && (
                            <div className="text-xs font-medium text-foreground">
                              {dateLabel}
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{name}</span>
                            <span className="font-mono font-semibold text-foreground">
                              {valueLabel}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                  />
                }
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 8 }}
              />

              {/* Revenue (area) */}
              <Area
                dataKey="revenue"
                name="Daily revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                stroke="var(--chart-1)"
                strokeWidth={2.2}
                dot={false}
                isAnimationActive={false}
              />

              {/* Last 30 days (flat line) */}
              <Area
                dataKey="last30"
                name="Last 30 days"
                type="monotone"
                fill="url(#fillLast30)"
                stroke="var(--chart-2)"
                strokeDasharray="4 4"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              {/* MRR (flat line) */}
              <Area
                dataKey="mrr"
                name="MRR (estimated)"
                type="monotone"
                fill="url(#fillMRR)"
                stroke="var(--chart-3)"
                strokeDasharray="2 6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* small footer / hint */}
        <div className="mt-3 text-xs text-gray-500">
          {loading ? "Loading live Stripe data…" : "Showing live Stripe daily revenue plus summary lines (MRR & last 30d)."}
        </div>
      </CardContent>
    </Card>
  );
}
