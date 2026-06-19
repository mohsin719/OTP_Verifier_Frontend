"use client";

import Link from "next/link";
import { Globe, ShoppingBag, Tag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

const platforms = [
  {
    name: "Facebook",
    description: "Get a number for Facebook account verification",
    priceLabel: "Rs 30 per OTP",
    icon: Tag,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    href: "/platforms/facebook",
  },
  {
    name: "Amazon",
    description: "Get a number for Amazon account verification",
    priceLabel: "Rs 60 per OTP",
    icon: ShoppingBag,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    href: "/platforms/amazon",
  },
  {
    name: "Walmart",
    description: "Get a number for Walmart account verification",
    priceLabel: "Rs 60 per OTP",
    icon: ShoppingBag,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
    href: "/platforms/walmart",
  },
  {
    name: "Global US Numbers",
    description: "Get a US number for any service",
    priceLabel: "Rs 60 per OTP",
    icon: Globe,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    href: "/numbers",
  },
];

export default function PlatformsPage(): React.ReactElement {
  const user = useAuthStore((s) => s.user);
  const userPlatform = user?.preferredPlatform || "Facebook";

  const platformMap: Record<string, string> = {
    Facebook: "Facebook",
    Amazon: "Amazon",
    Walmart: "Walmart",
    Others: "Global US Numbers",
  };

  const selectedPlatformName = platformMap[userPlatform] || "Facebook";
  const visiblePlatforms = platforms.filter((platform) => platform.name === selectedPlatformName);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Numbers</h1>
        <p className="text-muted-foreground">
          Select a platform to get a dedicated number for account verification.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {visiblePlatforms.map((platform) => (
          <Card key={platform.name} className="group hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${platform.bgColor} ${platform.color} mb-4`}>
                <platform.icon className="h-6 w-6" />
              </div>
              <CardTitle className="group-hover:text-primary transition-colors">
                {platform.name}
              </CardTitle>
              <CardDescription>
                {platform.description}
                <span className="mt-2 block font-semibold text-foreground">{platform.priceLabel}</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href={platform.href}>
                  Get Number
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
