import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://usnumhub.com").replace(
    /\/$/,
    "",
  );

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login/", "/register/", "/policies/"],
      disallow: [
        "/dashboard/",
        "/wallet/",
        "/numbers/",
        "/otp-history/",
        "/platforms/",
        "/settings/",
        "/manage/",
        "/forgot-password/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}