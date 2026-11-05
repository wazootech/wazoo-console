import { withGTConfig } from "gt-next/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: { unoptimized: true },
  trailingSlash: true,
};

export default withGTConfig(nextConfig, {});
