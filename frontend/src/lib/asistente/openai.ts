type ChatCompletion = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

type ChatTurn = { role: "system" | "user" | "assistant"; content: string };

function compactHistory(
  history: { role: string; content: string }[] | undefined,
  maxTurns = 6
): ChatTurn[] {
  if (!history?.length) return [];
  return history
    .filter((item) => item.role === "user" || item.role === "assistant")
    .slice(-maxTurns)
    .map((item) => ({
      role: item.role as "user" | "assistant",
      content: item.content.trim().slice(0, 360),
    }))
    .filter((item) => item.content);
}

export async function completeChat(opts: {
  system: string;
  user: string;
  history?: { role: string; content: string }[];
  json?: boolean;
  maxTokens?: number;
}): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const messages: ChatTurn[] = [
      { role: "system", content: opts.system },
      ...compactHistory(opts.history),
      { role: "user", content: opts.user },
    ];
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: opts.maxTokens ?? 280,
        response_format: opts.json ? { type: "json_object" } : undefined,
        messages,
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as ChatCompletion;
    return payload.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
