"use client";

import { toast as sonnerToast, Toaster } from "sonner";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from "lucide-react";
import React from "react";

/**
 * 🧊 useToast() — Elegant unified Sonner wrapper (Light Theme)
 */
export function useToast() {
  return {
    toast: ({
      title,
      description,
      variant = "default",
      duration = 4000,
    }: {
      title: string;
      description?: string;
      variant?: "default" | "success" | "error" | "warning" | "info" | "loading";
      duration?: number;
    }) => {
      const baseOptions = {
        description,
        duration,
        className:
          "bg-white text-black border border-gray-200 shadow-md rounded-lg",
      };

      switch (variant) {
        case "success":
          sonnerToast.success(title, {
            ...baseOptions,
            icon: <CheckCircle2 className="text-green-500 w-5 h-5" />,
          });
          break;
        case "error":
          sonnerToast.error(title, {
            ...baseOptions,
            icon: <XCircle className="text-red-500 w-5 h-5" />,
          });
          break;
        case "warning":
          sonnerToast.warning(title, {
            ...baseOptions,
            icon: <AlertTriangle className="text-yellow-500 w-5 h-5" />,
          });
          break;
        case "info":
          sonnerToast.info(title, {
            ...baseOptions,
            icon: <Info className="text-blue-500 w-5 h-5" />,
          });
          break;
        case "loading":
          sonnerToast.loading(title, {
            description,
            duration: Infinity,
            icon: <Loader2 className="w-5 h-5 animate-spin text-gray-600" />,
            className:
              "bg-white text-black border border-gray-300 shadow-md rounded-lg",
          });
          break;
        default:
          sonnerToast(title, baseOptions);
      }
    },
  };
}

/**
 * 🍏 AppToaster — Global styled Sonner renderer (Light Mode)
 */
export const AppToaster = () => (
  <Toaster
    position="top-right"
    closeButton
    expand
    toastOptions={{
      style: {
        borderRadius: "12px",
        background: "#ffffff",
        color: "#111111",
        border: "1px solid #e5e7eb",
        boxShadow: "0 6px 18px rgba(0, 0, 0, 0.08)",
        fontSize: "0.9rem",
        fontWeight: 500,
      },
    }}
  />
);
