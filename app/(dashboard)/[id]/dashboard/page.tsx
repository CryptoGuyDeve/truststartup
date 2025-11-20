"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Loader2, Pencil, Save } from "lucide-react";

import RevenueChart from "@/components/RevenueChart";

export default function DashboardPage() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [openEditStartup, setOpenEditStartup] = useState(false);
  const [activeStartup, setActiveStartup] = useState<any>(null);
  
  const cancelSponsor = useMutation(api.startups.cancelSponsor);
  const extendSponsorDuration = useMutation(
    api.startups.extendSponsorDuration
  );
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
  });

  const [startupForm, setStartupForm] = useState({
    name: "",
    bio: "",
    avatar: "",
  });

  //
  // LOAD USER TOKEN
  //
  useEffect(() => {
    setUserToken(localStorage.getItem("token"));
  }, []);

  const user = useQuery(
    api.auth.getUserFromToken,
    userToken ? { token: userToken } : "skip"
  );

  const userStartups = useQuery(
    api.startups.getUserStartups,
    userToken ? { token: userToken } : "skip"
  );

  const updateProfile = useMutation(api.auth.updateProfile);
  const updateStartup = useMutation(api.startups.updateStartup);

  //
  // STRIPE METRICS
  //
  const getStripeKey = useQuery(
    api.startups.getStartupStripeKey,
    userStartups && userStartups[0] ? { id: userStartups[0]._id } : "skip"
  );

  const getStripeMetrics = useAction(api.startups.getStripeSummaryMetrics);
  // This action returns:
  // { gmvAllTime, last30, mrr, createdAt }

  const [metrics, setMetrics] = useState({
    gmvAllTime: 0,
    last30: 0,
    mrr: 0,
    createdAt: "",
  });

  useEffect(() => {
    if (!getStripeKey?.stripeKey) return;

    getStripeMetrics({ stripeKey: getStripeKey.stripeKey }).then((res) => {
      if (res) setMetrics(res);
    });
  }, [getStripeKey?.stripeKey]);

  //
  // LOADING STATE
  //
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="animate-spin h-6 w-6 mr-2" /> Loading dashboard...
      </div>
    );
  }

  //
  // PROFILE MODAL SUBMIT
  //
  const submitProfile = async () => {
    try {
      await updateProfile({ token: userToken!, ...profileForm });
      toast.success("Profile updated!");
      setOpenEdit(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  //
  // STARTUP MODAL SUBMIT
  //
  const submitStartup = async () => {
    try {
      await updateStartup({
        id: activeStartup._id,
        ...startupForm,
      });
      toast.success("Startup updated!");
      setOpenEditStartup(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center px-4 py-10">
      {/* HEADER LOGO */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
          TrustStartup
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your profile & startup dashboard
        </p>
      </div>

      {/* PROFILE CARD */}
      <Card className="w-full max-w-xl p-4 mb-10 border border-gray-200 shadow-sm bg-white">
        <CardContent className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback>{user.firstName[0]}</AvatarFallback>
            </Avatar>

            <div>
              <h2 className="text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500">@{user.username}</p>
            </div>
          </div>

          <Button
            onClick={() => {
              setProfileForm({
                firstName: user.firstName,
                lastName: user.lastName,
                username: user.username,
              });
              setOpenEdit(true);
            }}
            className="flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        </CardContent>
      </Card>

      {/* METRIC CARDS */}
      {getStripeKey?.stripeKey && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl mb-10">
          {/* GMV All-time */}
          <Card className="p-4 bg-white border shadow-sm">
            <CardTitle className="text-sm text-gray-500">GMV</CardTitle>
            <h2 className="text-2xl font-bold">
              ${metrics.gmvAllTime.toLocaleString()}
            </h2>
            <p className="text-gray-400 text-xs">All-time revenue</p>
          </Card>

          {/* Last 30 days */}
          <Card className="p-4 bg-white border shadow-sm">
            <CardTitle className="text-sm text-gray-500">
              Last 30 Days
            </CardTitle>
            <h2 className="text-2xl font-bold">
              ${metrics.last30.toLocaleString()}
            </h2>
            <p className="text-gray-400 text-xs">Recent revenue</p>
          </Card>

          {/* MRR */}
          <Card className="p-4 bg-white border shadow-sm">
            <CardTitle className="text-sm text-gray-500">
              MRR (estimated)
            </CardTitle>
            <h2 className="text-2xl font-bold">
              {metrics.mrr > 0 ? `$${metrics.mrr.toLocaleString()}` : "-"}
            </h2>
            <p className="text-gray-400 text-xs">
              {metrics.mrr > 0
                ? "Active subscriptions"
                : "No active subscriptions"}
            </p>
          </Card>

          {/* Founded */}
          <Card className="p-4 bg-white border shadow-sm">
            <CardTitle className="text-sm text-gray-500">Founded</CardTitle>
            <h2 className="text-lg font-semibold">
              {metrics.createdAt
                ? new Date(metrics.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </h2>
            <p className="text-gray-400 text-xs">Account creation</p>
          </Card>
        </div>
      )}

      {/* CHART */}
      {userStartups && userStartups.length > 0 && (
        <div className="w-full max-w-4xl mb-12">
          <RevenueChart startupId={userStartups[0]._id} />
        </div>
      )}

      {/* YOUR STARTUPS TITLE */}
      <h2 className="text-2xl font-bold mb-4 text-center">Your Startups</h2>

      {/* STARTUP CARDS (WITH SPONSOR STATUS) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full justify-items-center">
        {userStartups?.map((s: any) => {
          // REQUIRED MUTATION HOOKS

          return (
            <Card
              key={s._id}
              className="w-full max-w-md p-5 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all rounded-xl"
            >
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={s.avatar} />
                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                  </Avatar>

                  <div>
                    <h3 className="text-lg font-semibold">{s.name}</h3>
                    <p className="text-gray-500 text-sm">
                      Revenue: ${s.revenue || 0}
                    </p>
                  </div>
                </div>

                {/* Sponsored Badge */}
                {s.isSponsored ? (
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-full">
                    ⭐ Sponsored – Slot #{s.sponsorSlot}
                  </span>
                ) : null}
              </CardHeader>

              <CardContent className="space-y-4">
                {/* ANALYTICS BLOCK */}
                {s.isSponsored && (
                  <div className="border rounded-lg p-3 bg-gray-50 text-sm">
                    <p className="font-semibold mb-2 text-gray-700">
                      Ad Performance
                    </p>

                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>Views:</span>
                      <span className="font-semibold">{s.adViews || 0}</span>
                    </div>

                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>Clicks:</span>
                      <span className="font-semibold">{s.adClicks || 0}</span>
                    </div>

                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>Profit:</span>
                      <span className="font-semibold">
                        ${s.adGeneratedRevenue?.toLocaleString() || 0}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-500 text-xs mt-2">
                      <span>Expires:</span>
                      <span>
                        {s.sponsorExpiresAt
                          ? new Date(s.sponsorExpiresAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              }
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                )}

                {/* EDIT STARTUP BUTTON */}
                <Button
                  size="sm"
                  onClick={() => {
                    setActiveStartup(s);
                    setStartupForm({
                      name: s.name,
                      bio: s.bio,
                      avatar: s.avatar,
                    });
                    setOpenEditStartup(true);
                  }}
                  className="flex items-center gap-1 w-full"
                >
                  <Pencil className="w-4 h-4" /> Edit Startup
                </Button>

                {/* SPONSORSHIP ACTIONS */}
                {s.isSponsored ? (
                  <div className="flex gap-2 mt-2">
                    {/* CANCEL SPONSORSHIP - FIXED */}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={async () => {
                        await cancelSponsor({
                          id: s._id,
                          userToken: userToken!,
                        });
                        toast.success("Sponsorship cancelled");
                      }}
                    >
                      Stop Advertising
                    </Button>

                    {/* EXTEND SPONSORSHIP - FIXED */}
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={async () => {
                        await extendSponsorDuration({
                          id: s._id,
                          userToken: userToken!,
                          months: 1,
                        });
                        toast.success("Sponsorship extended!");
                      }}
                    >
                      +1 Month
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 text-center">
                    Startup not sponsored
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* EDIT PROFILE */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <Input
            value={profileForm.firstName}
            onChange={(e) =>
              setProfileForm({ ...profileForm, firstName: e.target.value })
            }
            className="mb-3"
            placeholder="First Name"
          />

          <Input
            value={profileForm.lastName}
            onChange={(e) =>
              setProfileForm({ ...profileForm, lastName: e.target.value })
            }
            className="mb-3"
            placeholder="Last Name"
          />

          <Input
            value={profileForm.username}
            onChange={(e) =>
              setProfileForm({ ...profileForm, username: e.target.value })
            }
            className="mb-4"
            placeholder="Username"
          />

          <Button className="w-full" onClick={submitProfile}>
            <Save className="w-4 h-4 mr-2" /> Save
          </Button>
        </DialogContent>
      </Dialog>

      {/* EDIT STARTUP */}
      <Dialog open={openEditStartup} onOpenChange={setOpenEditStartup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Startup</DialogTitle>
          </DialogHeader>

          <Input
            value={startupForm.name}
            onChange={(e) =>
              setStartupForm({ ...startupForm, name: e.target.value })
            }
            className="mb-3"
            placeholder="Startup Name"
          />

          <Input
            value={startupForm.avatar}
            onChange={(e) =>
              setStartupForm({ ...startupForm, avatar: e.target.value })
            }
            className="mb-3"
            placeholder="Logo URL"
          />

          <Textarea
            value={startupForm.bio}
            onChange={(e) =>
              setStartupForm({ ...startupForm, bio: e.target.value })
            }
            className="mb-4"
            rows={3}
            placeholder="Startup Bio"
          />

          <Button className="w-full" onClick={submitStartup}>
            <Save className="w-4 h-4 mr-2" /> Save Startup
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
