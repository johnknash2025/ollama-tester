"use client";

import { generateText } from '@/lib/ollama';
import { useState } from 'react';

export default function Home() {
  const [model, setModel] = useState('llama2');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await generateText(model, prompt);
      setResult(data);
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
            <option value="llama2">llama2</option>
            <option value="codellama">codellama</option>
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
