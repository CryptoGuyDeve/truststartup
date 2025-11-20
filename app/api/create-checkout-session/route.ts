import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(req: Request) {
  const body = await req.json();
  const { startupId, userToken } = body;

  if (!startupId) {
    return new Response("Missing startupId", { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "Startup Advertisement Slot",
          },
          unit_amount: 5000, // $50 (booking fee)
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_URL}/advertise/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/advertise/cancel`,

    metadata: {
      startupId,
      userToken,
    },
  });

  return Response.json({ url: session.url });
}
