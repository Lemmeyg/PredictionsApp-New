/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/storage']
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'node-fetch$': 'node-fetch/lib/index.js',
      }
    }
    return config
  },
}

module.exports = nextConfig 