import React, { useState } from 'react';
import { generatePixelSkin } from '../services/geminiService';
import { PugSkin } from '../types';

interface SkinCreatorProps {
  onSkinCreated: (skin: PugSkin) => void;
  onCancel: () => void;
}

export const SkinCreator: React.FC<SkinCreatorProps> = ({ onSkinCreated, onCancel }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const base64Image = await generatePixelSkin(prompt);
      const newSkin: PugSkin = {
        id: Date.now().toString(),
        name: prompt.length > 20 ? prompt.substring(0, 20) + '...' : prompt,
        imageUrl: base64Image
      };
      onSkinCreated(newSkin);
    } catch (err) {
      setError("Failed to generate skin. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-[#2E7D32] border-4 border-[#1B5E20] p-8 rounded-lg shadow-2xl text-center">
      <h2 className="text-3xl text-[#FFEB3B] mb-6 pixel-text drop-shadow-md">DESIGN A TEA PARTY PUG</h2>
      
      <div className="mb-8">
        <p className="text-[#E8F5E9] mb-4 leading-relaxed font-bold">
          The guests are arriving! Describe a fancy pug for Gemini AI to paint.
        </p>
        <div className="bg-[#1B5E20] p-4 rounded border-2 border-dashed border-[#81C784] inline-block">
          <p className="text-xs text-[#A5D6A7] mb-2">Inspiration:</p>
          <ul className="text-xs text-[#FFF9C4] text-left space-y-2 font-mono">
            <li>"A posh pug sipping tea in a garden"</li>
            <li>"A pug wearing a giant floral bonnet"</li>
            <li>"A pug dressed as a little bumblebee"</li>
            <li>"A royal pug with a crown and teacup"</li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. A pug in a tuxedo holding a croissant..."
            className="w-full bg-[#1B5E20] text-white border-2 border-[#81C784] focus:border-[#FFEB3B] rounded-lg py-4 px-4 text-lg outline-none transition-colors placeholder-[#66BB6A]"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 bg-[#558B2F] hover:bg-[#33691E] text-white font-bold rounded border-b-4 border-[#1B5E20] active:border-b-0 active:mt-1 transition-all"
          >
            CANCEL
          </button>
          
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className={`px-8 py-3 font-bold rounded border-b-4 active:border-b-0 active:mt-1 transition-all flex items-center gap-2 ${
              loading 
                ? 'bg-[#F9A825] border-[#F57F17] text-gray-800 cursor-not-allowed' 
                : 'bg-[#FFEB3B] hover:bg-[#FDD835] text-black border-[#FBC02D]'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PAINTING...
              </>
            ) : (
              'GENERATE!'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};