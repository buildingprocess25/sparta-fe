import type { NextConfig } from "next";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const nextConfig: NextConfig = {
    output: "standalone",

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: `${apiBaseUrl.replace(/\/$/, "")}/api/:path*`,
            },
            {
                source: "/get-data",
                destination: `${apiBaseUrl.replace(/\/$/, "")}/get-data`,
            },
            {
                source: "/get-data-price-rab",
                destination: `${apiBaseUrl.replace(/\/$/, "")}/get-data-price-rab`,
            },
        ];
    },

    async headers() {
        return [
            {
                source: "/user-manual/:path*.pdf",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/pdf",
                    },
                    {
                        key: "Cache-Control",
                        value: "public, max-age=3600",
                    },
                ],
            },
            {
                source: "/(.*)",
                headers: [
                    {
                        key: "X-Content-Type-Options",
                        value: "nosniff",
                    },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/javascript; charset=utf-8",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self'",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
