import bundleAnalyzer from '@next/bundle-analyzer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..'),
};

export default withBundleAnalyzer(nextConfig);
