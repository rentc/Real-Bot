import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/quotations/:id/pdf',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'https://api-e5mpppexfq-an.a.run.app/api'}/quotations/:id/pdf`,
      },
    ];
  },
};

export default nextConfig;
