
import React, { useEffect, useRef } from 'react';

interface LatexRendererProps {
  content: string;
  displayMode?: boolean;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ content, displayMode = false }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current && (window as any).katex) {
      try {
        (window as any).katex.render(content, containerRef.current, {
          throwOnError: false,
          displayMode: displayMode,
          trust: true,
          strict: false
        });
      } catch (e) {
        console.error("KaTeX error:", e);
        containerRef.current.textContent = content;
      }
    }
  }, [content, displayMode]);

  return <span ref={containerRef} className="math-container" />;
};

export default LatexRenderer;
