"use client";

import { generateText } from '@/lib/ollama';
import { useState, useEffect } from 'react';
import modelsData from '@/data/models.json';

interface Model {
  name: string;
  size: string;
  architecture: string;
  trainingData: string;
  license: string;
}

const MODELS: Model[] = modelsData;

export default function Home() {
  const [model, setModel] = useState(MODELS[0].name);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(''); // Clear previous result

    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, prompt }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get reader from response body');
      }

      let decoder = new TextDecoder();
      let accumulatedResult = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value);
        const jsonChunks = chunk.split('}{').map((chunk, index, array) => {
          if (index > 0) {
            chunk = '{' + chunk;
          }
          if (index < array.length - 1) {
            chunk = chunk + '}';
          }
          try {
            return JSON.parse(chunk);
          } catch (e) {
            console.warn('Failed to parse JSON chunk:', chunk);
            return null;
          }
        }).filter(Boolean);

        jsonChunks.forEach(jsonChunk => {
          if (jsonChunk && jsonChunk.response) {
            accumulatedResult += jsonChunk.response;
            setResult(accumulatedResult);
          }
        });
      }
    } catch (error: any) {
      console.error(error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ollama Tester</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-2">
          <label htmlFor="model" className="block text-gray-700 text-sm font-bold mb-2">
            Model:
          </label>
          <select
            id="model"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {MODELS.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-2">
          <label htmlFor="prompt" className="block text-gray-700 text-sm font-bold mb-2">
            Prompt:
          </label>
          <textarea
            id="prompt"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Generate'}
        </button>
      </form>
      <div>
        <h2 className="text-xl font-bold mb-2">Result:</h2>
        <p className="text-gray-700">{result}</p>
      </div>
    </div>
  );
}
