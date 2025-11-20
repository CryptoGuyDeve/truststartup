import type { Metadata } from "next";
import { Roboto_Mono } from "next/font/google";
import "./globals.css";

import ConvexClientProvider from "@/components/convex-provider";
import { AppToaster } from "@/hooks/use-toast";

import Footer from "@/components/footer";
import Header from "@/components/Header";
import Sidebar from "@/components/sidebar";

// Font
const robotoMono = Roboto_Mono({
	subsets: ["latin"],
	variable: "--font-roboto-mono",
	weight: ["100", "200", "300", "400", "500", "600", "700"],
	display: "swap",
});

// Metadata
export const metadata: Metadata = {
	title: "TrustStartup — Verified Revenue for Startups",
	description: "Verify, track, and showcase your startup’s real Stripe revenue in real-time.",
	icons: {
		icon: "/favicon.ico",
	},
	openGraph: {
		title: "TrustStartup",
		description: "Real-time verified revenue tracking for modern startups.",
		type: "website",
		url: "https://truststartup.com",
		images: [
			{
				url: "https://truststartup.com/og-image.png",
				width: 1200,
				height: 630,
				alt: "TrustStartup Revenue Dashboard",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "TrustStartup",
		description: "Show your verified revenue to the world.",
		images: ["https://truststartup.com/og-image.png"],
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body
				className={`${robotoMono.variable} font-roboto antialiased bg-[#FAFBFC] text-foreground`}
			>
				<ConvexClientProvider>
					{/* Global Header */}
					<Header />

					{/* --- FIXED LEFT + RIGHT SIDEBARS (always visible) --- */}
					<Sidebar />

					{/* --- MAIN CONTENT WRAPPER (centered because of sidebars) --- */}
					<div className="px-4 mt-6 lg:ml-[260px] lg:mr-[260px]">
						{children}
					</div>

					<AppToaster />

					{/* Footer */}
					<Footer />
				</ConvexClientProvider>
			</body>
		</html>
	);
}