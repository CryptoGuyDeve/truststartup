"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SigninDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SigninDialog({ open, onOpenChange }: SigninDialogProps) {
  const login = useMutation(api.auth.login);
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState({
    email: "",
    password: "",
  });

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const user = useQuery(api.auth.getUserFromToken, token ? { token } : "skip");

  // ✅ Auto-close when already logged in
  React.useEffect(() => {
    if (user && user.email) {
      onOpenChange(false);
    }
  }, [user, onOpenChange]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await login(form);
      localStorage.setItem("token", res.token);
      alert("✅ Logged in successfully!");
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background/90 backdrop-blur-md border border-border shadow-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground text-center">
            Welcome back 👋
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Sign in to continue tracking verified startups.
          </DialogDescription>
        </DialogHeader>

        {/* Form Fields */}
        <div className="mt-4 space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>

        {/* Footer Links */}
        <p className="text-sm text-center text-muted-foreground mt-5">
          Don’t have an account?{" "}
          <button
            onClick={() => {
              onOpenChange(false);
              // 🔥 Dispatch event to open Signup dialog
              setTimeout(() => {
                const event = new CustomEvent("openSignupDialog");
                window.dispatchEvent(event);
              }, 200);
            }}
            className="text-primary font-medium hover:underline"
          >
            Sign Up
          </button>
        </p>
      </DialogContent>
    </Dialog>
  );
}
