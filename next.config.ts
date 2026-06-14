import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Standalone is for Docker/Azure containers; Vercel uses its own output.
  ...(isVercel ? {} : { output: "standalone" as const }),
  outputFileTracingIncludes: {
    "/*": ["./emails/**/*"],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
