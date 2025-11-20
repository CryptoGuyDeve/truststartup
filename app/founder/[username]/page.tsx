"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "convex/react"; // useAction removed
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

/* ---------------- Helpers ---------------- */
function slugify(name: string) {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9\s-]/g, "")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-");
}

/* -------- Startup Card (REMOVED REVENUE INFO) -------- */
function StartupCard({ s }: any) {
	const slug = slugify(s.name);
	return (
		<Link href={`/startup/${slug}`}>
			<Card className="p-4 rounded-2xl border hover:shadow-md transition bg-white">
				<div className="flex items-center gap-4">
					<Avatar className="h-14 w-14">
						<AvatarImage src={s.avatar} />
						<AvatarFallback>{s.name[0]}</AvatarFallback>
					</Avatar>

					<div className="flex-1">
						<div className="flex justify-between items-start">
							<div>
								<div className="font-semibold text-lg">{s.name}</div>
								<div className="text-sm text-gray-500">{s.bio}</div>
							</div>
						</div>

						<div className="mt-3 text-xs text-gray-500 flex gap-3">
							{s.category && <span>{s.category}</span>}
							{s.website && (
								<a 
									className="underline truncate max-w-[140px]"
									href={s.website}
									target="_blank"
									onClick={(e) => e.stopPropagation()}
								>
									{new URL(s.website).hostname.replace("www.", "")}
								</a>
							)}
						</div>
					</div>
				</div>
			</Card>
		</Link>
	);
}

/* ---------------- PAGE ---------------- */
export default function PublicFounderPage(props: { params: Promise<{ username: string }> }) {
	const { username } = use(props.params);

	const founder = useQuery(api.auth.getUserByUsername, { username });
	const startups = useQuery(
		api.startups.getStartupsByUserId,
		founder ? { userId: founder._id } : "skip"
	);

	if (!founder) return <div className="p-10">Loading…</div>;

	return (
		<div className="max-w-6xl mx-auto px-6 py-10">
			
			{/* HEADER */}
			<div className="flex md:flex-row flex-col justify-between gap-6 mb-10">
				<div className="flex gap-4 items-start">
					<Avatar className="h-24 w-24">
						<AvatarImage src={founder.avatar} />
						<AvatarFallback>{founder.firstName?.[0] ?? "U"}</AvatarFallback>
					</Avatar>

					<div>
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold">@{founder.username}</h1>

							<span className="flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
								<CheckCircle className="w-4 h-4" /> Verified
							</span>
						</div>

						<p className="text-gray-500">
							{startups?.length ?? 0} affiliated startups
						</p>

						{founder.bio && (
							<p className="text-gray-700 mt-3 max-w-xl">{founder.bio}</p>
						)}
					</div>
				</div>
			</div>

			{/* LIST OF STARTUPS */}
			<h2 className="text-xl font-semibold mb-4 pt-4 border-t border-gray-200">
				Startups by @{founder.username}
			</h2>

			<div className="grid gap-4">
				{startups?.map((s) => (
					// The 'live' prop is no longer passed as it's not used
					<StartupCard key={s._id} s={s} />
				))}
			</div>
		</div>
	);
}