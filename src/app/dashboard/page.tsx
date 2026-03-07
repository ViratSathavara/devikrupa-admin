"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Layers, Mail, Package, Sparkles } from "lucide-react";
import { deshboardAPI } from "@/lib/api";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type DashboardCard = {
  name: string;
  count: number;
};

const metricMeta: Record<
  string,
  { label: string; description: string; icon: ReactNode }
> = {
  products: {
    label: "Products",
    description: "Total listed products",
    icon: <Package className="h-5 w-5" />,
  },
  categories: {
    label: "Categories",
    description: "Available collections",
    icon: <Layers className="h-5 w-5" />,
  },
  inquiries: {
    label: "Inquiries",
    description: "Incoming customer requests",
    icon: <Mail className="h-5 w-5" />,
  },
};

export default function DashboardPage() {
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardCards = async () => {
      try {
        const data = await deshboardAPI.getAllCards();
        setCards(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load dashboard cards", error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardCards();
  }, []);

  const totalUnits = useMemo(
    () => cards.reduce((sum, card) => sum + (card.count ?? 0), 0),
    [cards],
  );

  return (
    <AdminPage>
      <AdminPageHeader
        title="Dashboard Overview"
        description="Quick summary of your catalog and customer activity."
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Total tracked entries: {totalUnits}
        </p>
      </AdminPageHeader>

      {loading ? (
        <AdminLoadingState label="Loading dashboard..." />
      ) : cards.length === 0 ? (
        <AdminEmptyState
          title="No dashboard metrics yet"
          description="Metrics will appear here once products, categories, and inquiries are available."
          icon={Sparkles}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {cards.map((card) => {
            const meta = metricMeta[card.name] ?? {
              label: card.name.replace(/_/g, " "),
              description: "Tracked metric",
              icon: <Sparkles className="h-5 w-5" />,
            };

            return (
              <AdminPanel key={card.name} className="relative overflow-hidden p-0">
                <div className="h-1 bg-gradient-to-r from-[var(--primary)] via-[#5da585] to-[var(--secondary)]" />
                <div className="p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {meta.label}
                      </p>
                      <p className="text-sm text-muted-foreground">{meta.description}</p>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {meta.icon}
                    </div>
                  </div>
                  <p className="text-4xl font-semibold tracking-tight text-foreground">
                    {card.count ?? 0}
                  </p>
                </div>
              </AdminPanel>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
