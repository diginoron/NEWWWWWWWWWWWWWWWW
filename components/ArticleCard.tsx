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
      <p className="text-sm text-slate-400 -mt-4 mb-6">برای دریافت مقالات علمی و مشابه روی عنوان مقالات کلیک کنید.</p>
      <div className="space-y-6">
        {articles.map((article, index) => (
          <div 
            key={index} 
            dir="ltr" 
            className="border-b border-slate-700 pb-6 last:border-b-0 last:pb-0 text-left"
          >
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
            <div className="text-sm text-slate-400 mt-2 flex items-center gap-4 flex-wrap">
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
      <div className="text-center pt-6 mt-6 border-t border-slate-700">
        <p className="text-slate-300 mb-4">
          برای دریافت موضوعات تخصصی و علمی و قابل اجرا از مشاوران کاسپین تز بهره مند شوید.
        </p>
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-lg"
        >
          دریافت مشاوره تخصصی
        </a>
      </div>
    </div>
  );
};

export default ArticleCard;