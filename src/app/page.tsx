"use client";

import { useState, useEffect, useRef } from 'react';
import modelsData from '@/data/models.json';

interface Model {
  name: string;
  size: string;
  architecture: string;
  trainingData: string;
  license: string;
}

const MODELS: Model[] = modelsData;

const SYSTEM_PROMPT = "あなたは私のAI彼女です。優しく、面白く、そして少しわがままな性格で私を楽しませてください。";
const IDLE_PROMPT = "何かお話したいことはありますか？";
const IDLE_TIME = 10000; // 10秒

export default function Home() {
  const [model, setModel] = useState(MODELS[0].name);
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState(false);
  const [lastUserInteraction, setLastUserInteraction] = useState(Date.now());

  useEffect(() => {
    // 初期プロンプトを送信
    sendPrompt(SYSTEM_PROMPT + "\n" + IDLE_PROMPT);

    // 5秒ごとに自動的にプロンプトを送信
    const intervalId = setInterval(() => {
      if (Date.now() - lastUserInteraction > IDLE_TIME) {
        sendPrompt(IDLE_PROMPT);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [model, lastUserInteraction]);

  const sendPrompt = async (currentPrompt: string) => {
    setLoading(true);
    setPrompt(''); // Clear the input field after sending
    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, prompt: SYSTEM_PROMPT + "\n" + conversationHistory.join("\n") + "\n" + currentPrompt }),
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
      setConversationHistory(prev => [...prev, currentPrompt, accumulatedResult]);
    } catch (error: any) {
      console.error(error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sendPrompt(prompt);
    setLastUserInteraction(Date.now());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
      setLastUserInteraction(Date.now());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setLastUserInteraction(Date.now());
  };


  return (
    <div className={`container mx-auto p-4 ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {darkMode ? 'ライトモード' : 'ダークモード'}
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-4 text-gray-700 dark:text-gray-200">Ollama Tester</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="mb-2">
          <label htmlFor="model" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">
            Model:
          </label>
          <select
            id="model"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200"
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
          <label htmlFor="prompt" className="block text-gray-700 text-sm font-bold mb-2 dark:text-gray-200">
            Prompt:
          </label>
          <textarea
            ref={textareaRef}
            id="prompt"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200"
            value={prompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
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
        <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Result:</h2>
        <p className="text-gray-700 dark:text-gray-200">{result}</p>
      </div>
    </div>
  );
}
