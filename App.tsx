import React, { useState, useCallback } from 'react';
import { generateThesisSuggestions, findRelevantArticles } from './services/geminiService';
import type { ThesisSuggestionResponse, Article } from './types';
import Header from './components/Header';
import SuggestionCard from './components/SuggestionCard';
import ArticleCard from './components/ArticleCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import { BookOpenIcon, ChevronLeftIcon, SearchIcon } from './components/Icons';

type AppMode = 'topic' | 'article';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('topic');
  const [inputValue, setInputValue] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ThesisSuggestionResponse | null>(null);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setInputValue('');
    setSuggestions(null);
    setArticles(null);
    setError(null);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setArticles(null);

    try {
      if (mode === 'topic') {
        const result = await generateThesisSuggestions(inputValue);
        setSuggestions(result);
      } else {
        const result = await findRelevantArticles(inputValue);
        setArticles(result);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`خطا در دریافت اطلاعات: ${err.message}. لطفا اتصال اینترنت خود را بررسی کرده و مجددا تلاش کنید.`);
      } else {
        setError('یک خطای ناشناخته رخ داد.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, mode]);
  
  const placeholders = {
    topic: "رشته تحصیلی خود را وارد کنید (مثلا: مهندسی کامپیوتر)",
    article: "کلیدواژه‌ها را وارد کنید (مثلا: large language models, AI ethics)"
  };

  const buttonLabels = {
    topic: "دریافت پیشنهادها",
    article: "جستجوی مقالات"
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-4xl mx-auto flex-grow">
        
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
            <button
              onClick={() => handleModeChange('topic')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'topic' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              پیشنهاد موضوع
            </button>
            <button
              onClick={() => handleModeChange('article')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'article' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
            >
              جستجوی مقاله
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                {mode === 'topic' ? <BookOpenIcon /> : <SearchIcon />}
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={placeholders[mode]}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-600/30 text-lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>در حال پردازش...</span>
                </>
              ) : (
                <>
                  <span>{buttonLabels[mode]}</span>
                  <ChevronLeftIcon />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8">
          {error && <ErrorAlert message={error} />}
          {suggestions && mode === 'topic' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <SuggestionCard title="کلیدواژه‌های پیشنهادی" items={suggestions.keywords} />
              <SuggestionCard title="موضوعات پیشنهادی برای پایان‌نامه" items={suggestions.topics} />
            </div>
          )}
          {articles && mode === 'article' && (
             <div className="animate-fade-in">
                <ArticleCard articles={articles} />
            </div>
          )}
        </div>
      </main>
      <footer className="text-center text-slate-500 mt-8 text-sm">
        <p>توسعه یافته با ❤️ توسط هوش مصنوعی Gemini</p>
      </footer>
    </div>
  );
};

export default App;