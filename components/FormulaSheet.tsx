
import React, { useState } from 'react';
import LatexRenderer from './LatexRenderer';
import { Search, BookOpen } from 'lucide-react';

const FORMULAS = [
  {
    category: 'Đại số',
    items: [
      { name: 'Hằng đẳng thức đáng nhớ', formula: '(a+b)^2 = a^2 + 2ab + b^2' },
      { name: 'Công thức nghiệm PT bậc 2', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
      { name: 'Logarit cơ bản', formula: '\\log_a(bc) = \\log_ab + \\log_ac' }
    ]
  },
  {
    category: 'Lượng giác',
    items: [
      { name: 'Hệ thức Pythagore', formula: '\\sin^2x + \\cos^2x = 1' },
      { name: 'Công thức cộng', formula: '\\sin(a+b) = \\sin a\\cos b + \\cos a \\sin b' },
      { name: 'Công thức nhân đôi', formula: '\\cos 2x = 2\\cos^2x - 1' }
    ]
  },
  {
    category: 'Giải tích',
    items: [
      { name: 'Đạo hàm x^n', formula: '(x^n)\' = n \\cdot x^{n-1}' },
      { name: 'Nguyên hàm cơ bản', formula: '\\int x^n dx = \\frac{x^{n+1}}{n+1} + C' },
      { name: 'Giới hạn vô cực', formula: '\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1' }
    ]
  }
];

const FormulaSheet: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFormulas = FORMULAS.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.formula.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Search className="text-teal-400" size={20} />
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm công thức (ví dụ: đạo hàm, logarit...)"
          className="w-full pl-12 pr-4 py-4 bg-white border border-teal-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-lg transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFormulas.map((cat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-teal-50 flex flex-col">
            <div className="flex items-center gap-2 mb-4 text-teal-800">
              <BookOpen size={20} />
              <h3 className="font-bold text-lg uppercase tracking-wider">{cat.category}</h3>
            </div>
            <div className="space-y-4 flex-grow">
              {cat.items.map((item, i) => (
                <div key={i} className="p-4 bg-teal-50/50 rounded-xl hover:bg-teal-50 transition-colors group border border-transparent hover:border-teal-100">
                  <p className="text-sm text-teal-600 font-bold mb-2">{item.name}</p>
                  <div className="text-center bg-white py-3 px-2 rounded-lg shadow-inner overflow-x-auto overflow-y-hidden">
                    <LatexRenderer content={item.formula} displayMode={true} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FormulaSheet;
