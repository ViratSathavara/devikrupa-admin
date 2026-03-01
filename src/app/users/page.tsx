"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UsersPage() {
  return (
    <div className="p-4 md:p-6">
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>
            This screen is ready for user management modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add your user list and controls here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
