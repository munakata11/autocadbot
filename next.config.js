/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@tauri-apps/api': false,
      };
    }
    return config;
  },
}

module.exports = nextConfig 