import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast, Toaster } from "sonner";
import { 
  Sparkles, 
  Code, 
  Eye, 
  Download, 
  Copy, 
  ArrowRight, 
  Loader2, 
  Monitor,
  Smartphone,
  Check,
  ChevronLeft,
  Layout,
  Box,
  Cpu
} from "lucide-react";
import confetti from "canvas-confetti";
import { generateSiteCode, GeneratedSite } from "./services/gemini";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [site, setSite] = useState<GeneratedSite | null>(null);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [generationStep, setGenerationStep] = useState<string>("Initializing");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStep("Synthesizing Architecture");
    try {
      const generatedSite = await generateSiteCode(prompt);
      setGenerationStep("Finalizing Assets");
      setSite(generatedSite);
      confetti({
        particleCount: 50,
        spread: 30,
        origin: { y: 0.9 },
        colors: ["#000000", "#333333", "#666666"]
      });
      toast.success("Synthesis complete");
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "Synthesis failed. Please try again.";
      toast.error(errorMessage, {
        description: error.code ? `Error Code: ${error.code}` : undefined,
        duration: 5000,
      });
    } finally {
      setIsGenerating(false);
      setGenerationStep("Initializing");
    }
  };

  const getProcessedContent = (content: string) => {
    if (!site || !site.images) return content;
    let processed = content;
    site.images.forEach((img, i) => {
      processed = processed.replace(new RegExp(`{{IMAGE_${i}}}`, 'g'), img);
    });
    return processed;
  };

  const iframeContent = site ? `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            overflow-x: hidden; 
            background: #000; 
            color: #fff; 
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          #bg-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
          section { position: relative; z-index: 1; min-height: 100vh; background: transparent; }
          ${getProcessedContent(site.css)}
        </style>
      </head>
      <body>
        ${getProcessedContent(site.html)}
        
        <script id="site-js-data" type="application/json">
          ${JSON.stringify({ code: getProcessedContent(site.js) }).replace(/<\/script>/g, '<\\/script>').replace(/\$\{/g, '\\${')}
        </script>

        <script>
          (function() {
            function init() {
              try {
                const el = document.getElementById('site-js-data');
                if (!el) return;
                const data = JSON.parse(el.textContent || '{}');
                if (!data.code) return;
                const script = document.createElement('script');
                // Use strict mode and wrap in IIFE with newlines to prevent comment issues
                // Shadow common globals to prevent 'only a getter' errors if the AI uses them as variable names
                script.textContent = "(function(fetch, alert, console, window, self, globalThis) {\\n'use strict';\\n" + data.code + "\\n})(window.fetch, window.alert, window.console, window, window, window);";
                document.body.appendChild(script);
              } catch (e) {
                console.error("Initialization Error:", e);
              }
            }
            if (document.readyState === 'complete') {
              init();
            } else {
              window.addEventListener('load', init);
            }
          })();
        </script>
      </body>
    </html>
  ` : "";

  const getFullCode = () => {
    if (!site) return "";
    const processedJs = getProcessedContent(site.js);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${site.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'Inter', sans-serif; 
      margin: 0; 
      padding: 0; 
      overflow-x: hidden; 
      background: #000; 
      color: #fff; 
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    #bg-canvas { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
    section { position: relative; z-index: 1; min-height: 100vh; background: transparent; }
    ${getProcessedContent(site.css)}
  </style>
</head>
<body>
  ${getProcessedContent(site.html)}
  <script>
    (function(fetch, alert, console, window, self, globalThis) {
      'use strict';
      try {
        ${processedJs.replace(/\$\{/g, '\\${')}
      } catch (e) {
        console.error("Initialization Error:", e);
      }
    })(window.fetch, window.alert, window.console, window, window, window);
  </script>
</body>
</html>`;
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getFullCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([getFullCode()], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "index.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-white selection:text-black flex flex-col">
      <Toaster position="top-center" theme="dark" />
      {/* Studio Header */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <h1 className="text-sm font-bold tracking-[0.3em] uppercase">NanoStudio</h1>
        </div>
        
        {site && (
          <div className="flex items-center gap-8">
            <div className="flex gap-6">
              <button 
                onClick={() => setView("preview")}
                className={`text-[10px] uppercase tracking-widest transition-all ${view === "preview" ? "text-white" : "text-white/30 hover:text-white"}`}
              >
                Preview
              </button>
              <button 
                onClick={() => setView("code")}
                className={`text-[10px] uppercase tracking-widest transition-all ${view === "code" ? "text-white" : "text-white/30 hover:text-white"}`}
              >
                Source
              </button>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleDownload}
                className="bg-white text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E0E0E0] transition-all flex items-center gap-2"
              >
                <Download size={12} />
                Export
              </button>
              <button 
                onClick={() => {
                  handleDownload();
                  toast.success("Website exported successfully", {
                    description: "You can now deploy this index.html to any static hosting service like Vercel, Netlify, or GitHub Pages.",
                    duration: 6000,
                  });
                }}
                className="border border-white/20 px-6 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                Deploy
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {!site ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center px-8"
            >
              <div className="max-w-3xl w-full">
                <div className="flex items-center gap-4 mb-12 opacity-30">
                  <Box size={14} />
                  <div className="h-px flex-1 bg-white/20" />
                  <span className="text-[10px] uppercase tracking-[0.5em]">System.Init</span>
                </div>

                <motion.h2 
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] mb-16"
                >
                  <span className="shimmer-text">Synthesize <br />
                  3D Environments.</span>
                </motion.h2>

                <div className="relative group">
                  <input 
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    placeholder="Describe a digital experience..."
                    className="w-full bg-transparent border-b border-white/10 py-6 text-xl md:text-2xl focus:outline-none focus:border-white transition-all placeholder:text-white/5"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-all"
                  >
                    {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
                  </button>
                </div>

                <div className="mt-12 flex gap-8 opacity-20">
                  <div className="flex items-center gap-2">
                    <Cpu size={12} />
                    <span className="text-[9px] uppercase tracking-widest">WebGL Acceleration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layout size={12} />
                    <span className="text-[9px] uppercase tracking-widest">Clean Typography</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <button 
                  onClick={() => setSite(null)}
                  className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white flex items-center gap-2 transition-all"
                >
                  <ChevronLeft size={14} /> Reset Session
                </button>
                
                {view === "preview" && (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setViewport("desktop")}
                      className={`transition-all ${viewport === "desktop" ? "text-white" : "text-white/20 hover:text-white"}`}
                    >
                      <Monitor size={16} />
                    </button>
                    <button 
                      onClick={() => setViewport("mobile")}
                      className={`transition-all ${viewport === "mobile" ? "text-white" : "text-white/20 hover:text-white"}`}
                    >
                      <Smartphone size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-black border border-white/10 overflow-hidden relative shadow-2xl">
                {view === "preview" ? (
                  <div className={`h-full mx-auto transition-all duration-700 ${viewport === "mobile" ? "max-w-[375px] border-x border-white/5" : "max-w-full"}`}>
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[8px] uppercase tracking-[0.2em] font-bold">Live Preview</span>
                    </div>
                    <iframe 
                      srcDoc={iframeContent}
                      className="w-full h-full border-none"
                      title="Preview"
                    />
                  </div>
                ) : (
                  <div className="h-full overflow-auto p-12 font-mono text-[11px] text-white/40 leading-relaxed">
                    <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
                      <span className="uppercase tracking-[0.4em] text-[9px]">Source.Manifest</span>
                      <button 
                        onClick={handleCopyCode}
                        className="hover:text-white transition-colors uppercase tracking-widest text-[9px]"
                      >
                        {copied ? "Copied" : "Copy Source"}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap">
                      {getFullCode()}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Studio Loading Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-12"
          >
            <div className="w-full max-w-sm">
              <div className="h-px w-full bg-white/5 mb-8 relative overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-0 left-0 h-full w-1/3 bg-white"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.5em] text-white/40">{generationStep}</span>
                <span className="text-[10px] font-mono text-white/20">0.001s</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
