
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { streamDesignGeneration, enhancePrompt, generateProjectTitle } from '../services/geminiService';
import { Design, User, DesignType, UploadedImage } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import PptxGenJS from 'pptxgenjs';

interface EditorProps {
  user: User;
  design?: Design | null; // null for new design
  initialType?: DesignType;
  onBack: () => void;
}

const Toast: React.FC<{ message: string; type: 'success' | 'error' | 'info'; onClose: () => void }> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };

    return (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-white shadow-2xl flex items-center gap-3 z-[100] animate-in slide-in-from-top-4 fade-in duration-300 ${bgColors[type]}`}>
            <i className={`ph ${type === 'success' ? 'ph-check-circle' : type === 'error' ? 'ph-warning-circle' : 'ph-info'}`}></i>
            <span className="font-medium text-sm">{message}</span>
        </div>
    );
};

// Share Modal Component
const ShareModal: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Share Design</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <i className="ph ph-x text-xl"></i>
                    </button>
                </div>
                <p className="text-zinc-400 text-sm mb-6">Share your masterpiece with the world.</p>
                <div className="relative">
                    <input 
                        readOnly 
                        value={url} 
                        className="w-full bg-background border border-white/10 rounded-xl py-3 pl-4 pr-24 text-sm text-zinc-300 focus:outline-none"
                    />
                    <button 
                        onClick={handleCopy}
                        className="absolute right-1 top-1 bottom-1 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-all"
                    >
                        {copied ? 'Copied!' : 'Copy Link'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export const Editor: React.FC<EditorProps> = ({ user, design, initialType = 'OTHER', onBack }) => {
  const [prompt, setPrompt] = useState(design?.prompt || '');
  
  // RAW CODE: Contains [[USER_IMG_ID]] placeholders. Lightweight. Sent to AI.
  const rawCodeRef = useRef(design?.content || '');
  // GENERATED CODE: Contains full Base64 images. Heavy. Displayed to User.
  const [generatedCode, setGeneratedCode] = useState(design?.content || '');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false); 
  const [currentType, setCurrentType] = useState<DesignType>(design?.type || initialType);
  const [pageCount, setPageCount] = useState<number>(1);
  const [title, setTitle] = useState(design?.title || 'Untitled Design');
  const [showCode, setShowCode] = useState(false);
  
  // MULTI-IMAGE STATE
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const [isEditable, setIsEditable] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [imgProgress, setImgProgress] = useState(100);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);

  const previewRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hasStartedStreamingRef = useRef(false);

  const isInvitationInputMode = currentType === 'INVITATION' && !generatedCode && !isGenerating;

  // INITIALIZATION
  useEffect(() => {
      if (!design) { 
          // Defaults for new designs
          switch (currentType) {
              case 'CV': setPageCount(1); break;
              case 'BROCHURE': setPageCount(4); break;
              case 'SALEKIT': setPageCount(8); break;
              case 'SLIDE': setPageCount(8); break;
              case 'PITCH': setPageCount(10); break;
              case 'INVITATION': setPageCount(2); break; 
              default: setPageCount(1); break;
          }
      } else {
          // RESTORE ASSETS IF OPENING EXISTING DESIGN
          // Critical for "Missing images on reload" fix
          if (design.assets && design.assets.length > 0) {
              setUploadedImages(design.assets);
          }
      }
  }, [currentType, design]);

  // Mobile Drawer Logic
  useEffect(() => {
      if (window.innerWidth < 768) setIsDrawerOpen(false);
  }, []);

  // Helper: Swaps [[ID]] with Base64 for Display
  const replacePlaceholders = (rawHTML: string) => {
      if (!rawHTML) return '';
      let processed = rawHTML;
      uploadedImages.forEach(img => {
          // Robust replacement that handles multiple occurrences
          const idPattern = `[[${img.id}]]`;
          while (processed.includes(idPattern)) {
            processed = processed.replace(idPattern, img.data);
          }
      });
      return processed;
  };

  // IMMEDIATE IMAGE RESTORATION ON LOAD
  useEffect(() => {
      if (uploadedImages.length > 0 && rawCodeRef.current && rawCodeRef.current.includes('[[USER_IMG')) {
          const displayHTML = replacePlaceholders(rawCodeRef.current);
          if (displayHTML !== generatedCode) {
              setGeneratedCode(displayHTML);
          }
      }
  }, [uploadedImages]);

  // GAMMA-STYLE SCROLL
  useEffect(() => {
    if (isGenerating && isFocusMode && autoScroll && scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const smoothScroll = () => {
            if (!container) return;
            const paddingBottom = window.innerHeight * 0.9;
            const contentHeight = container.scrollHeight - paddingBottom;
            const targetScrollTop = contentHeight - (window.innerHeight * 0.5);
            container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
        };
        requestAnimationFrame(smoothScroll);
    }
  }, [generatedCode, isGenerating, isFocusMode, autoScroll]);

  // Image Loading Check
  useEffect(() => {
    if (isEditable) return;
    if (!generatedCode || !previewRef.current) return;

    const checkImageLoading = () => {
        const container = previewRef.current;
        if (!container) return;
        const imgs = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
        if (imgs.length === 0) { setImgProgress(100); return; }
        const loadedCount = imgs.filter(img => img.complete).length;
        const percent = Math.round((loadedCount / imgs.length) * 100);
        setImgProgress(percent);
    };
    const interval = setInterval(checkImageLoading, 1000);
    checkImageLoading(); 
    return () => clearInterval(interval);
  }, [generatedCode, isEditable]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => setToast({ msg, type });
  const isLandscape = currentType === 'SLIDE' || currentType === 'PITCH';
  
  const getRecommendedFormat = () => {
      if (isLandscape) return { fmt: 'pptx' as const, label: 'Export PPTX', icon: 'ph-presentation' };
      return { fmt: 'pdf' as const, label: 'Export PDF', icon: 'ph-file-pdf' };
  };

  const handleEnhancePrompt = async () => {
      if (!prompt.trim()) return;
      setIsEnhancing(true);
      const enhanced = await enhancePrompt(prompt);
      setPrompt(enhanced);
      setIsEnhancing(false);
      showToast("Prompt enhanced by AI", "success");
  };

  const toggleEditMode = () => {
      if (isEditable) {
          if (previewRef.current) {
              let updatedHTML = previewRef.current.innerHTML;
              // REVERSE ENGINEER IMAGES to placeholders
              uploadedImages.forEach(img => {
                  if (updatedHTML.includes(img.data)) {
                       updatedHTML = updatedHTML.split(img.data).join(`[[${img.id}]]`);
                  }
              });
              rawCodeRef.current = updatedHTML;
              setGeneratedCode(previewRef.current.innerHTML); 
              showToast("Visual edits saved", "success");
          }
      }
      setIsEditable(!isEditable);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          if (uploadedImages.length + files.length > 5) {
              showToast("Max 5 images allowed.", "error");
          }
          Array.from(files).forEach((file: File, i) => {
             if (uploadedImages.length + i >= 5) return; 
             if (file.size > 2 * 1024 * 1024) {
                 showToast(`Skipped ${file.name}: Too large`, "error");
                 return;
             }
             const reader = new FileReader();
             reader.onloadend = () => {
                 setUploadedImages(prev => [
                     ...prev, 
                     { id: `USER_IMG_${Date.now()}_${prev.length + 1}`, data: reader.result as string, context: 'PRODUCT', description: '' }
                 ]);
             };
             reader.readAsDataURL(file);
          });
          showToast("Images uploaded successfully", "success");
      }
      e.target.value = '';
  };

  const removeImage = (id: string) => setUploadedImages(prev => prev.filter(img => img.id !== id));
  const updateImageContext = (id: string, context: 'LOGO' | 'PRODUCT' | 'STYLE') => setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, context } : img));
  const updateImageDescription = (id: string, description: string) => setUploadedImages(prev => prev.map(img => img.id === id ? { ...img, description } : img));

  const startGeneration = async () => {
      if (!prompt.trim() && uploadedImages.length === 0) {
          showToast("Please enter a prompt", "error");
          return;
      }
      
      if (title === 'Untitled Design' && prompt.trim()) {
           generateProjectTitle(prompt).then((newTitle) => { if (newTitle) setTitle(newTitle); });
      }

      setIsGenerating(true);
      setIsPreparing(true);
      hasStartedStreamingRef.current = false;
      if (window.innerWidth < 768) setIsDrawerOpen(false);
      
      const isUpdate = rawCodeRef.current.length > 0;
      const codeToSend = isUpdate ? rawCodeRef.current : null;
      rawCodeRef.current = ''; 
      
      try {
          await streamDesignGeneration(
              prompt, currentType, uploadedImages, codeToSend, pageCount, 
              (chunk) => {
                  if (!hasStartedStreamingRef.current) {
                      hasStartedStreamingRef.current = true;
                      setIsPreparing(false);
                      setIsFocusMode(true);
                      setAutoScroll(true);
                  }
                  rawCodeRef.current += chunk;
                  const displayHTML = replacePlaceholders(rawCodeRef.current);
                  setGeneratedCode(displayHTML);
              }
          );
          if (rawCodeRef.current) await saveDesign(rawCodeRef.current, title);
          showToast(isUpdate ? "Design updated!" : "Design generated!", "success");
      } catch (e) {
          console.error(e);
          showToast("Error generating design", "error");
          setIsPreparing(false);
      } finally {
          setIsGenerating(false);
      }
  };

  const waitForImages = async (element: HTMLElement) => {
      const imgs = Array.from(element.querySelectorAll('img'));
      await Promise.all(imgs.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
              img.onload = resolve;
              img.onerror = resolve; 
              if (!img.crossOrigin) img.crossOrigin = 'anonymous';
          });
      }));
  };

  const captureThumbnail = async (): Promise<string | undefined> => {
      if (!previewRef.current) return undefined;
      const firstPage = previewRef.current.querySelector('.print-page') as HTMLElement;
      if (!firstPage) return undefined;

      try {
          // Wait a bit for any pending renders/fonts
          await new Promise(resolve => setTimeout(resolve, 1000));

          const wrapper = document.createElement('div');
          wrapper.style.position = 'absolute';
          wrapper.style.top = '-9999px';
          wrapper.style.zIndex = '-100';
          wrapper.style.width = firstPage.style.width || (isLandscape ? '297mm' : '210mm');
          wrapper.style.height = firstPage.style.height || (isLandscape ? '168mm' : '297mm');
          wrapper.style.overflow = 'hidden';
          // Force white background for thumbnail
          wrapper.style.backgroundColor = '#ffffff'; 
          
          const clonedPage = firstPage.cloneNode(true) as HTMLElement;
          clonedPage.style.margin = '0';
          clonedPage.style.transform = 'none';
          clonedPage.style.boxShadow = 'none';
          
          wrapper.appendChild(clonedPage);
          document.body.appendChild(wrapper);

          await waitForImages(clonedPage);

          const canvas = await html2canvas(wrapper, {
              scale: 0.25, 
              useCORS: true,
              allowTaint: false,
              logging: false,
              backgroundColor: '#ffffff' // Ensure background is captured as white
          });

          document.body.removeChild(wrapper);
          return canvas.toDataURL('image/jpeg', 0.8); 
      } catch (e) {
          console.error("Thumbnail capture failed", e);
          return undefined;
      }
  };

  const saveDesign = async (content: string, designTitle: string) => {
    // Prefer raw code (clean) over content (might be base64)
    const contentToSave = rawCodeRef.current || content;
    
    let thumbnail = design?.thumbnail; 
    // Capture new thumbnail if we have content
    if (previewRef.current && generatedCode) {
        const captured = await captureThumbnail();
        if (captured) thumbnail = captured;
    }

    const designData = {
      user_id: user.id,
      prompt,
      type: currentType,
      content: contentToSave,
      title: designTitle,
      created_at: new Date().toISOString(),
      id: design?.id || crypto.randomUUID(),
      thumbnail: thumbnail,
      assets: uploadedImages // CRITICAL: Persist images
    };

    if (user.id === 'guest') {
      try {
        const localDesigns = JSON.parse(localStorage.getItem('guest_designs') || '[]');
        const existingIndex = localDesigns.findIndex((d: Design) => d.id === designData.id);
        
        let updatedDesigns;
        if (existingIndex >= 0) {
          updatedDesigns = [...localDesigns];
          updatedDesigns[existingIndex] = designData;
        } else {
          updatedDesigns = [designData, ...localDesigns];
        }
        localStorage.setItem('guest_designs', JSON.stringify(updatedDesigns));
      } catch (e) { console.error('LocalStorage save failed', e); }
      return;
    }

    // Upsert to Supabase
    const { error } = await supabase.from('designs').upsert({
         id: designData.id,
         user_id: user.id,
         prompt: designData.prompt,
         type: designData.type,
         content: designData.content,
         title: designData.title,
         thumbnail: designData.thumbnail,
         assets: designData.assets
    });
    
    if (error) console.error("Supabase Save Error:", error);
  };

  const handleManualSave = async () => {
      // Force wait for thumbnail before confirming
      showToast("Saving project...", "info");
      await saveDesign(rawCodeRef.current || generatedCode, title);
      showToast("Project saved successfully", "success");
  };

  const handleExport = async (format: 'png' | 'pdf' | 'pptx') => {
      if (imgProgress < 100) { showToast(`Wait for images (${imgProgress}%)`, 'info'); return; }
      if (!previewRef.current) return;
      showToast(`Preparing ${format.toUpperCase()} export...`, "info");
      
      const originalTitle = document.title;
      document.title = title.trim().replace(/\s+/g, '_') || 'Locaith_Design';
      if (isEditable) { toggleEditMode(); await new Promise(r => setTimeout(r, 100)); }

      const pages = previewRef.current.querySelectorAll('.print-page');
      if (pages.length === 0) { showToast("No pages to export", "error"); return; }

      try {
        await document.fonts.ready;
        const isA5 = currentType === 'INVITATION';
        let widthMm = isLandscape ? 297 : 210;
        let heightMm = isLandscape ? 168 : 297;
        if (isA5) { widthMm = 148; heightMm = 210; }
        
        let pdf: jsPDF | null = null;
        let pptx: PptxGenJS | null = null;

        if (format === 'pdf') pdf = new jsPDF({ orientation: isLandscape ? 'landscape' : 'portrait', unit: 'mm', format: isA5 ? 'a5' : 'a4' });
        else if (format === 'pptx') { pptx = new PptxGenJS(); pptx.layout = isLandscape ? 'LAYOUT_16x9' : 'LAYOUT_A4'; }

        for (let i = 0; i < pages.length; i++) {
            const originalPage = pages[i] as HTMLElement;
            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                position: 'absolute', top: '-9999px', zIndex: '-100',
                width: `${widthMm}mm`, height: `${heightMm}mm`,
                backgroundColor: '#ffffff', overflow: 'hidden'
            });
            
            const clonedPage = originalPage.cloneNode(true) as HTMLElement;
            Object.assign(clonedPage.style, {
                margin: '0', boxShadow: 'none', transform: 'none',
                border: 'none', borderRadius: '0', outline: 'none',
                backgroundColor: '#ffffff',
                marginTop: '-2px', marginLeft: '-1px', // Hide artifacts
                width: 'calc(100% + 2px)', height: 'calc(100% + 2px)'
            });
            
            wrapper.appendChild(clonedPage);
            document.body.appendChild(wrapper);
            await waitForImages(clonedPage);

            const canvas = await html2canvas(wrapper, { 
                scale: 2, useCORS: true, backgroundColor: '#ffffff', 
                allowTaint: false, logging: false, scrollX: 0, scrollY: 0,
                windowWidth: wrapper.offsetWidth, windowHeight: wrapper.offsetHeight
            });
            document.body.removeChild(wrapper);

            const imgData = canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95);

            if (format === 'pdf' && pdf) {
                if (i > 0) pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
            } else if (format === 'pptx' && pptx) {
                pptx.addSlide().addImage({ data: imgData, x: 0, y: 0, w: '100%', h: '100%' });
            } else if (format === 'png' && i === 0) {
                 const link = document.createElement('a');
                 link.download = `${document.title}_page1.png`;
                 link.href = imgData;
                 link.click();
            }
        }

        if (format === 'pdf' && pdf) pdf.save(`${document.title}.pdf`);
        else if (format === 'pptx' && pptx) await pptx.writeFile({ fileName: `${document.title}.pptx` });
        
        showToast("Export completed!", "success");
      } catch (error) {
          console.error("Export failed:", error);
          showToast("Export failed", "error");
      } finally {
          document.title = originalTitle;
      }
  };

  const cleanHTML = (html: string) => html.replace(/^```html\s*/, '').replace(/```$/, '').replace(/```html/g, '').replace(/```/g, '');
  const handleExportEnter = () => { if (exportTimerRef.current) clearTimeout(exportTimerRef.current); setIsExportOpen(true); };
  const handleExportLeave = () => { exportTimerRef.current = setTimeout(() => setIsExportOpen(false), 300); };
  const recommendedExport = getRecommendedFormat();

  if (isFocusMode) {
      return (
          <div className="h-screen w-full bg-[#0c0c0e] flex flex-col items-center relative overflow-hidden">
               {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
               <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-black pointer-events-none"></div>
               <div className="w-full max-w-6xl mx-auto px-6 py-6 flex justify-between items-center z-50 bg-[#0c0c0e]/80 backdrop-blur-md sticky top-0 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center"><i className="ph ph-magic-wand text-primary text-xl animate-pulse"></i></div>
                        <div><h2 className="text-white font-bold tracking-tight">Generating Design...</h2><p className="text-xs text-zinc-400">AI is crafting your {currentType} document</p></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setAutoScroll(!autoScroll)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all ${autoScroll ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>{autoScroll ? 'Auto-Scroll' : 'Manual'}</button>
                        {!isGenerating && <button onClick={() => setIsFocusMode(false)} className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">Edit Design</button>}
                    </div>
               </div>
               {isGenerating && <div className="absolute top-28 z-50 animate-in fade-in slide-in-from-top-4 duration-500"><div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md text-red-200 px-6 py-2 rounded-full text-xs font-semibold shadow-[0_0_15px_rgba(239,68,68,0.2)]">Do not close this tab while AI is generating...</div></div>}
               <div ref={scrollContainerRef} className="flex-1 w-full overflow-y-auto z-10 custom-scrollbar scroll-smooth pt-48">
                   <style>{`
                        .print-page {
                            width: ${isLandscape ? '297mm' : '210mm'} !important;
                            height: ${isLandscape ? '168mm' : '297mm'} !important;
                            margin-bottom: 2rem;
                            box-shadow: 0 50px 100px -20px rgba(0,0,0,0.7) !important;
                            transform: scale(1.5);
                            transform-origin: top center;
                        }
                        .print-page-wrapper {
                            display: flex; flex-col: column; align-items: center; min-height: 100%; padding-bottom: 90vh; 
                        }
                    `}</style>
                   <div className="w-full flex flex-col items-center print-page-wrapper">
                       <div dangerouslySetInnerHTML={{ __html: cleanHTML(generatedCode) }} className="flex flex-col items-center gap-8"/>
                   </div>
               </div>
          </div>
      );
  }

  if (isInvitationInputMode) {
      return (
          <div className="h-screen w-full bg-[#0c0c0e] flex flex-col items-center justify-center relative overflow-hidden p-6">
               <button onClick={onBack} className="absolute top-8 left-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-all z-20"><i className="ph ph-arrow-left text-xl"></i></button>
               <div className="max-w-2xl w-full z-10 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.3)] mb-4"><i className="ph ph-envelope-open text-4xl text-white"></i></div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4 font-serif">Design Your Invitation</h1>
                    <div className="w-full bg-surface/50 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl relative group focus-within:ring-2 focus-within:ring-rose-500/50 transition-all">
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your event..." className="w-full h-32 bg-transparent border-none outline-none p-4 text-lg text-white placeholder-zinc-500 resize-none font-medium"/>
                        <div className="flex justify-between items-center px-4 pb-2">
                             <div className="flex items-center gap-2">
                                <label className="p-2 hover:bg-white/10 rounded-lg cursor-pointer text-zinc-400 hover:text-white transition-colors"><i className="ph ph-image text-xl"></i><input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} /></label>
                                 <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || isEnhancing} className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-zinc-300 hover:text-white transition-all text-xs font-bold">{isEnhancing ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-magic-wand"></i>}<span>AI soạn</span></button>
                             </div>
                             <button onClick={startGeneration} disabled={isGenerating || !prompt.trim()} className="bg-white text-black px-6 py-2 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50">{isGenerating ? <i className="ph ph-spinner animate-spin"></i> : <i className="ph ph-sparkle text-rose-500"></i>}Create Design</button>
                        </div>
                    </div>
               </div>
          </div>
      );
  }

  return (
    <div className="h-screen flex flex-col bg-background text-white overflow-hidden relative">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {isShareOpen && <ShareModal url={`https://app.locaith.design/share/${design?.id || 'demo'}`} title={title} onClose={() => setIsShareOpen(false)} />}
      
      <header className="h-16 border-b border-white/5 bg-surface/50 backdrop-blur-md flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-2 md:gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-full text-secondary hover:text-white transition-colors group"><i className="ph ph-arrow-left text-xl"></i></button>
            <div className="flex flex-col"><input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-transparent border-none outline-none font-medium text-sm text-white focus:ring-0 placeholder-zinc-500 w-32 md:w-48 transition-all hover:bg-white/5 rounded px-2 -ml-2 truncate" /><span className="text-[10px] text-primary uppercase tracking-wider font-bold px-2 hidden md:inline">{currentType}</span></div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsDrawerOpen(!isDrawerOpen)} className="md:hidden p-2 text-zinc-300 hover:text-white bg-white/5 rounded-lg"><i className={`ph ${isDrawerOpen ? 'ph-x' : 'ph-sliders-horizontal'}`}></i></button>
            <button onClick={toggleEditMode} className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isEditable ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-white/5 text-secondary border-white/10 hover:text-white'}`}><i className={`ph ${isEditable ? 'ph-pencil-simple-slash' : 'ph-pencil-simple'}`}></i>{isEditable ? 'Editing On' : 'Visual Edit'}</button>
            <button onClick={handleManualSave} className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg transition-all active:scale-95"><i className="ph ph-floppy-disk"></i> Save</button>
            <div className="relative" onMouseEnter={handleExportEnter} onMouseLeave={handleExportLeave}>
                <div className={`flex bg-primary rounded-lg shadow-lg shadow-primary/20 overflow-hidden transition-all ${imgProgress < 100 ? 'opacity-70 cursor-wait' : 'hover:brightness-110'}`}>
                    <button onClick={() => handleExport(recommendedExport.fmt)} disabled={imgProgress < 100} className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-medium border-r border-black/10">{imgProgress < 100 ? <><i className="ph ph-spinner animate-spin"></i><span className="hidden md:inline">{imgProgress}%</span></> : <><i className={`ph ${recommendedExport.icon}`}></i><span className="hidden md:inline">{recommendedExport.label}</span></>}</button>
                    <button className="px-2 hover:bg-black/10 transition-all" onClick={() => setIsExportOpen(true)} disabled={imgProgress < 100}><i className="ph ph-caret-down"></i></button>
                </div>
                {isExportOpen && <div className="absolute right-0 top-full pt-2 w-56 z-50 animate-in fade-in slide-in-from-top-2 duration-200"><div className="bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col p-1 backdrop-blur-xl"><button onClick={() => handleExport('png')} className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"><div className="p-1.5 rounded bg-blue-500/10 text-blue-400"><i className="ph ph-image"></i></div> PNG</button><button onClick={() => handleExport('pdf')} className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"><div className="p-1.5 rounded bg-red-500/10 text-red-400"><i className="ph ph-file-pdf"></i></div> PDF</button><button onClick={() => handleExport('pptx')} className="w-full text-left px-3 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-3 transition-colors"><div className="p-1.5 rounded bg-orange-500/10 text-orange-400"><i className="ph ph-presentation"></i></div> PPTX</button></div></div>}
            </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <div className={`absolute md:relative z-30 h-full w-full md:w-96 bg-surface border-r border-white/5 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:shadow-none`}>
            <div className="md:hidden p-4 border-b border-white/5 flex justify-between items-center"><span className="font-bold text-white">Design Tools</span><button onClick={() => setIsDrawerOpen(false)} className="p-2 bg-white/5 rounded-lg"><i className="ph ph-x"></i></button></div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="mb-6">
                    <label className="flex items-center justify-between text-xs font-semibold text-secondary uppercase tracking-wider mb-3"><span>Refine Design</span>{generatedCode && <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-400">Context Aware</span>}</label>
                    <div className="relative">
                        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe changes..." className="w-full h-32 bg-background border border-white/10 rounded-xl p-4 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-primary/50 resize-none mb-2 transition-all focus:ring-1 focus:ring-primary/50"/>
                        <button onClick={handleEnhancePrompt} disabled={!prompt.trim() || isEnhancing} className="absolute bottom-4 right-4 px-3 py-1.5 bg-surface border border-white/10 rounded-lg text-xs font-bold text-zinc-300 hover:text-primary hover:border-primary/30 transition-all shadow-lg flex items-center gap-2">{isEnhancing ? <><i className="ph ph-spinner animate-spin"></i><span>...</span></> : <><i className="ph ph-magic-wand"></i><span>AI soạn</span></>}</button>
                    </div>
                </div>
                <div className="mb-6">
                    <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Total Pages</label>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-2">
                        <button onClick={() => setPageCount(Math.max(1, pageCount - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"><i className="ph ph-minus"></i></button>
                        <input type="number" value={pageCount} onChange={(e) => setPageCount(Math.min(16, Math.max(1, parseInt(e.target.value) || 1)))} className="flex-1 bg-transparent text-center text-sm font-bold text-white focus:outline-none"/>
                        <button onClick={() => setPageCount(Math.min(16, pageCount + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"><i className="ph ph-plus"></i></button>
                    </div>
                </div>
                <div className="mb-6">
                     <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Assets ({uploadedImages.length}/5)</label>
                    {uploadedImages.length > 0 && (
                        <div className="space-y-3 mb-3">
                            {uploadedImages.map((img, idx) => (
                                <div key={img.id} className="bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="flex items-start gap-3 mb-2">
                                        <img src={img.data} alt="Thumbnail" className="w-12 h-12 rounded object-cover bg-black/50" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex gap-1 flex-wrap">{(['LOGO', 'PRODUCT', 'STYLE'] as const).map(ctx => (<button key={ctx} onClick={() => updateImageContext(img.id, ctx)} className={`px-2 py-1 text-[9px] rounded font-bold transition-all ${img.context === ctx ? 'bg-primary text-white' : 'bg-white/10 text-zinc-400 hover:bg-white/20'}`}>{ctx}</button>))}</div>
                                        </div>
                                        <button onClick={() => removeImage(img.id)} className="p-1.5 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded-md transition-colors"><i className="ph ph-trash"></i></button>
                                    </div>
                                    <input type="text" placeholder="Description..." value={img.description || ''} onChange={(e) => updateImageDescription(img.id, e.target.value)} className="w-full bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-white/20"/>
                                </div>
                            ))}
                        </div>
                    )}
                    <label className={`flex flex-col items-center justify-center w-full h-24 border border-dashed rounded-xl transition-all ${uploadedImages.length >= 5 ? 'border-white/10 opacity-50 cursor-not-allowed' : 'border-white/20 cursor-pointer hover:bg-white/5 hover:border-primary/50'}`}>
                        <div className="text-center p-2"><div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-1"><i className="ph ph-plus text-lg text-secondary"></i></div><p className="text-xs text-zinc-300 font-medium">Add Images</p></div>
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    </label>
                </div>
            </div>
            <div className="p-4 border-t border-white/5 bg-surface/50">
                <button onClick={startGeneration} disabled={isGenerating} className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${isGenerating ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-purple-600 text-white hover:brightness-110 shadow-primary/25'}`}>
                    {isGenerating ? <><i className="ph ph-spinner animate-spin text-lg"></i>Refining...</> : <><i className="ph ph-magic-wand text-lg"></i>{generatedCode ? 'Update Design' : 'Generate'}</>}
                </button>
            </div>
        </div>

        <div className="flex-1 bg-[#0c0c0e] relative overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
            <div className="flex-1 overflow-hidden relative z-10">
                {generatedCode || isPreparing ? (
                    <div className="w-full h-full overflow-y-auto bg-[#0c0c0e] p-8 md:p-12 flex justify-center custom-scrollbar">
                            {isPreparing && !isFocusMode && <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"><div className="flex flex-col items-center gap-4"><div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div><p className="text-white font-medium animate-pulse">Consulting Locaith Architect...</p></div></div>}
                            <div ref={previewRef} contentEditable={isEditable} suppressContentEditableWarning={true} className={`flex flex-col gap-12 pb-32 transition-opacity duration-500 ${isEditable ? 'cursor-text ring-2 ring-green-500/20 rounded-lg p-2' : 'cursor-default'}`} dangerouslySetInnerHTML={{ __html: cleanHTML(generatedCode) }} />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-700 p-8 text-center">
                            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-surface to-background border border-white/5 flex items-center justify-center mb-6 shadow-2xl rotate-3"><i className="ph ph-paint-brush-broad text-5xl text-zinc-600"></i></div>
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to Create</h2>
                        <p className="text-zinc-500 max-w-md">Enter a prompt or upload an image to start.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
