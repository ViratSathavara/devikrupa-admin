"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareQuote, RefreshCw, Star, Trash2 } from "lucide-react";

import { testimonialAPI, type Testimonial } from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
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

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${
            index < rating ? "fill-[#f6b939] text-[#f6b939]" : "text-[#c8c0ba]"
          }`}
        />
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const totalCount = useMemo(() => testimonials.length, [testimonials]);

  const loadTestimonials = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await testimonialAPI.getAll();
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load testimonials", error);
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadTestimonials();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this testimonial?")) return;

    try {
      await testimonialAPI.delete(id);
      setTestimonials((previous) =>
        previous.filter((testimonial) => testimonial.id !== id),
      );
      toast.success("Testimonial deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete testimonial"));
    }
  };

  return (
    <AdminPage>
      <AdminPageHeader
        title="Testimonials"
        description="Review and moderate testimonials shown on the website."
        actions={
          <>
            <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">
              Total: {totalCount}
            </Badge>
            <Button variant="outline" onClick={() => loadTestimonials(true)} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {loading ? (
        <AdminLoadingState label="Loading testimonials..." />
      ) : testimonials.length === 0 ? (
        <AdminEmptyState
          title="No testimonials found"
          description="Customer reviews will appear here once submitted."
          icon={MessageSquareQuote}
        />
      ) : (
        <AdminPanel className="space-y-3">
          <div className="space-y-3 md:hidden">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="rounded-xl border border-[var(--shell-border)] bg-[var(--surface-elevated)] p-4"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role || "Customer"}
                      {testimonial.location ? ` | ${testimonial.location}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(testimonial.id)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" />
                    Delete
                  </Button>
                </div>

                <RatingStars rating={testimonial.rating} />
                <p className="mt-3 text-sm text-muted-foreground">{testimonial.message}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Added: {formatDate(testimonial.createdAt)}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role / Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.map((testimonial) => (
                  <TableRow key={testimonial.id}>
                    <TableCell className="font-medium">{testimonial.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {testimonial.role || "Customer"}
                      {testimonial.location ? ` | ${testimonial.location}` : ""}
                    </TableCell>
                    <TableCell>
                      <RatingStars rating={testimonial.rating} />
                    </TableCell>
                    <TableCell className="max-w-[360px]">
                      <p className="line-clamp-2 text-muted-foreground">{testimonial.message}</p>
                    </TableCell>
                    <TableCell>{formatDate(testimonial.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(testimonial.id)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete
                      </Button>
                    </TableCell>
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
