/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  distDir: 'dist/app',
  typescript: {
    ignoreBuildErrors: true
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@tauri-apps/api': false,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
  trailingSlash: true,
}

module.exports = nextConfig 