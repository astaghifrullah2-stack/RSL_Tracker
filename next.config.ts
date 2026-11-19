import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.e2b.app",
        "**.e2b.app",
        "*.e2b.dev",
        "**.e2b.dev",
        "*.arena.ai",
        "**.arena.ai",
        "*.lmarena.ai",
        "**.lmarena.ai",
        "*.lmsys.org",
        "**.lmsys.org",
      ],
    },
  },
};

export default nextConfig;
