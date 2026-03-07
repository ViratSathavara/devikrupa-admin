"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, RefreshCw } from "lucide-react";

import { adminAuthAPI, inquiryAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminEmptyState,
  AdminLoadingState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
} from "@/components/layouts/AdminPageShell";

type InquiryItem = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  productName?: string;
  product?: {
    name?: string;
  };
};

function formatDate(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status?: string) {
  const normalized = (status || "PENDING").toUpperCase();

  if (normalized === "RESOLVED" || normalized === "COMPLETED") {
    return <Badge className="border-[#1c6c46] bg-[#def4e7] text-[#1c6c46]">{normalized}</Badge>;
  }
  if (normalized === "REJECTED" || normalized === "CANCELLED") {
    return <Badge className="border-[#b42318] bg-[#fdecea] text-[#b42318]">{normalized}</Badge>;
  }
  if (normalized === "IN_PROGRESS" || normalized === "CONTACTED") {
    return <Badge className="border-[#7c5a0b] bg-[#fff3d6] text-[#7c5a0b]">{normalized}</Badge>;
  }

  return <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">{normalized}</Badge>;
}

export default function InquiriesPage() {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);

    try {
      const data = await inquiryAPI.getAll();
      setInquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load inquiries", error);
    } finally {
      if (!silent) setLoading(false);
      if (silent) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!adminAuthAPI.isAuthenticated()) {
      router.replace("/login");
      return;
    }
    loadData();
  }, [router]);

  const totalCount = useMemo(() => inquiries.length, [inquiries]);

  return (
    <AdminPage>
      <AdminPageHeader
        title="Inquiries"
        description="Track and review customer inquiries from the website."
        actions={
          <>
            <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">
              Total: {totalCount}
            </Badge>
            <Button
              type="button"
              variant="outline"
              onClick={() => loadData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {loading ? (
        <AdminLoadingState label="Loading inquiries..." />
      ) : inquiries.length === 0 ? (
        <AdminEmptyState
          title="No inquiries found"
          description="New customer messages will appear here."
          icon={Inbox}
        />
      ) : (
        <AdminPanel className="space-y-3">
          <div className="space-y-3 md:hidden">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {inquiry.name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inquiry.email || inquiry.phone || "-"}
                    </p>
                  </div>
                  {getStatusBadge(inquiry.status)}
                </div>

                <p className="line-clamp-3 text-sm text-muted-foreground">
                  {inquiry.message || "No message"}
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <div className="rounded-lg border border-[var(--shell-border)] bg-card p-2">
                    Product
                    <p className="mt-1 text-sm font-medium normal-case text-foreground">
                      {inquiry.product?.name || inquiry.productName || "-"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[var(--shell-border)] bg-card p-2">
                    Date
                    <p className="mt-1 text-sm font-medium normal-case text-foreground">
                      {formatDate(inquiry.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inquiries.map((inquiry) => (
                  <TableRow key={inquiry.id}>
                    <TableCell className="font-medium">{inquiry.name || "Unknown"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      <div>{inquiry.email || "-"}</div>
                      <div className="text-xs text-muted-foreground">{inquiry.phone || "-"}</div>
                    </TableCell>
                    <TableCell>{inquiry.product?.name || inquiry.productName || "-"}</TableCell>
                    <TableCell className="max-w-[320px]">
                      <p className="line-clamp-2 text-muted-foreground">
                        {inquiry.message || "No message"}
                      </p>
                    </TableCell>
                    <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                    <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </AdminPanel>
      )}
    </AdminPage>
  );
}
