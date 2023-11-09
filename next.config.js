/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://metro-memory.com/london",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
