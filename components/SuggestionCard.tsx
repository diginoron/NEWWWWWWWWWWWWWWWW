
import React from 'react';
import { LightBulbIcon } from './Icons';

interface SuggestionCardProps {
  title: string;
  items: string[];
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({ title, items }) => {
  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 h-full">
      <h2 className="text-2xl font-semibold text-cyan-400 mb-4">{title}</h2>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-start gap-3 text-slate-200"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="text-cyan-500 mt-1 flex-shrink-0">
              <LightBulbIcon />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionCard;
