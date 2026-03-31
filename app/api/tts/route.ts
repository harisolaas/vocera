export const runtime = "edge";

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-el-key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { voiceId?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { voiceId, text } = body;
  if (!voiceId || !text) {
    return new Response(JSON.stringify({ error: "Missing voiceId or text" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const elResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!elResponse.ok) {
    const errorBody = await elResponse.text();
    return new Response(errorBody, {
      status: elResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(elResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-cache",
    },
  });
}
