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
        const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
          body: JSON.stringify({
            model: "openai/gpt-6-astra",
            stream: true,
            store: false,
            reasoning: { effort: "low" },
            instructions: system,
            input: messages.map((m) => ({ role: m.role, content: m.content })),
          }),
        });
        if (!res.ok || !res.body) {
          return Response.json({ error: await res.text() }, { status: res.status });
        }
        // Re-emit Responses deltas in the chat-completions SSE shape the chat widget reads.
        const enc = new TextEncoder();
        const dec = new TextDecoder();
        const reader = res.body.getReader();
        const stream = new ReadableStream({
          async start(controller) {
            let buf = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += dec.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() || "";
                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  try {
                    const ev = JSON.parse(line.slice(6));
                    if (ev.type === "response.output_text.delta" && ev.delta) {
                      controller.enqueue(enc.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: ev.delta } }] })}\n\n`));
                    }
                  } catch { /* ignore partial */ }
                }
              }
            } finally {
              controller.enqueue(enc.encode("data: [DONE]\n\n"));
              controller.close();
            }
          },
        });
        return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
      },
    },
  },
});
