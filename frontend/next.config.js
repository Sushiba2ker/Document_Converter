/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  async rewrites() {
    // In Docker, backend runs on the same container
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:8000'
      : 'http://localhost:8000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/:path*`,
      },
    ]
  },
  images: {
    domains: ['localhost'],
  },
  // Optimize for Docker production builds
  output: 'standalone',
  // Disable telemetry in production
  telemetry: false,
}

module.exports = nextConfig
