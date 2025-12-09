
import React from 'react';
import type { LiteratureReviewResponse } from '../types';
import { BookOpenIcon, CopyIcon, ExternalLinkIcon } from './Icons';

interface LiteratureReviewCardProps {
  data: LiteratureReviewResponse;
}

const LiteratureReviewCard: React.FC<LiteratureReviewCardProps> = ({ data }) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-slate-700 space-y-8 animate-fade-in">
      <h2 className="text-2xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-6">
        پیشینه پژوهش پیشنهادی (Civilica)
      </h2>

      <div className="space-y-6">
        {data.items.map((item, index) => (
          <div key={index} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-colors">
            <div className="flex items-start gap-3">
              <span className="text-cyan-500 mt-1 flex-shrink-0">
                <BookOpenIcon />
              </span>
              <div className="flex-grow">
                 <p className="text-slate-200 leading-8 text-justify">
                   {item.paragraph}
                 </p>
                 <div className="mt-3 pt-3 border-t border-slate-700/50 flex justify-between items-center">
                    <span className="text-xs text-slate-500">شماره {index + 1}</span>
                    <button 
                        onClick={() => handleCopy(item.paragraph)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                        <CopyIcon /> کپی متن
                    </button>
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2">
            منابع (APA)
            <button 
                onClick={() => handleCopy(data.items.map(i => i.reference).join('\n'))}
                className="text-xs font-normal text-slate-400 hover:text-white bg-slate-800 px-2 py-1 rounded transition-colors"
            >
                کپی همه منابع
            </button>
        </h3>
        <ul className="space-y-4 text-sm text-slate-300" dir="ltr">
            {data.items.map((item, index) => (
                <li key={index} className="pl-4 border-l-2 border-slate-700 text-right" dir="rtl">
                    {item.reference}
                </li>
            ))}
        </ul>
      </div>
      
      <div className="text-center pt-4">
        <p className="text-slate-300 mb-4">
            برای دانلود اصل مقالات به وب‌سایت سیویلیکا مراجعه کنید یا برای انجام فصل دوم پایان‌نامه از خدمات کاسپین تز استفاده نمایید.
        </p>
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-lg"
        >
          <span>مشاوره انجام فصل دوم پایان نامه</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
};

export default LiteratureReviewCard;
