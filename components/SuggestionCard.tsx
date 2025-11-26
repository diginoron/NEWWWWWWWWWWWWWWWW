
import React, { useState } from 'react';
import { LightBulbIcon, CopyIcon } from './Icons';

interface SuggestionCardProps {
  title: string;
  items: string[];
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, items }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    });
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 h-full">
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">{title}</h2>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center justify-between gap-3 text-slate-200 group bg-slate-900/30 p-2 rounded-lg hover:bg-slate-900/50 transition-colors"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-2">
                <span className="text-cyan-500 flex-shrink-0">
                <LightBulbIcon />
                </span>
                <span>{item}</span>
            </div>
            <button
                onClick={() => handleCopy(item, index)}
                className={`p-1.5 rounded transition-colors ${copiedIndex === index ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
                title="کپی کلیدواژه"
            >
                {copiedIndex === index ? (
                    <span className="text-xs font-bold">کپی شد</span>
                ) : (
                    <CopyIcon />
                )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionCard;
