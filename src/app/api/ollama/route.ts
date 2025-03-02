import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { model, prompt } = await request.json();

    // OLLAMA API の URL
    const ollamaApiUrl = 'http://localhost:11434/api/generate';

    const ollamaResponse = await fetch(ollamaApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: true, // ストリーミングを有効にする
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
    }

    // ストリーミングされたレスポンスを返す
    return new NextResponse(ollamaResponse.body, {
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}