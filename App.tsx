import React, { useState, useEffect, useCallback } from 'react';
import { UserInfo, GenerationStep, GenerationState } from './types';
import { STEPS_INFO } from './constants';
import { initializeGeminiChat, sendMessageStream } from './services/geminiService';
import { SKKNForm } from './components/SKKNForm';
import { DocumentPreview } from './components/DocumentPreview';
import { Button } from './components/Button';
import { Download, ChevronRight, Wand2, FileText, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    topic: '',
    subject: '',
    grade: '',
    school: '',
    textbook: ''
  });

  const [state, setState] = useState<GenerationState>({
    step: GenerationStep.INPUT_FORM,
    messages: [],
    fullDocument: '',
    isStreaming: false,
    error: null
  });

  // Handle Input Changes
  const handleUserChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
  };

  // Start the Generation Process
  const startGeneration = async () => {
    if (!process.env.API_KEY) {
      setState(prev => ({ ...prev, error: "API Key not found in environment variables." }));
      return;
    }

    try {
      setState(prev => ({ ...prev, step: GenerationStep.OUTLINE, isStreaming: true, error: null }));
      
      initializeGeminiChat(process.env.API_KEY);

      const initMessage = `Chào chuyên gia. Tôi cần viết SKKN.
      Thông tin của tôi:
      - Đề tài: ${userInfo.topic}
      - Môn học: ${userInfo.subject}
      - Khối lớp: ${userInfo.grade}
      - Trường: ${userInfo.school}
      - Bộ sách: ${userInfo.textbook}
      
      Hãy bắt đầu BƯỚC 2: Lập dàn ý chi tiết (OUTLINE) cho đề tài này.`;

      let generatedText = "";
      await sendMessageStream(initMessage, (chunk) => {
        generatedText += chunk;
        setState(prev => ({ 
          ...prev, 
          fullDocument: generatedText // Initial document is just the outline
        }));
      });

      setState(prev => ({ ...prev, isStreaming: false }));

    } catch (error: any) {
      setState(prev => ({ ...prev, isStreaming: false, error: error.message || "Failed to generate." }));
    }
  };

  // Generate Next Section
  const generateNextSection = async () => {
    const nextStepMap: Record<number, { prompt: string, nextStep: GenerationStep }> = {
      [GenerationStep.OUTLINE]: {
        prompt: "Dàn ý rất tốt. Hãy tiếp tục BƯỚC 3: Viết chi tiết PHẦN I (Đặt vấn đề) và PHẦN II (Cơ sở lý luận). Viết sâu sắc, học thuật, đúng cấu trúc đã đề ra.",
        nextStep: GenerationStep.PART_I_II
      },
      [GenerationStep.PART_I_II]: {
        prompt: "Tiếp tục BƯỚC 3 (tiếp): Viết chi tiết PHẦN III (Thực trạng vấn đề). Nhớ tạo bảng số liệu khảo sát giả định logic và phân tích kỹ.",
        nextStep: GenerationStep.PART_III
      },
      [GenerationStep.PART_III]: {
        prompt: "Tiếp tục BƯỚC 3 (tiếp): Viết chi tiết PHẦN IV (Các giải pháp). Hãy viết kỹ GIẢI PHÁP 1 (Giải pháp trọng tâm nhất) kèm ví dụ minh họa và giáo án.",
        nextStep: GenerationStep.PART_IV_SOL1
      },
      [GenerationStep.PART_IV_SOL1]: {
        prompt: "Tiếp tục viết chi tiết GIẢI PHÁP 2 và các giải pháp còn lại của PHẦN IV.",
        nextStep: GenerationStep.PART_IV_SOL2
      },
      [GenerationStep.PART_IV_SOL2]: {
        prompt: "Tiếp tục viết PHẦN V (Hiệu quả), PHẦN VI (Kết luận & Khuyến nghị) và PHỤ LỤC (Tài liệu tham khảo, mẫu phiếu).",
        nextStep: GenerationStep.PART_V_VI
      },
      [GenerationStep.PART_V_VI]: {
        prompt: "", // Should not happen
        nextStep: GenerationStep.COMPLETED
      }
    };

    const currentAction = nextStepMap[state.step];
    if (!currentAction) return;

    setState(prev => ({ ...prev, isStreaming: true, error: null, step: currentAction.nextStep }));

    try {
      let sectionText = "\n\n---\n\n"; // Separator
      await sendMessageStream(currentAction.prompt, (chunk) => {
        sectionText += chunk;
        setState(prev => ({ 
          ...prev, 
          fullDocument: prev.fullDocument + chunk 
        }));
      });
      
      // If we just finished the last part, move to completed
      if (currentAction.nextStep === GenerationStep.PART_V_VI) {
         setState(prev => ({ ...prev, step: GenerationStep.COMPLETED, isStreaming: false }));
      } else {
         setState(prev => ({ ...prev, isStreaming: false }));
      }

    } catch (error: any) {
      setState(prev => ({ ...prev, isStreaming: false, error: error.message }));
    }
  };

  // Export to Word
  const exportToWord = () => {
    // @ts-ignore
    if (typeof marked === 'undefined') {
        alert("Library not loaded correctly. Please refresh.");
        return;
    }

    // @ts-ignore
    const htmlContent = marked.parse(state.fullDocument);
    
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Export HTML To Doc</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 14pt; line-height: 1.5; }
      h1 { font-size: 24pt; font-weight: bold; text-align: center; }
      h2 { font-size: 18pt; font-weight: bold; margin-top: 20px; }
      h3 { font-size: 16pt; font-weight: bold; margin-top: 15px; }
      p { margin-bottom: 10px; text-align: justify; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      th, td { border: 1px solid black; padding: 8px; }
    </style>
    </head><body>`;
    const postHtml = "</body></html>";
    const html = preHtml + htmlContent + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `SKKN_${userInfo.topic.substring(0, 30)}.doc`; // .doc works better with simple HTML wrap than .docx
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Logic
  const renderSidebar = () => {
    return (
      <div className="w-full lg:w-80 bg-white border-r border-gray-200 p-6 flex-shrink-0 flex flex-col h-full overflow-y-auto">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-teal-700 flex items-center gap-2">
                <Wand2 className="h-6 w-6"/>
                SKKN Master AI
            </h1>
            <p className="text-xs text-gray-500 mt-1">Trợ lý viết sáng kiến kinh nghiệm</p>
        </div>

        {/* Progress Stepper */}
        <div className="space-y-6">
          {Object.entries(STEPS_INFO).map(([key, info]) => {
            const stepNum = parseInt(key);
            if (stepNum > 7) return null; // Don't show completed logic step
            
            let statusColor = "text-gray-400 border-gray-200";
            let icon = <div className="w-2 h-2 rounded-full bg-gray-300" />;
            
            if (state.step === stepNum && state.isStreaming) {
                statusColor = "text-teal-600 border-teal-600 bg-teal-50";
                icon = <div className="w-2 h-2 rounded-full bg-teal-500 animate-ping" />;
            } else if (state.step > stepNum) {
                statusColor = "text-teal-800 border-teal-200";
                icon = <CheckCircle className="w-4 h-4 text-teal-600" />;
            } else if (state.step === stepNum) {
                statusColor = "text-teal-600 border-teal-600 font-bold";
                icon = <div className="w-2 h-2 rounded-full bg-teal-600" />;
            }

            return (
              <div key={key} className={`flex items-start pl-4 border-l-2 ${statusColor.includes('border-teal') ? 'border-teal-500' : 'border-gray-200'} py-1 transition-all`}>
                <div className="flex-1">
                    <h4 className={`text-sm ${statusColor.includes('text-teal') ? 'text-teal-900' : 'text-gray-500'} font-medium`}>{info.label}</h4>
                    <p className="text-xs text-gray-400">{info.description}</p>
                </div>
                <div className="ml-2 mt-1">
                    {icon}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-100">
           {state.step > GenerationStep.INPUT_FORM && (
             <div className="space-y-3">
               <div className="p-3 bg-gray-50 rounded text-xs text-gray-500">
                  <span className="font-bold block text-gray-700">Đề tài:</span>
                  {userInfo.topic}
               </div>
               
               {/* Controls */}
               {state.isStreaming ? (
                 <Button disabled className="w-full" isLoading>Đang viết...</Button>
               ) : (
                 state.step < GenerationStep.COMPLETED && (
                   <Button onClick={generateNextSection} className="w-full" icon={<ChevronRight size={16}/>}>
                     Viết phần tiếp theo
                   </Button>
                 )
               )}

               {(state.step >= GenerationStep.OUTLINE) && (
                 <Button variant="secondary" onClick={exportToWord} className="w-full" icon={<Download size={16}/>}>
                   Xuất file Word
                 </Button>
               )}
             </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar (Desktop) */}
      <div className="hidden lg:block h-screen sticky top-0">
        {renderSidebar()}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 flex flex-col h-screen overflow-hidden">
        
        {/* Mobile Header */}
        <div className="lg:hidden mb-4 bg-white p-4 rounded-lg shadow flex justify-between items-center">
            <h1 className="font-bold text-teal-700">SKKN Master AI</h1>
            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full">
                {STEPS_INFO[state.step < 8 ? state.step : 7].label}
            </span>
        </div>

        {state.error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 border border-red-200">
                Lỗi: {state.error}
            </div>
        )}

        {state.step === GenerationStep.INPUT_FORM ? (
            <div className="flex-1 flex items-center justify-center overflow-y-auto">
                <SKKNForm 
                    userInfo={userInfo} 
                    onChange={handleUserChange} 
                    onSubmit={startGeneration}
                    isSubmitting={state.isStreaming}
                />
            </div>
        ) : (
            <div className="flex-1 flex flex-col min-h-0 relative">
                 <DocumentPreview content={state.fullDocument} />
                 
                 {/* Mobile Controls Floating */}
                 <div className="lg:hidden absolute bottom-4 left-4 right-4 flex gap-2 shadow-lg">
                    {!state.isStreaming && state.step < GenerationStep.COMPLETED && (
                        <Button onClick={generateNextSection} className="flex-1 shadow-xl">
                            Viết tiếp
                        </Button>
                    )}
                    <Button onClick={exportToWord} variant="secondary" className="bg-white shadow-xl">
                        <Download size={20}/>
                    </Button>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default App;