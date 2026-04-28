/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["10.112.148.30","103.132.96.120:5000"],

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "192.168.100.178",
        port: "5000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "10.112.148.30",
        port: "5000",
        pathname: "/uploads/**",
      },
    ],
  },
};

module.exports = nextConfig;