import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  reactStrictMode: true,
  images: { unoptimized: true },
  trailingSlash: false,
};

export default config;
