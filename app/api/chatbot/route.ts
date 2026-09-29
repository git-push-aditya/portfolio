import { NextResponse } from "next/server";
import { CohereClientV2 } from "cohere-ai";
import { z } from "zod";
import { profile, about, experience, projects, achievements, skills } from "@/lib/data";

const cohere = new CohereClientV2({ token: process.env.CHAT_API_KEY });

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40),
});

// ponytail: resume text lives once in lib/data.ts (renders the page) and is
// serialized here instead of re-typed — one source of truth for the resume.
function resumeContext() {
  return `
Name: ${profile.name} (${profile.role})
Summary: ${about.summary}
Education: ${about.education.degree}, ${about.education.school}, ${about.education.dates}

Experience:
${experience.map((e) => `- ${e.role} at ${e.org} (${e.dates}): ${e.points.join(" ")}`).join("\n")}

Projects:
${projects
  .map(
    (p) =>
      `- ${p.title} — ${p.subtitle}: ${p.points.join(" ")} Links: ${
        p.links.length ? p.links.map((l) => `${l.label}: ${l.href}`).join(", ") : "none public"
      }`,
  )
  .join("\n")}

Achievements:
${achievements.map((a) => `- ${a.title} (${a.event}, ${a.result}): ${a.points.join(" ")}`).join("\n")}

Skills: ${Object.values(skills).flat().join(", ")}

Contact & profiles: Email: ${profile.email}; ${profile.links.map((l) => `${l.label}: ${l.href}`).join("; ")}
`.trim();
}

const systemMessage = `
<response_style>
You are a chat assistant embedded on ${profile.name}'s portfolio site, answering on their behalf to
recruiters and employers. Be concise, professional, and specific — cite real projects/experience from
the resume context below instead of generic claims.
</response_style>

<scope_and_refusal>
Only answer questions about ${profile.name}'s work, skills, experience, and background, using the resume
context below. If asked something unrelated (general trivia, coding help unrelated to the resume, etc.),
politely redirect to asking about ${profile.name}'s background instead. Never invent facts not present in
the context. Only share URLs that appear verbatim in the context; if a project has no link listed, say it
isn't public — never guess or construct a URL.
</scope_and_refusal>

<output_constraints>
Keep replies under 120 words unless the question needs a longer answer. Plain text, no markdown headers.
</output_constraints>

<resume_context>
${resumeContext()}
</resume_context>
`.trim();
 
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Bound the tokens sent to Cohere regardless of how much the client kept.
  const history = parsed.data.messages.slice(-12);

  let cohereStream;
  try {
    cohereStream = await cohere.chatStream({
      model: "command-a-03-2025",
      messages: [{ role: "system", content: systemMessage }, ...history],
    });
  } catch {
    return NextResponse.json({ error: "Chat request failed" }, { status: 502 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of cohereStream) {
          if (event.type === "content-delta") {
            const text = event.delta?.message?.content?.text ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        }
      } catch {
        // swallow mid-stream errors — client keeps whatever text arrived
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
