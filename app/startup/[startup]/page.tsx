"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

import RevenueChart from "@/components/RevenueChart";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Share2,
  ExternalLink,
  Twitter,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
} from "lucide-react";

/* ------------- CONFIG ------------- */
// Change this to your actual public domain where embed route will live:
const EMBED_BASE_URL = "https://truststartup.com";

/* Slugify helper */
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ------------ Embed Dialog Component ------------ */
function EmbedDialog({
  open,
  onOpenChange,
  slug,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  slug: string;
  name: string;
}) {
  const [format, setFormat] = useState<"svg" | "png">("svg");
  const [width, setWidth] = useState<number>(220);
  const [height, setHeight] = useState<number>(90);
  const [copied, setCopied] = useState<null | "code" | "url">(null);

  // embed URL & code
  const badgeUrl = `${EMBED_BASE_URL}/api/embed/${slug}?format=${format}`;
  const embedCode = `<a href="${EMBED_BASE_URL}/startup/${slug}" target="_blank" rel="noopener noreferrer"><img src="${badgeUrl}" alt="TrustStartup verified revenue badge for ${name}" width="${width}" height="${height}" /></a>`;

  useEffect(() => {
    if (!open) {
      setCopied(null);
      setFormat("svg");
      setWidth(220);
      setHeight(90);
    }
  }, [open]);

  const copyToClipboard = async (type: "code" | "url") => {
    try {
      const text = type === "code" ? embedCode : badgeUrl;
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 1800);
    } catch (e) {
      // fallback
      alert("Could not copy to clipboard — please select and copy manually.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-white rounded-2xl border shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Embed your verified revenue badge
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Add this badge to any website — it updates automatically when
            revenue changes. Clicking the badge links back to the startup page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[1fr_320px] mt-4">
          {/* Left: Controls & embed code */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Format</label>
              <div className="ml-2 flex gap-2">
                <button
                  onClick={() => setFormat("svg")}
                  className={`px-3 py-1 rounded-lg border ${
                    format === "svg"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  SVG
                </button>
                <button
                  onClick={() => setFormat("png")}
                  className={`px-3 py-1 rounded-lg border ${
                    format === "png"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-700"
                  }`}
                >
                  PNG
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">Width</label>
              <label className="text-xs text-muted-foreground">Height</label>
              <Input
                value={width}
                onChange={(e) => setWidth(Number(e.target.value || 0))}
                type="number"
                className="col-span-1"
                min={50}
              />
              <Input
                value={height}
                onChange={(e) => setHeight(Number(e.target.value || 0))}
                type="number"
                className="col-span-1"
                min={20}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Preview</label>
              <div className="mt-2 border rounded-md p-3 bg-gray-50 flex items-center gap-4">
                {/* Use <img> for both svg/png preview */}
                <img
                  src={`${badgeUrl}&w=${width}&h=${height}`}
                  alt={`Badge preview for ${name}`}
                  width={width}
                  height={height}
                  className="rounded"
                  onError={(e) => {
                    // fallback: show a simple box if the badge isn't available
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="text-sm text-gray-600">
                  <div className="font-medium">{name}</div>
                  <div className="text-xs mt-1">
                    Format: {format.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Badge updates automatically when your revenue changes.
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Embed code</label>
              <textarea
                readOnly
                value={embedCode}
                className="w-full mt-2 p-3 rounded-md border resize-none h-28 text-xs font-mono"
              />
              <div className="mt-2 flex gap-2">
                <Button onClick={() => copyToClipboard("code")} size="sm">
                  <Copy className="w-4 h-4 mr-2" />{" "}
                  {copied === "code" ? "Copied embed code" : "Copy embed code"}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => copyToClipboard("url")}
                  size="sm"
                >
                  <Eye className="w-4 h-4 mr-2" />{" "}
                  {copied === "url" ? "Copied badge URL" : "Copy badge URL"}
                </Button>
              </div>
            </div>

            <div className="text-xs text-gray-500">
              <strong>Note:</strong> Use the snippet above to show a verified
              badge linking to{" "}
              <em>
                {EMBED_BASE_URL}/startup/{slug}
              </em>
              .
            </div>
          </div>

          {/* Right: Live small preview + quick usage */}
          <div className="border-l pl-4">
            <div className="mb-3">
              <div className="text-sm font-medium">Quick preview</div>
              <div className="mt-3 border rounded p-3 bg-white flex items-center justify-center">
                <img
                  src={`${badgeUrl}&w=${Math.max(160, Math.round(width * 0.8))}&h=${Math.max(60, Math.round(height * 0.8))}`}
                  alt="badge preview"
                  style={{ display: "block" }}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm font-medium">Direct badge URL</div>
              <Input
                readOnly
                value={badgeUrl}
                className="mt-2 text-xs font-mono"
              />
              <div className="text-xs text-muted-foreground mt-2">
                Use this URL directly or in &lt;img src="..." /&gt; tags.
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------- Main page component (full) ------------- */
export default function StartupPublicPage({
  params,
}: {
  params?: Promise<any>;
  searchParams?: Promise<any>;
}) {
  const routeSlug =
    typeof window !== "undefined"
      ? window.location.pathname.split("/").filter(Boolean).pop() || ""
      : "";

  /* Load all startups */
  const allStartups = useQuery(api.startups.getAllStartups);

  /* Match by slug */
  const startup = useMemo(() => {
    if (!allStartups) return null;
    return allStartups.find((s: any) => slugify(s.name) === routeSlug) ?? null;
  }, [allStartups, routeSlug]);

  /* ---- REALTIME STRIPE METRICS ---- */
  const getLiveStripe = useAction(api.startups.getLiveStripeMetrics);

  const [live, setLive] = useState<{
    revenue: number;
    last30?: number;
    mrr: number;
    createdAt?: string;
  } | null>(null);

  /* Poll Stripe every 5 seconds */
  useEffect(() => {
    if (!startup?.stripeKey) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await getLiveStripe({ stripeKey: startup!.stripeKey });
        if (!cancelled) setLive(res);
      } catch (e) {
        console.error("live stripe fetch error", e);
      }
    }

    load(); // initial call
    const interval = setInterval(load, 5000); // realtime every 5 sec

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [startup?.stripeKey, getLiveStripe]);

  /* Discover more startups */
  const discover = useMemo(() => {
    if (!allStartups) return [];
    return allStartups.filter((s: any) => s._id !== startup?._id);
  }, [allStartups, startup?._id]);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [embedOpen, setEmbedOpen] = useState(false);

  useEffect(() => {
    if (!discover.length) return;
    const t = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % discover.length);
    }, 5000);
    return () => clearInterval(t);
  }, [discover]);

  /* Sharing */
  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: startup?.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copied!");
      }
    } catch {}
  };

  /* Loading state */
  if (!allStartups)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading startup…</p>
      </div>
    );

  /* 404 */
  if (!startup) {
    return (
      <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
        <h1 className="text-3xl font-bold">Startup not found</h1>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const founder = startup?.founder;
  const foundedLabel = live?.createdAt
    ? new Date(live.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : startup.createdAt
      ? new Date(startup.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "—";

  const slug = slugify(startup!.name);

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={startup.avatar} />
              <AvatarFallback>{startup!.name?.[0]}</AvatarFallback>
            </Avatar>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold">{startup.name}</h1>

                {/* Badge: Verified */}
                <Badge variant="outline" className="border-gray-400 text-gray-700">
                  Verified
                </Badge>

                {/* Badge: Category */}
                <Badge variant="outline" className="border-gray-400 text-gray-700">
                  {startup.category || "Uncategorized"}
                </Badge>

                {/* Badge: Rank */}
                <Badge
                  variant="outline"
                  className="border-gray-400 text-gray-700"
                >
                  Rank #
                  {allStartups?.findIndex((s) => s._id === startup._id) + 1}
                </Badge>
              </div>

              {/* Founder username */}
              <p className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                <span>@{founder?.username ?? "unknown"}</span>
                <span className="text-xs">•</span>
                <span>{startup.category}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {startup.twitter && (
              <a
                href={`https://twitter.com/${startup.twitter.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline">
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </Button>
              </a>
            )}

            {startup.website ? (
              <a
                href={
                  startup.website.startsWith("http")
                    ? startup.website
                    : `https://${startup.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Visit Website
                </Button>
              </a>
            ) : (
              <Button disabled variant="ghost">
                No website
              </Button>
            )}

            <Button variant="outline" onClick={onShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Metric Cards (REALTIME) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">GMV</CardTitle>
              <CardDescription>All-time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {Math.round(
                  live?.revenue ?? startup.revenue ?? 0
                ).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Last 30 days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${Math.round(live?.last30 ?? 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">MRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {live?.mrr ? `$${Math.round(live.mrr).toLocaleString()}` : "-"}
              </div>
            </CardContent>
          </Card>

          <Card className="p-4">
            <CardHeader>
              <CardTitle className="text-sm">Founded</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">{foundedLabel}</div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart + Embed button */}
        <div className="space-y-3">
          <RevenueChart startupId={startup._id} />

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setEmbedOpen(true)}>
              Embed
            </Button>
          </div>
        </div>

        {/* Bio */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-600">{startup.bio || "No public bio."}</p>
        </div>

        {/* Carousel */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Discover more startups</h3>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCarouselIndex((i) => Math.max(i - 1, 0))}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setCarouselIndex((i) => (i + 1) % discover.length)
                }
              >
                <ChevronRight />
              </Button>
            </div>
          </div>

          {discover.length > 0 && (
            <Card className="p-4">
              <CardContent className="flex gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={discover[carouselIndex].avatar} />
                  <AvatarFallback>
                    {discover[carouselIndex].name[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h4 className="font-semibold">
                    {discover[carouselIndex].name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {discover[carouselIndex].category}
                  </p>

                  <p className="text-sm mt-2 text-gray-600 line-clamp-2">
                    {discover[carouselIndex].bio}
                  </p>

                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/startup/${slugify(discover[carouselIndex].name)}`}
                    >
                      <Button size="sm">View</Button>
                    </Link>

                    {discover[carouselIndex].website && (
                      <a
                        href={
                          discover[carouselIndex].website.startsWith("http")
                            ? discover[carouselIndex].website
                            : `https://${discover[carouselIndex].website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button size="sm" variant="outline">
                          Visit
                        </Button>
                      </a>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-sm">
                    $
                    {Math.round(
                      discover[carouselIndex].revenue ?? 0
                    ).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>

      {/* Embed dialog */}
      <EmbedDialog
        open={embedOpen}
        onOpenChange={setEmbedOpen}
        slug={slug}
        name={startup!.name}
      />
    </main>
  );
}
