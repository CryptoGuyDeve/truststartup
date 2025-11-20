import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Get all startups from convex
    const startups = await fetchQuery(api.startups.getAllStartups, {});

    // Match correct startup
    const startup = startups.find((s: any) => slugify(s.name) === slug);

    if (!startup) {
      return new NextResponse("Startup not found", { status: 404 });
    }

    const name = startup.name;
    const revenue = Math.round(startup.revenue ?? 0).toLocaleString();

    // SVG Badge (Clean White Badge)
    const svg = `
        <svg width="260" height="90" viewBox="0 0 260 90" xmlns="http://www.w3.org/2000/svg">
        <rect width="260" height="90" rx="12" fill="white" stroke="#E5E7EB" stroke-width="2"/>
        
        <text x="20" y="28" font-family="Arial" font-size="16" font-weight="700" fill="#111827">
            ${name}
        </text>

        <text x="20" y="50" font-family="Arial" font-size="14" fill="#374151">
            Verified Revenue
        </text>

        <text x="20" y="72" font-family="Arial" font-size="22" font-weight="700" fill="#4F46E5">
            $${revenue}
        </text>

        <text x="200" y="82" font-family="Arial" font-size="10" fill="#9CA3AF">
            TrustStartup
        </text>
        </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("Embed error:", err);
    return new NextResponse("Server error", { status: 500 });
  }
}
