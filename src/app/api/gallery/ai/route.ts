import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const PASSWORD = process.env.GALLERY_ADMIN_PASSWORD || "admin123";

async function verifySession() {
  const cookieStore = await cookies();
  const session = cookieStore.get("gallery_admin_session");
  const expectedToken = createHash("sha256").update(PASSWORD + "salt-for-gallery-secret").digest("hex");
  return session && session.value === expectedToken;
}

export async function POST(request: NextRequest) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { aiBaseUrl, aiApiKey, aiModel, imageBase64, imageType } = await request.json();

    if (!aiApiKey) {
      return NextResponse.json({ error: "API Key is required" }, { status: 400 });
    }

    // Standardize URL to avoid path duplication (e.g. chat/completions/chat/completions)
    let targetUrl = aiBaseUrl || "https://api.openai.com/v1";
    if (!targetUrl.endsWith("/chat/completions")) {
      targetUrl = targetUrl.endsWith("/") ? `${targetUrl}chat/completions` : `${targetUrl}/chat/completions`;
    }

    console.log(`AI Server Proxy: Fetching from ${targetUrl} using model ${aiModel}`);

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${aiApiKey}`
      },
      body: JSON.stringify({
        model: aiModel || "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this photo. Return a JSON object with EXACTLY three properties: \n1. 'title' (a short, creative title, max 5 words)\n2. 'description' (a brief 1-sentence subheading describing the scene or vibe)\n3. 'tags' (an array of 3-5 lowercase words representing elements, subject, or mood).\n\nDo not output markdown code blocks. Output ONLY a clean, parseable JSON block."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${imageType || "image/jpeg"};base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI API error status: ${response.status}`, errText);
      return NextResponse.json({ error: `AI API returned status ${response.status}: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("AI Server Proxy Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
