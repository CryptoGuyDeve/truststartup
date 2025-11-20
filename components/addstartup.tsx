// "use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useToast } from "@/hooks/use-toast";

interface AddStartupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Helper function for URL validation
const isValidHttpsUrl = (url: string) => {
  // Checks if the URL is non-empty and starts with "https://"
  return url.trim() !== "" && url.toLowerCase().startsWith("https://");
};

export default function AddStartupDialog({
  open,
  onOpenChange,
}: AddStartupDialogProps) {
  const [form, setForm] = React.useState({
    name: "",
    company: "",
    website: "", // ⭐ Validated for non-empty and https:
    avatar: "", // ⭐ Validated for non-empty and https:
    bio: "", // ⭐ Validated for non-empty
    category: "", // ⭐ Validated for non-empty
    stripeKey: "", // ⭐ Validated for non-empty
    twitter: "",
  });

  const [showSuccess, setShowSuccess] = React.useState(false);
  const [confettiActive, setConfettiActive] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const addStartup = useMutation(api.startups.addStartup);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const userToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!userToken) {
      toast({
        title: "Sign in required ⚠️",
        description: "You must be signed in to add a startup.",
        variant: "warning",
      });
      return;
    }

    //
    // 🛑 IMPLEMENTATION OF NEW VALIDATION RULES 🛑
    //

    // 1. Check for basic required fields (Name, Bio/Desc, Category, StripeKey)
    if (
      !form.name.trim() ||
      !form.bio.trim() ||
      !form.category.trim() ||
      !form.stripeKey.trim()
    ) {
      toast({
        title: "Missing Required Fields ⚠️",
        description: "Startup Name, Bio/Description, Category, and Stripe Key are all required.",
        variant: "warning",
      });
      return;
    }

    // 2. Validate Website Link (must be non-empty and start with https:)
    if (!isValidHttpsUrl(form.website)) {
      toast({
        title: "Invalid Website Link 🔗",
        description: "Website Link is required and must start with 'https://'.",
        variant: "warning",
      });
      return;
    }

    // 3. Validate Logo/Avatar URL (must be non-empty and start with https:)
    if (!isValidHttpsUrl(form.avatar)) {
      toast({
        title: "Invalid Logo URL 🖼️",
        description: "Logo/Avatar URL is required and must start with 'https://'.",
        variant: "warning",
      });
      return;
    }
    
    // 4. Stripe Key format check (optional but good practice)
    if (!form.stripeKey.trim().toLowerCase().startsWith("sk_") && !form.stripeKey.trim().toLowerCase().startsWith("rk_")) {
        toast({
            title: "Invalid Stripe Key Format 🔑",
            description: "Please provide a valid Stripe Secret or Restricted Key (e.g., rk_live_...).",
            variant: "warning",
        });
        return;
    }
    
    //
    // 🚀 SUBMISSION LOGIC 🚀
    //
    try {
      setLoading(true);

      await addStartup({
        // Trim all string inputs before sending
        name: form.name.trim(),
        company: form.company.trim(),
        website: form.website.trim(),
        avatar: form.avatar.trim(),
        bio: form.bio.trim(),
        category: form.category.trim(),
        stripeKey: form.stripeKey.trim(),
        twitter: form.twitter.trim(),
        userToken,
      });

      toast({
        title: "✅ Startup Added!",
        description: `${form.name} has been added successfully.`,
        variant: "success",
      });

      setShowSuccess(true);
      setConfettiActive(true);

      setTimeout(() => {
        setShowSuccess(false);
        setConfettiActive(false);
        onOpenChange(false);
        setForm({
          name: "",
          company: "",
          website: "",
          avatar: "",
          bio: "",
          category: "",
          stripeKey: "",
          twitter: "",
        });
      }, 2500);
    } catch (error: any) {
      toast({
        title: "Error ❌",
        description: error.message || "Failed to add startup.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {confettiActive && (
        <Confetti numberOfPieces={180} recycle={false} gravity={0.25} />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-background/90 backdrop-blur-xl border border-border shadow-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              Add your startup
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Get a verified page on{" "}
              <span className="font-semibold text-primary">TrustStartup</span>{" "}
              to showcase your revenue and growth insights 🚀
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence>
            {showSuccess ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <CheckCircle2 className="text-green-500 w-16 h-16 mb-3" />
                <h2 className="text-xl font-semibold text-foreground">
                  Startup Added Successfully!
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  We’ll verify your data and list it soon 🎯
                </p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 space-y-5"
              >
                {/* Startup Name (Required) */}
                <div className="space-y-2">
                  <Label>
                    Startup Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Flowly"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />
                </div>

                {/* Company Name (Optional) */}
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    placeholder="e.g., Flowly Technologies Inc."
                    value={form.company}
                    onChange={(e) =>
                      setForm({ ...form, company: e.target.value })
                    }
                  />
                </div>

                {/* Website Link (Required: HTTPS) */}
                <div className="space-y-2">
                  <Label>
                    Website Link <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="https://yourstartup.com"
                    value={form.website}
                    onChange={(e) =>
                      setForm({ ...form, website: e.target.value })
                    }
                  />
                </div>

                {/* Avatar (Required: HTTPS) */}
                <div className="space-y-2">
                  <Label>
                    Logo / Avatar URL <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Input
                      placeholder="https://..."
                      value={form.avatar}
                      onChange={(e) =>
                        setForm({ ...form, avatar: e.target.value })
                      }
                    />
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={form.avatar} alt="Preview" />
                      <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                  </div>
                </div>

                {/* Bio (Required) */}
                <div className="space-y-2">
                  <Label>
                    Bio / Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    rows={3}
                    placeholder="Describe your startup..."
                    value={form.bio}
                    onChange={(e) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                  />
                </div>

                {/* Category (Required) */}
                <div className="space-y-2">
                  <Label>
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={form.category}
                    onValueChange={(v) => setForm({ ...form, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="ai">AI</SelectItem>
                      <SelectItem value="ecommerce">E-Commerce</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stripe Key (Required) */}
                <div className="space-y-2">
                  <Label>
                    Stripe Secret API Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="rk_live_..."
                    value={form.stripeKey}
                    onChange={(e) =>
                      setForm({ ...form, stripeKey: e.target.value })
                    }
                  />
                  <a
                    href="https://dashboard.stripe.com/apikeys"
                    target="_blank"
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                    rel="noreferrer"
                  >
                    Click here to create a read-only API key{" "}
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* Twitter (Optional) */}
                <div className="space-y-2">
                  <Label>X Handle (optional)</Label>
                  <Input
                    placeholder="@username"
                    value={form.twitter}
                    onChange={(e) =>
                      setForm({ ...form, twitter: e.target.value })
                    }
                  />
                </div>

                {/* Submit */}
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-indigo-500 text-white font-medium rounded-xl shadow-md"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Adding...
                    </span>
                  ) : (
                    "Add Startup"
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
}