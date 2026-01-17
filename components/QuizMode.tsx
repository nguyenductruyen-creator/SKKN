
import React, { useState } from 'react';
import { generateQuiz } from '../services/gemini';
import { QuizQuestion } from '../types';
import LatexRenderer from './LatexRenderer';
import { Loader2, Brain, ChevronRight, RefreshCw, Trophy } from 'lucide-react';

const QuizMode: React.FC = () => {
  const [topic, setTopic] = useState('Đại số 10');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const startQuiz = async () => {
    setLoading(true);
    setFinished(false);
    setCurrentIdx(0);
    setScore(0);
    setSelectedOption(null);
    setShowExplanation(false);
    try {
      const q = await generateQuiz(topic);
      setQuestions(q);
    } catch (e) {
      alert("Could not generate quiz. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    setShowExplanation(true);
    if (option === questions[currentIdx].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(i => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  };

  const topics = ['Hàm số', 'Đạo hàm', 'Tích phân', 'Hình học không gian', 'Số phức', 'Xác suất'];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 className="animate-spin text-teal-600 mb-4" size={48} />
        <p className="text-teal-800 font-medium">Đang tạo bộ câu hỏi thông minh...</p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-xl text-center border-t-8 border-teal-500">
        <div className="mb-6 flex justify-center">
          <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center">
            <Trophy className="text-teal-600" size={48} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Hoàn thành!</h2>
        <p className="text-slate-500 mb-6 text-lg">Điểm số của bạn:</p>
        <div className="text-6xl font-black text-teal-600 mb-8">{score}/{questions.length}</div>
        <button 
          onClick={startQuiz}
          className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg"
        >
          Làm lại Quiz mới
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-sm border border-teal-100">
        <div className="text-center mb-8">
          <Brain size={48} className="mx-auto text-teal-600 mb-4" />
          <h2 className="text-2xl font-bold text-teal-900">Luyện tập Toán học</h2>
          <p className="text-slate-500">Chọn chủ đề và bắt đầu rèn luyện tư duy</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`p-3 rounded-lg border-2 transition-all ${topic === t ? 'border-teal-500 bg-teal-50 text-teal-700 font-bold' : 'border-slate-100 text-slate-600 hover:border-teal-200'}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
            <input 
                type="text" 
                placeholder="Hoặc nhập chủ đề tự chọn..."
                className="flex-grow p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
            />
            <button 
                onClick={startQuiz}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-all flex items-center gap-2"
            >
                <RefreshCw size={18} />
                Bắt đầu
            </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="bg-teal-100 text-teal-800 px-4 py-1 rounded-full font-bold">
          Câu hỏi {currentIdx + 1}/{questions.length}
        </div>
        <div className="text-slate-500 font-medium">Chủ đề: {topic}</div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-50 border-t-8 border-teal-500">
        <h3 className="text-xl font-medium text-slate-800 mb-8 leading-relaxed">
           {q.question.split(/(\$.*?\$)/g).map((part, i) => (
              part.startsWith('$') ? <LatexRenderer key={i} content={part.slice(1, -1)} /> : <span key={i}>{part}</span>
           ))}
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {q.options.map((opt, idx) => {
            const isCorrect = opt === q.correctAnswer;
            const isSelected = opt === selectedOption;
            let btnClass = "p-4 border-2 rounded-2xl text-left transition-all text-lg flex items-center gap-3 ";
            
            if (showExplanation) {
              if (isCorrect) btnClass += "border-green-500 bg-green-50 text-green-700 font-bold";
              else if (isSelected) btnClass += "border-red-500 bg-red-50 text-red-700";
              else btnClass += "border-slate-100 opacity-50";
            } else {
              btnClass += "border-slate-100 hover:border-teal-200 hover:bg-teal-50 text-slate-700";
            }

            return (
              <button key={idx} onClick={() => handleAnswer(opt)} className={btnClass} disabled={showExplanation}>
                <span className="w-8 h-8 flex-shrink-0 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                    {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-grow">
                    {opt.split(/(\$.*?\$)/g).map((part, i) => (
                        part.startsWith('$') ? <LatexRenderer key={i} content={part.slice(1, -1)} /> : <span key={i}>{part}</span>
                    ))}
                </span>
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-l-4 border-teal-500 animate-slideUp">
            <h4 className="font-bold text-teal-800 mb-2">Giải thích:</h4>
            <p className="text-slate-600 leading-relaxed">
               {q.explanation.split(/(\$.*?\$)/g).map((part, i) => (
                    part.startsWith('$') ? <LatexRenderer key={i} content={part.slice(1, -1)} /> : <span key={i}>{part}</span>
                ))}
            </p>
            <button 
              onClick={nextQuestion}
              className="mt-6 flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 ml-auto font-bold transition-all shadow-md"
            >
              Tiếp tục
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizMode;
