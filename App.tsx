
import React, { useState, useCallback } from 'react';
import { generateThesisSuggestions } from './services/geminiService';
import type { ThesisSuggestionResponse } from './types';
import Header from './components/Header';
import SuggestionCard from './components/SuggestionCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import { BookOpenIcon, ChevronLeftIcon } from './components/Icons';

const App: React.FC = () => {
  const [fieldOfStudy, setFieldOfStudy] = useState<string>('');
  const [suggestions, setSuggestions] = useState<ThesisSuggestionResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldOfStudy.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const result = await generateThesisSuggestions(fieldOfStudy);
      setSuggestions(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(`خطا در ارتباط با سرویس هوش مصنوعی: ${err.message}. لطفا از فعال بودن کلید API خود در متغیرهای محیطی Vercel (با نام API_KEY) اطمینان حاصل کنید.`);
      } else {
        setError('یک خطای ناشناخته رخ داد.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fieldOfStudy, isLoading]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-4xl mx-auto flex-grow">
        <div className="bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                <BookOpenIcon />
              </span>
              <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="رشته تحصیلی خود را وارد کنید (مثلا: مهندسی کامپیوتر)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !fieldOfStudy.trim()}
              className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-600/30 text-lg"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner />
                  <span>در حال پردازش...</span>
                </>
              ) : (
                <>
                  <span>دریافت پیشنهادها</span>
                  <ChevronLeftIcon />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8">
          {error && <ErrorAlert message={error} />}
          {suggestions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <SuggestionCard title="کلیدواژه‌های پیشنهادی" items={suggestions.keywords} />
              <SuggestionCard title="موضوعات پیشنهادی برای پایان‌نامه" items={suggestions.topics} />
            </div>
          )}
        </div>
      </main>
      <footer className="text-center text-slate-500 mt-8 text-sm">
        <p>توسعه یافته با ❤️ توسط هوش مصنوعی Gemini</p>
         <p className="mt-2">برای استفاده از این اپلیکیشن، باید کلید Gemini API خود را در متغیرهای محیطی Vercel با نام <code className="bg-slate-700 px-1 rounded">API_KEY</code> تنظیم کنید.</p>
      </footer>
    </div>
  );
};

export default App;
