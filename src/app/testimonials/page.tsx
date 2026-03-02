"use client";

import { useEffect, useMemo, useState } from "react";
import { testimonialAPI, type Testimonial } from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
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
import { RefreshCw, Star, Trash2 } from "lucide-react";

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
    if (!confirm("Delete this testimonial?")) {
      return;
    }

    try {
      await testimonialAPI.delete(id);
      setTestimonials((previous) =>
        previous.filter((testimonial) => testimonial.id !== id)
      );
      toast.success("Testimonial deleted");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Failed to delete testimonial"));
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">
            Customer reviews from landing page (admin can only review and delete)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="border-[#4f83f0] bg-[#e7efff] text-[#1f56cc]">
            Total: {totalCount}
          </Badge>
          <Button
            variant="outline"
            onClick={() => loadTestimonials(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading testimonials...
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {testimonials.length === 0 ? (
              <div className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-6 text-center text-sm text-[#6f6761]">
                No testimonials found
              </div>
            ) : (
              testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-2xl border border-[#ded8d2] bg-[#f9f7f5] p-4 shadow-[0_6px_20px_rgba(31,27,24,0.08)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[#2f2b29]">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-[#736a64]">
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
                  <p className="mt-3 text-sm text-[#5f5751]">{testimonial.message}</p>
                  <p className="mt-3 text-xs text-[#7a716a]">
                    Added: {formatDate(testimonial.createdAt)}
                  </p>
                </div>
              ))
            )}
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
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-[#6f6761]">
                      No testimonials found
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell className="font-medium">{testimonial.name}</TableCell>
                      <TableCell className="text-[#6d655f]">
                        {testimonial.role || "Customer"}
                        {testimonial.location ? ` | ${testimonial.location}` : ""}
                      </TableCell>
                      <TableCell>
                        <RatingStars rating={testimonial.rating} />
                      </TableCell>
                      <TableCell className="max-w-[360px]">
                        <p className="line-clamp-2 text-[#5f5751]">{testimonial.message}</p>
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
