import type { NextConfig } from "next";
import path from "node:path";

function getRemoteImagePatterns() {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "images.unsplash.com",
    },
    {
      protocol: "https",
      hostname: "**.r2.dev",
    },
  ];

  for (const value of [process.env.R2_PUBLIC_URL, process.env.R2_ENDPOINT]) {
    if (!value) {
      continue;
    }

    try {
      const url = new URL(value);

      if (url.protocol === "http:" || url.protocol === "https:") {
        patterns.push({
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
        });
      }
    } catch {
      // Ignore malformed optional image hosts; env validation happens in server R2 utilities.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getRemoteImagePatterns(),
  },
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
