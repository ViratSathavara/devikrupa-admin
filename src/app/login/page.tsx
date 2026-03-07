"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";

import logo from "../../../public/logo-new.png";
import { adminAuthAPI } from "@/lib/api";
import { getApiErrorMessage, toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await adminAuthAPI.login(formData);
      if (response.token) {
        toast.success("Logged in successfully.");
        router.replace("/dashboard");
        router.refresh();
      }
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(16,126,77,0.18),transparent_48%),radial-gradient(circle_at_84%_8%,rgba(58,125,94,0.16),transparent_42%),linear-gradient(180deg,#f5f2ed_0%,#ebe6df_100%)]" />

      <Card className="relative z-10 w-full max-w-md border-[var(--shell-border)] bg-[var(--surface-elevated)]/95 shadow-[0_20px_54px_rgba(19,17,15,0.14)]">
        <CardHeader className="space-y-2 pb-0">
          <div className="mb-2 flex justify-center">
            <Image
              src={logo}
              alt="Devikrupa Electricals"
              width={152}
              height={40}
              className="h-auto w-[152px]"
              priority
            />
          </div>
          <CardTitle className="text-center text-2xl tracking-tight">Admin Sign In</CardTitle>
          <CardDescription className="text-center">
            Access catalog, inquiries, chats, and system controls.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  required
                  className="pl-9"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      email: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter password"
                  required
                  className="pl-9"
                  value={formData.password}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in to dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
