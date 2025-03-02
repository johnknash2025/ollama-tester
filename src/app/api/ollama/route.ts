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
        stream: false,
      }),
    });

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama API error: ${ollamaResponse.status} ${ollamaResponse.statusText}`);
    }

    const data = await ollamaResponse.json();
    return NextResponse.json({ result: data.response });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}