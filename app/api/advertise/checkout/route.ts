import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/* --------------------------------------------------
   STRIPE INSTANCE
-------------------------------------------------- */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

/* --------------------------------------------------
   MONTHLY PRICE CALCULATOR
   Flat $20 per month sponsorship pricing
-------------------------------------------------- */
function calculateMonthlyPriceCents() {
  const monthly = 20; // USD per month
  return Math.round(monthly * 100); // convert to cents
}

/* --------------------------------------------------
   POST /api/advertise/checkout
   BODY: { startupId: string, months: number }
-------------------------------------------------- */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const startupId = body?.startupId;
    const months = Number(body?.months) || 1;

    if (!startupId) {
      return NextResponse.json(
        { error: "startupId is required" },
        { status: 400 }
      );
    }

    if (months < 1 || months > 12) {
      return NextResponse.json(
        { error: "months must be between 1 and 12" },
        { status: 400 }
      );
    }

    /* --------------------------------------------------
       CALCULATE FINAL AMOUNT
    -------------------------------------------------- */
    const monthlyPrice = calculateMonthlyPriceCents();
    const totalAmount = monthlyPrice * months;

    /* --------------------------------------------------
       CREATE CHECKOUT SESSION
    -------------------------------------------------- */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],

      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: totalAmount,
            product_data: {
              name: `TrustStartup Sponsor Slot — ${months} Month${
                months > 1 ? "s" : ""
              }`,
              description: `Sidebar rotating sponsorship for ${months} month${
                months > 1 ? "s" : ""
              }.`,
            },
          },
        },
      ],

      /* --------------------------------------------------
         WEBHOOK METADATA
      -------------------------------------------------- */
      metadata: {
        startupId,
        months: String(months), // will be used in webhook → Convex
      },

      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/advertise/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/advertise/cancel`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    console.error("❌ Checkout Error:", err);
    return NextResponse.json(
      { error: err.message || "Checkout session creation failed" },
      { status: 500 }
    );
  }
}
