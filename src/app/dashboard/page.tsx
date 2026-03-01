"use client";

import { deshboardAPI } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Package, Layers, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type DashboardCards = Array<{
  name: string;
  count: number;
}>;

const getCardIcon = (name: string) => {
  switch (name) {
    case "products":
      return <Package className="w-6 h-6 text-primary" />;
    case "categories":
      return <Layers className="w-6 h-6 text-primary" />;
    case "inquiries":
      return <Mail className="w-6 h-6 text-primary" />;
    default:
      return null;
  }
};

const Page = () => {
  const [dashboardCards, setDashboardCards] = useState<DashboardCards | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardCards();
  }, []);

  const loadDashboardCards = async () => {
    try {
      const data = await deshboardAPI.getAllCards();
      setDashboardCards(data);
    } catch {
      toast.error("Failed to load dashboard cards");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dashboardCards && dashboardCards.map((card) => (
          <Card key={card.name}>
            <CardContent className="pt-0">
              <div className="h-1 rounded-full bg-gradient-to-r from-[var(--primary)] via-[var(--secondary)] to-[var(--primary)]" />
            </CardContent>
            <CardContent>
            <div className="flex items-center justify-between">
              <h2 className="text-sm text-[#6f6761] capitalize">{card.name}</h2>
              {getCardIcon(card.name)}
            </div>
            <p className="mt-2 text-3xl font-bold text-[#2f2b29]">
              {card.count ?? 0}
            </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Page;
