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

export default function Home() {
  const [selectedModels, setSelectedModels] = useState<string[]>(MODELS.map(m => m.name));
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<{ [modelName: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{model: string, user: string, ai: string}[]>([]);

  const sendPrompt = async (model: string, currentPrompt: string) => {
    try {
      const response = await fetch('/api/ollama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model, prompt: currentPrompt }),
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
          }
        });
      }
      return accumulatedResult;
    } catch (error: any) {
      console.error(error);
      return `Error: ${error.message}`;
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResults({});

    try {
      const newResults: { [modelName: string]: string } = {};
      await Promise.all(
        selectedModels.map(async (model) => {
          newResults[model] = await sendPrompt(model, prompt);
        })
      );
      setResults(newResults);
      setConversationHistory(prev => [...prev, {model: selectedModels[0], user: prompt, ai: newResults[selectedModels[0]]}]);
    } catch (error: any) {
      console.error(error);
      setResults({ "error": `Error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
    setSelectedModels(selectedOptions);
  };


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
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
            multiple
            id="model"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200"
            value={selectedModels}
            onChange={handleModelChange}
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
            id="prompt"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 dark:text-gray-200"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
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
        <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Results:</h2>
        {loading && <p>Loading...</p>}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(results).map(([modelName, result]) => (
              <div key={modelName} className="mb-4 border rounded p-4 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">{modelName}</h3>
                <p className="text-gray-700 dark:text-gray-200">{result}</p>
              </div>
            ))}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold mb-2 text-gray-700 dark:text-gray-200">Conversation History:</h2>
          {conversationHistory.map((item, index) => (
            <div key={index} className="mb-2">
              <p className="font-bold text-gray-700 dark:text-gray-200">{item.model} - User:</p>
              <p className="text-gray-700 dark:text-gray-200">{item.user}</p>
              <p className="font-bold text-gray-700 dark:text-gray-200">AI:</p>
              <p className="text-gray-700 dark:text-gray-200">{item.ai}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
