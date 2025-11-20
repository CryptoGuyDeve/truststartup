import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true, // ✅ Enables Next.js React Compiler (React 19+ ready)
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-icons-png.flaticon.com", // ✅ for your startup icon
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io", // ✅ if you use ImageKit or CDN later
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com", // ✅ for Cloudinary-hosted logos
      },
    ],
  },
};

export default nextConfig;
