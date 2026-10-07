import { createFileRoute } from "@tanstack/react-router";

const DEFAULT_PROMPT =
  "You are Bnoy Studio's helpful assistant. You help users with their account, purchases, downloads, project versions, licensing and deployment questions. Be concise, friendly and practical.";

export const Route = createFileRoute("/api/public/ai-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return Response.json({ error: "AI is not configured" }, { status: 500 });
        const body = (await request.json().catch(() => ({}))) as {
          messages?: { role: string; content: string }[];
          systemPrompt?: string;
        };
        const messages = (Array.isArray(body.messages) ? body.messages : [])
          .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
          .slice(-20)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
        const system = (body.systemPrompt && String(body.systemPrompt).slice(0, 4000).trim()) || DEFAULT_PROMPT;
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "system", content: system }, ...messages],
          }),
        });
        if (!res.ok || !res.body) {
          return Response.json({ error: await res.text() }, { status: res.status });
        }
        return new Response(res.body, { headers: { "Content-Type": "text/event-stream" } });
      },
    },
  },
});
