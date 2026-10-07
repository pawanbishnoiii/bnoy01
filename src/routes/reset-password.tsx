import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Bnoy Studios" },
      { name: "description", content: "Choose a new password for your Bnoy Studios account." },
      { property: "og:title", content: "Set a new password — Bnoy Studios" },
      { property: "og:description", content: "Choose a new password for your Bnoy Studios account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return toast.error("Could not update password", { description: error.message });
    toast.success("Password updated — you're signed in");
    navigate({ to: "/dashboard" });
  };
  return (
    <main className="min-h-dvh grid place-items-center bg-secondary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-8 shadow-card">
        <h1 className="font-display text-2xl font-bold">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Enter a new password (at least 6 characters).</p>
        <Input type="password" required minLength={6} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="New password" />
        <Button type="submit" disabled={busy} className="w-full">{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </main>
  );
}
