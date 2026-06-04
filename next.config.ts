import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — disallows embedding in iframes.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers MIME-sniffing responses away from the declared content-type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin on cross-origin requests (no full URL leakage).
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features the app does not use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
