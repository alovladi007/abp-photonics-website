/** @type {import("next").NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: "10mb" } },
  output: "standalone"
};
export default nextConfig;
