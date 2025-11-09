import React from 'react';
import type { Article } from '../types';

interface ArticleCardProps {
  articles: Article[];
}

const ArticleCard: React.FC<ArticleCardProps> = ({ articles }) => {
  if (articles.length === 0) {
    return (
        <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 text-center">
            <h2 className="text-xl font-semibold text-slate-300">مقاله‌ای یافت نشد</h2>
            <p className="text-slate-400 mt-2">لطفا کلیدواژه‌های خود را تغییر داده و مجددا تلاش کنید.</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
      <h2 className="text-2xl font-semibold text-cyan-400 mb-6">مقالات پیشنهادی</h2>
      <div className="space-y-6">
        {articles.map((article, index) => (
          <div key={index} className="border-b border-slate-700 pb-6 last:border-b-0 last:pb-0">
            <h3 className="text-xl font-bold text-slate-100">
              <a 
                href={article.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-cyan-400 transition-colors duration-200"
              >
                {article.title}
              </a>
            </h3>
            <div className="text-sm text-slate-400 mt-2 flex items-center gap-4">
              <span>{article.publicationYear}</span>
              <span className="text-slate-600">|</span>
              <span>{article.authors.join(', ')}</span>
            </div>
            <p className="text-slate-300 mt-3 text-base leading-relaxed">
              {article.summary}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ArticleCard;