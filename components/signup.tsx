"use client";

import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import SigninDialog from "@/components/signin";

export default function SignupDialog() {
    const signup = useMutation(api.auth.signup);

    // Check logged-in user
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const user = useQuery(
        api.auth.getUserFromToken,
        token ? { token } : "skip"
    );

    const [open, setOpen] = React.useState(false);
    const [showSignin, setShowSignin] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [fillDone, setFillDone] = React.useState(false);

    const [form, setForm] = React.useState({
        firstName: "",
        lastName: "",
        username: "",
        email: "",
        password: "",
    });

    /** -------------------------------
     * SIGNUP HANDLER
     * ------------------------------- */
    const handleSignup = async () => {
        try {
            if (!form.firstName || !form.email || !form.password || !form.username) {
                toast.warning("Please fill all required fields.");
                return;
            }
            
            // 🛑 VALIDATION: Check for mandatory underscore in username
            if (!form.username.includes("_")) {
                toast.warning("The username must contain an underscore (_) for separation or uniqueness.");
                return;
            }

            // The username is already sanitized in the onChange handler,
            // but we use the current form value for submission.
            
            setLoading(true);

            const res = await signup({
                ...form,
                username: form.username, // Use the final sanitized username from state
            });

            localStorage.setItem("token", res.token);

            toast.success("Account created successfully 🎉");

            setForm({
                firstName: "",
                lastName: "",
                username: "",
                email: "",
                password: "",
            });

            setOpen(false);

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = `/`;
            }, 600);
        } catch (err: any) {
            toast.error(`Signup failed: ${err.message || "Something went wrong"}`);
        } finally {
            setLoading(false);
        }
    };

    /** -------------------------------
     * HOVER ANIMATION
     * ------------------------------- */
    React.useEffect(() => {
        let interval: NodeJS.Timeout | null = null;

        if (hovered) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 100) {
                        if (interval) clearInterval(interval);
                        setFillDone(true);
                        return 100;
                    }
                    return prev + 3;
                });
            }, 40);
        } else {
            if (interval) clearInterval(interval);
            setProgress(0);
            setFillDone(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [hovered]);

    /** -------------------------------
     * DASHBOARD / LOGOUT BUTTON
     * ------------------------------- */
    const handleButtonClick = () => {
        if (user && fillDone) {
            localStorage.removeItem("token");
            toast.success("👋 Logged out successfully!");
            window.location.reload();
        } else if (user && !fillDone) {
            window.location.href = `/${user._id}/dashboard`; // FIXED ROUTE
        }
    };

    /** -------------------------------
     * IF USER LOGGED IN
     * ------------------------------- */
    if (user && user.email) {
        return (
            <Button
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={handleButtonClick}
                className="relative overflow-hidden rounded-lg font-medium bg-primary text-primary-foreground px-6 h-12 transition-all"
            >
                <motion.div
                    className="absolute inset-0 bg-primary-foreground/20"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1, ease: "linear" }}
                />
                <span className="relative z-10 font-semibold">
                    {fillDone ? "Logout" : "Dashboard"}
                </span>
            </Button>
        );
    }

    /** -------------------------------
     * IF USER NOT LOGGED IN
     * ------------------------------- */
    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button
                        onMouseEnter={() => setHovered(true)}
                        onMouseLeave={() => setHovered(false)}
                        className="relative overflow-hidden rounded-lg font-medium border border-border bg-background text-foreground hover:bg-muted transition-all h-12 px-6"
                    >
                        <motion.div
                            className="absolute inset-0 bg-primary/20"
                            initial={{ width: "0%" }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.1, ease: "linear" }}
                        />
                        <span className="relative z-10">Sign Up</span>
                    </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-md border border-border shadow-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">
                            Create your account
                        </DialogTitle>
                        <DialogDescription className="text-center text-muted-foreground">
                            Join <span className="text-primary font-medium">TrustStartup</span>{" "}
                            and start tracking real startups today.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Form */}
                    <div className="mt-4 space-y-4">
                        <div className="flex gap-3">
                            <Input
                                placeholder="First name"
                                value={form.firstName}
                                onChange={(e) =>
                                    setForm({ ...form, firstName: e.target.value })
                                }
                            />
                            <Input
                                placeholder="Last name"
                                value={form.lastName}
                                onChange={(e) =>
                                    setForm({ ...form, lastName: e.target.value })
                                }
                            />
                        </div>

                        <Input
                            // Updated placeholder to clearly state the rule
                            placeholder="Username (spaces replaced by _, must contain an underscore)"
                            value={form.username}
                            onChange={(e) => {
                                // 1. Replaces all whitespace characters with an underscore
                                const sanitizedUsername = e.target.value.replace(/\s/g, "_");
                                setForm({ ...form, username: sanitizedUsername });
                            }}
                        />

                        <Input
                            placeholder="Email address"
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />

                        <Input
                            placeholder="Password"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />

                        <Button
                            onClick={handleSignup}
                            disabled={loading}
                            className="w-full bg-primary text-primary-foreground font-medium hover:opacity-90"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Creating account...
                                </span>
                            ) : (
                                "Create Account"
                            )}
                        </Button>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <button
                            onClick={() => {
                                setOpen(false);
                                setTimeout(() => setShowSignin(true), 200);
                            }}
                            className="text-primary font-medium hover:underline"
                        >
                            Sign in
                        </button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Sign In Dialog */}
            <SigninDialog open={showSignin} onOpenChange={setShowSignin} />
        </>
    );
}