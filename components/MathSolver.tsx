
import React, { useState, useRef } from 'react';
import { solveMathProblem } from '../services/gemini';
import { MathProblemResponse } from '../types';
import LatexRenderer from './LatexRenderer';
import { Loader2, Send, Camera, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

const MathSolver: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MathProblemResponse | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSolve = async () => {
    if (!input && !image) return;
    setLoading(true);
    try {
      const solution = await solveMathProblem(input, image?.split(',')[1]);
      setResult(solution);
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please check your API key and input.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-100">
        <h2 className="text-xl font-bold text-teal-800 mb-4">Giải toán thông minh</h2>
        <div className="space-y-4">
          <textarea
            className="w-full p-4 border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
            rows={4}
            placeholder="Nhập bài toán của bạn ở đây (ví dụ: Giải phương trình x^2 - 5x + 6 = 0)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <ImageIcon size={18} />
              <span>Tải ảnh đề bài</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
            
            <button
              onClick={handleSolve}
              disabled={loading || (!input && !image)}
              className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed ml-auto transition-all transform hover:scale-105 active:scale-95 shadow-md"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              <span>Giải bài</span>
            </button>
          </div>

          {image && (
            <div className="mt-4 relative inline-block">
              <img src={image} alt="Uploaded problem" className="max-h-48 rounded-lg border-2 border-teal-200" />
              <button 
                onClick={() => setImage(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                &times;
              </button>
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-teal-100 space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-teal-900 mb-2">Lời giải chi tiết</h3>
            <p className="text-slate-600 italic">{result.solution}</p>
          </div>

          <div className="space-y-4">
            {result.steps.map((step, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-50 border-l-4 border-teal-500">
                <div className="flex-shrink-0 w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">
                  {idx + 1}
                </div>
                <div className="flex-grow pt-1 overflow-x-auto text-lg">
                  {step.split(/(\$.*?\$)/g).map((part, i) => (
                    part.startsWith('$') ? (
                      <LatexRenderer key={i} content={part.slice(1, -1)} />
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-teal-50 rounded-xl border border-teal-200">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xl mb-2">
              <CheckCircle2 className="text-teal-600" />
              <span>Đáp án cuối cùng:</span>
            </div>
            <div className="text-2xl font-bold text-teal-900">
               <LatexRenderer content={result.finalAnswer} displayMode={true} />
            </div>
          </div>

          {result.relatedFormulas && result.relatedFormulas.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Công thức liên quan:</h4>
              <div className="flex flex-wrap gap-2">
                {result.relatedFormulas.map((formula, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-teal-200 rounded-full text-teal-700 shadow-sm">
                    <LatexRenderer content={formula} />
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MathSolver;
