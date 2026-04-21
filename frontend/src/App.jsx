import React, { useState } from 'react';
import { Search, Loader2, Download, Copy, CheckCircle2, Mail, Globe, Shield, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes) {
  return twMerge(clsx(classes));
}

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function App() {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [progress, setProgress] = useState(null);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const startScraping = async (e) => {
    e.preventDefault();
    if (!url) return;
    
    setIsScraping(true);
    setProgress({ status: 'started', message: 'Initializing connection...' });
    setEmails([]);
    setError(null);
    
    const clientId = Math.random().toString(36).substring(7);
    
    const sse = new window.EventSource(`https://email-scraper-a306.onrender.com/api/scrape/progress?clientId=${clientId}`);
    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    };
    sse.onerror = () => {
      sse.close();
    };

    try {
      const response = await fetch('https://email-scraper-a306.onrender.com/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, clientId, maxPages: 50 })
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to scrape URL');
      }
      
      setEmails(result.emails);
      setProgress({ status: 'finished', totalEmails: result.emails.length, scannedPages: result.scannedPages });
    } catch (err) {
      setError(err.message);
      setProgress(null);
    } finally {
      setIsScraping(false);
      sse.close();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," + emails.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "extracted_emails.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen mesh-gradient flex flex-col items-center py-16 px-4 selection:bg-purple-500/30 overflow-x-hidden">
      
      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 max-w-3xl w-full"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-10 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
          Email <span className="text-purple-500">Scraper</span> Pro
        </h1>

        <form onSubmit={startScraping} className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur opacity-30 group-focus-within:opacity-60 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-[#0d0d1a] rounded-2xl p-2 border border-white/10">
            <div className="pl-4 text-slate-500">
              <Globe size={20} />
            </div>
            <input
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 px-4 py-3 text-lg"
              required
            />
            <button 
              type="submit" 
              disabled={isScraping}
              className="bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 hover:scale-[1.02] active:scale-95 whitespace-nowrap"
            >
              {isScraping ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {isScraping ? 'Extracting...' : 'Scan Domain'}
            </button>
          </div>
        </form>
      </motion.header>

      {/* Main Content */}
      <main className="w-full max-w-4xl space-y-8">
        
        <AnimatePresence mode="wait">
          {(progress || error) && (
            <motion.div 
              {...fadeIn}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {progress && (
                <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Shield size={12} className="text-purple-500" /> System Status
                    </h3>
                    {isScraping && <div className="flex gap-1"><div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse" /><div className="w-1 h-1 rounded-full bg-purple-500 animate-pulse delay-75" /></div>}
                  </div>
                  
                  <div className="text-xs text-slate-300">
                    {progress.status === 'started' && <p>{progress.message}</p>}
                    {progress.status === 'scraping' && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${(progress.pagesScanned / (progress.maxPages || 20)) * 100}%` }}
                          />
                        </div>
                        <span className="font-mono opacity-50 whitespace-nowrap">{progress.pagesScanned} / {progress.maxPages || 20}</span>
                      </div>
                    )}
                    {progress.status === 'finished' && (
                      <p className="text-green-400 font-medium">Scan Complete: {progress.totalEmails} emails found</p>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-400 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-xs font-mono truncate">{error}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {emails.length > 0 ? (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="glass-card rounded-[2rem] overflow-hidden flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Mail className="text-purple-500" size={20} />
                  Extracted Results
                </h2>
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-2 text-xs bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl transition-all font-bold shadow-lg shadow-purple-600/20 active:scale-95"
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>

              <div className="p-4 md:p-6">
                <motion.div 
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar"
                >
                  {emails.map((email, idx) => (
                    <motion.div 
                      key={idx}
                      variants={fadeIn}
                      className="group flex justify-between items-center px-4 py-3 bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-purple-500/30 rounded-xl transition-all duration-300"
                    >
                      <a href={`mailto:${email}`} className="text-slate-300 text-sm group-hover:text-white transition-colors truncate font-medium">
                        {email}
                      </a>
                      <button 
                        onClick={() => copyToClipboard(email)}
                        className="p-1.5 text-slate-500 hover:text-purple-400 rounded-lg hover:bg-purple-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        {copiedId === email ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ) : (
            !isScraping && !error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-20 flex flex-col items-center justify-center text-slate-600 glass-card rounded-[2rem] border-dashed border-white/5"
              >
                <Mail size={40} className="mb-4 opacity-10" />
                <p className="text-sm font-light">No data extracted yet.</p>
              </motion.div>
            )
          )}
        </AnimatePresence>

      </main>

      <footer className="mt-auto py-10 text-slate-600 text-[10px] font-mono tracking-widest text-center">
        <p>&copy; 2024 EMAIL SCRAPER PRO</p>
      </footer>
    </div>
  );
}

export default App;
