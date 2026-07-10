/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "drive.google.com",
      },
      {
        // Supabase Storage: matches <project-ref>.supabase.co
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        // OAuth provider avatars (GitHub, Google, etc.)
        protocol: "https",
        hostname: "*.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
