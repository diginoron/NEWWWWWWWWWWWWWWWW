import React from 'react';
import { LightBulbIcon, CopyIcon, LanguageIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

export type TopicItem = {
  persian: string;
  english?: string;
  isTranslating: boolean;
  isCopied: boolean;
};

interface TopicSuggestionCardProps {
  title: string;
  topics: TopicItem[];
  onCopy: (index: number) => void;
  onTranslate: (index: number) => void;
}

const TopicSuggestionCard: React.FC<TopicSuggestionCardProps> = ({ title, topics, onCopy, onTranslate }) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 h-full">
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">{title}</h2>
      <ul className="space-y-4">
        {topics.map((topic, index) => (
          <li
            key={index}
            className="flex flex-col gap-3 text-slate-200 border-b border-slate-700 pb-4 last:border-b-0 last:pb-0"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start gap-3">
                <span className="text-cyan-500 mt-1 flex-shrink-0">
                    <LightBulbIcon />
                </span>
                <div className="flex-grow">
                    <p className="font-semibold">{topic.persian}</p>
                    {topic.isTranslating && (
                        <p className="text-sm text-amber-400 mt-2 flex items-center gap-2">
                           <LoadingSpinner />
                           <span>در حال ترجمه...</span>
                        </p>
                    )}
                    {topic.english && (
                        <p dir="ltr" className="text-sm text-slate-400 mt-2 p-2 bg-slate-900/50 rounded-md border border-slate-600 font-mono">
                            {topic.english}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 pr-9">
                 <button
                    onClick={() => onCopy(index)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors duration-200 ${
                        topic.isCopied 
                        ? 'bg-green-600 text-white' 
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                >
                    <CopyIcon />
                    <span>{topic.isCopied ? 'کپی شد!' : 'کپی'}</span>
                </button>
                 <button
                    onClick={() => onTranslate(index)}
                    disabled={!!topic.english || topic.isTranslating}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors duration-200 bg-slate-700 hover:bg-slate-600 text-slate-300 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                    <LanguageIcon />
                    <span>ترجمه به انگلیسی</span>
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopicSuggestionCard;
