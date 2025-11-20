"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/* ---------------------- PRICE CONFIG ---------------------- */
const BASE_PRICE = 50;
const MONTH_INDEX = new Date().getMonth();
const MONTHLY_PRICE = BASE_PRICE + MONTH_INDEX * 3;

/* ---------------------- Slugify ---------------------- */
function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/* ---------------------- Pastel Color Generator ---------------------- */
function pastelColorFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 92%)`;
}

export default function Sidebar() {
  const userToken =
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  const userStartups =
    useQuery(api.startups.getUserStartups, { token: userToken }) || [];

  const sponsored =
    useQuery(api.startups.getSponsoredStartups, { limit: 100 }) || [];

  /* Rotating batches */
  const [batchIndex, setBatchIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState("");
  const [months, setMonths] = useState(1);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  /* Rotate batches of 5 */
  const BATCH_SIZE = 5;
  const totalBatches = Math.ceil(sponsored.length / BATCH_SIZE);

  useEffect(() => {
    if (!sponsored.length) return;
    const interval = setInterval(() => {
      setBatchIndex((prev) => (prev + 1) % totalBatches);
    }, 8000);
    return () => clearInterval(interval);
  }, [sponsored]);

  const visibleAds = sponsored.slice(
    batchIndex * BATCH_SIZE,
    batchIndex * BATCH_SIZE + BATCH_SIZE
  );

  async function startCheckout() {
    if (!selectedStartup) return alert("Select a startup.");

    try {
      setLoadingCheckout(true);

      const res = await fetch("/api/advertise/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startupId: selectedStartup, months }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Checkout error.");
    } finally {
      setLoadingCheckout(false);
    }
  }

  return (
    <>
      {/* ---------------- LEFT SIDEBAR ---------------- */}
      <aside
        className="hidden lg:flex fixed left-4 top-24 h-screen w-64 p-3 rounded-xl flex-col gap-4"
        style={{ backgroundColor: "#FAFBFC" }}
      >
        {visibleAds.map((ad) => (
          <Card
            key={ad._id}
            className="p-4 rounded-2xl shadow-sm border hover:shadow-md transition"
            style={{ backgroundColor: pastelColorFromString(ad.name) }}
          >
            <Link href={`/startup/${slugify(ad.name)}`}>
              <div className="flex flex-col items-center text-center">
                <img
                  src={ad.avatar || "/default-avatar.png"}
                  className="w-12 h-12 rounded-xl border shadow-sm mb-2"
                />
                <p className="font-semibold text-gray-900 text-sm">{ad.name}</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  {ad.bio?.slice(0, 50) || ad.category || "Growing startup"}
                </p>
              </div>
            </Link>
          </Card>
        ))}

        <button
          onClick={() => setOpen(true)}
          className="text-xs underline text-gray-600 hover:text-black transition"
        >
          Advertise →
        </button>
      </aside>

      {/* ---------------- RIGHT SIDEBAR ---------------- */}
      <aside
        className="hidden lg:flex fixed right-4 top-24 h-screen w-64 p-3 rounded-xl flex-col gap-4"
        style={{ backgroundColor: "#FAFBFC" }}
      >
        {visibleAds.map((ad) => (
          <Card
            key={ad._id}
            className="p-4 rounded-2xl shadow-sm border hover:shadow-md transition"
            style={{ backgroundColor: pastelColorFromString(ad.name + "x") }}
          >
            <Link href={`/startup/${slugify(ad.name)}`}>
              <div className="flex flex-col items-center text-center">
                <img
                  src={ad.avatar || "/default-avatar.png"}
                  className="w-12 h-12 rounded-xl border shadow-sm mb-2"
                />
                <p className="font-semibold text-gray-900 text-sm">{ad.name}</p>
                <p className="text-[11px] text-gray-600 mt-1">
                  {ad.bio?.slice(0, 50) || ad.category || "Growing startup"}
                </p>
              </div>
            </Link>
          </Card>
        ))}

        <button
          onClick={() => setOpen(true)}
          className="text-xs underline text-gray-600 hover:text-black transition"
        >
          Advertise →
        </button>
      </aside>

      {/* ---------------- ADVERTISE DIALOG ---------------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl">
              Advertise on TrustStartup
            </DialogTitle>
            <DialogDescription>
              Choose your startup & promote it globally.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Choose Startup */}
            <section>
              <h3 className="font-semibold mb-1">Select Startup</h3>
              <select
                value={selectedStartup}
                onChange={(e) => setSelectedStartup(e.target.value)}
                className="w-full p-3 border rounded-lg bg-white shadow-sm"
              >
                <option>Select...</option>
                {userStartups.map((s) => (
                  <option key={s._id} value={s._id} disabled={s.isSponsored}>
                    {s.name}
                  </option>
                ))}
              </select>
            </section>

            {/* Duration */}
            <section>
              <h3 className="font-semibold mb-1">Sponsorship Duration</h3>
              <div className="flex gap-4 items-center">
                <select
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                  className="p-3 border rounded-lg bg-white shadow-sm"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m}>{m} months</option>
                  ))}
                </select>

                <p className="font-semibold">
                  Total: ${MONTHLY_PRICE * months}
                </p>
              </div>
            </section>

            {/* Checkout Button */}
            <Button
              disabled={!selectedStartup || loadingCheckout}
              onClick={startCheckout}
              className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800"
            >
              {loadingCheckout ? "Loading..." : "Proceed to Payment →"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
