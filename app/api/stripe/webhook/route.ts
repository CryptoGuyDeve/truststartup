import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Convex (server-side)
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

// --- 🔥 IMPORTANT: Disable body parsing for Stripe ---
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  let rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing Stripe signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Stripe webhook signature failed:", err.message);
    return new NextResponse(`Signature error: ${err.message}`, { status: 400 });
  }

  // --------------------------------------------------------------------
  // 🎉 When checkout is successfully completed
  // --------------------------------------------------------------------
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const startupId = session.metadata?.startupId;

    if (!startupId) {
      console.error("❌ No startupId provided in metadata");
      return NextResponse.json({ received: true });
    }

    console.log("🎉 Payment successful for startup:", startupId);

    // Fetch all sponsored startups (max 20)
    const sponsored = await convex.query(api.startups.getSponsoredStartups, {
      limit: 20,
    });

    const takenSlots = sponsored
      .map((s: any) => s.sponsorSlot)
      .filter(Boolean)
      .sort((a: number, b: number) => a - b);

    // Determine next available slot
    let nextSlot = 1;
    for (const slot of takenSlots) {
      if (slot === nextSlot) nextSlot++;
      else break;
    }

    if (nextSlot > 20) {
      console.error("❌ All sponsor slots are full — cannot assign");
      return NextResponse.json({ received: true });
    }

    console.log("Assigning sponsor slot:", nextSlot);

    // Assign slot in convex
    await convex.mutation(api.startups.assignSponsorSlot, {
      id: startupId as any,
      slot: nextSlot,
    });

    console.log("✅ Sponsor slot assigned:", nextSlot);
  }

  return NextResponse.json({ success: true });
}
