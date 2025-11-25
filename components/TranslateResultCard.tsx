
import React, { useState } from 'react';
import { CopyIcon, ExternalLinkIcon } from './Icons';

interface TranslateResultCardProps {
  originalText: string;
  translatedText: string;
  direction: 'fa-en' | 'en-fa';
}

const TranslateResultCard: React.FC<TranslateResultCardProps> = ({ originalText, translatedText, direction }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(translatedText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const isFaToEn = direction === 'fa-en';

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 animate-fade-in space-y-6">
      <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-4 text-center">
        نتیجه ترجمه
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="space-y-2">
             <label className="text-sm text-slate-400 block font-medium">
                متن اصلی ({isFaToEn ? 'فارسی' : 'انگلیسی'})
             </label>
             <div 
                className={`w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-slate-300 min-h-[150px] whitespace-pre-wrap ${isFaToEn ? 'text-right' : 'text-left'}`}
                dir={isFaToEn ? 'rtl' : 'ltr'}
             >
                {originalText}
             </div>
        </div>

        {/* Translated */}
        <div className="space-y-2">
             <div className="flex justify-between items-center">
                <label className="text-sm text-cyan-400 block font-medium">
                    ترجمه ({isFaToEn ? 'انگلیسی' : 'فارسی'})
                </label>
                <button 
                    onClick={handleCopy}
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${isCopied ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                >
                    <CopyIcon />
                    <span>{isCopied ? 'کپی شد' : 'کپی'}</span>
                </button>
             </div>
             <div 
                className={`w-full bg-slate-900 border border-cyan-900/50 rounded-lg p-4 text-white min-h-[150px] whitespace-pre-wrap shadow-inner ${!isFaToEn ? 'text-right' : 'text-left'}`}
                dir={!isFaToEn ? 'rtl' : 'ltr'}
             >
                {translatedText}
             </div>
        </div>
      </div>

      <div className="text-center pt-6 mt-6 border-t border-slate-700">
        <p className="text-slate-300 mb-4 text-sm">
          ترجمه ماشینی ممکن است دارای خطا باشد. برای ترجمه تخصصی و ویرایش نیتیو مقالات خود از خدمات کاسپین تز استفاده کنید.
        </p>
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-2 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40"
        >
          <span>خدمات ترجمه تخصصی</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
};

export default TranslateResultCard;
