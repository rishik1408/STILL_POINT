declare module 'next-pwa' {
  import type { NextConfig } from 'next';
  export default function withPWA(
    options: Record<string, unknown>
  ): (config: NextConfig) => NextConfig;
}
