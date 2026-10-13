import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Monorepo: lacak dependensi dari akar workspace agar build standalone lengkap.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
