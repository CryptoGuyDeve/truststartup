"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function SuccessPage() {
  const [userToken, setUserToken] = useState<string | null>(null);

  // Load user token
  useEffect(() => {
    setUserToken(localStorage.getItem("token"));
  }, []);

  // Fetch user using token
  const user = useQuery(
    api.auth.getUserFromToken,
    userToken ? { token: userToken } : "skip"
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center animate-fadeIn">

        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-success" />

        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Payment Successful!
        </h1>

        <p className="text-gray-600 mb-8">
          Thank you for your purchase! Your payment has been processed
          successfully.
        </p>

        <div className="flex flex-col gap-3">

          {/* Only show link when user is loaded */}
          {user ? (
            <Link href={`/${user._id}/dashboard`}>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md">
                Go to Dashboard
              </button>
            </Link>
          ) : (
            <button className="w-full bg-gray-300 text-gray-500 py-3 rounded-xl cursor-not-allowed">
              Loading...
            </button>
          )}

          <Link href="/">
            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-xl transition-all">
              Back to Homepage
            </button>
          </Link>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.6s ease forwards;
        }

        .animate-success {
          animation: pop 0.4s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          80% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
