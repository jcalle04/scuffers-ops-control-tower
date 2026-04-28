import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/*": ["./data/candidate_csvs/**/*", "./storage/demo-state/**/*"],
  },
};

export default nextConfig;
