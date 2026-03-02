"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { inquiryAPI, adminAuthAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw } from "lucide-react";

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
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inquiries</h1>
          <p className="text-muted-foreground">Track customer inquiries and messages</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">Total: {totalCount}</Badge>
          <Button
            type="button"
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading inquiries...</div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {inquiries.length === 0 ? (
              <div className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-6 text-center text-sm text-[#6f6761]">
                No inquiries found
              </div>
            ) : (
              inquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-4 shadow-[0_6px_20px_rgba(31,27,24,0.08)]"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-base font-semibold text-[#2f2b29]">{inquiry.name || "Unknown"}</p>
                      <p className="text-sm text-[#736a64]">{inquiry.email || inquiry.phone || "-"}</p>
                    </div>
                    {getStatusBadge(inquiry.status)}
                  </div>

                  <p className="line-clamp-3 text-sm text-[#5f5751]">{inquiry.message || "No message"}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs uppercase tracking-wide text-[#7a716a]">
                    <div className="rounded-lg border border-[#e6e0db] bg-white/55 p-2">
                      Product
                      <p className="mt-1 text-sm font-medium normal-case text-[#2f2b29]">
                        {inquiry.product?.name || inquiry.productName || "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#e6e0db] bg-white/55 p-2">
                      Date
                      <p className="mt-1 text-sm font-medium normal-case text-[#2f2b29]">
                        {formatDate(inquiry.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
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
                {inquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-[#6f6761]">
                      No inquiries found
                    </TableCell>
                  </TableRow>
                ) : (
                  inquiries.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="font-medium">{inquiry.name || "Unknown"}</TableCell>
                      <TableCell className="text-[#6d655f]">
                        <div>{inquiry.email || "-"}</div>
                        <div className="text-xs text-[#8a817b]">{inquiry.phone || "-"}</div>
                      </TableCell>
                      <TableCell>{inquiry.product?.name || inquiry.productName || "-"}</TableCell>
                      <TableCell className="max-w-[320px]">
                        <p className="line-clamp-2 text-[#5f5751]">{inquiry.message || "No message"}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                      <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

