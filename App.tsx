import React, { useState, useCallback } from 'react';
import { generateThesisSuggestions, findRelevantArticles, translateText } from './services/geminiService';
import type { ThesisSuggestionResponse, Article, AcademicLevel, ResearchMethod } from './types';
import Header from './components/Header';
import SuggestionCard from './components/SuggestionCard';
import TopicSuggestionCard, { type TopicItem } from './components/TopicSuggestionCard';
import ArticleCard from './components/ArticleCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import { BookOpenIcon, ChevronLeftIcon, SearchIcon, UsersIcon } from './components/Icons';

type AppMode = 'topic' | 'article';
type TopicMode = 'simple' | 'advanced';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('topic');
  const [topicMode, setTopicMode] = useState<TopicMode>('simple');

  // State for inputs
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [articleKeywords, setArticleKeywords] = useState('');
  const [advancedKeywords, setAdvancedKeywords] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('arshad');
  const [researchMethod, setResearchMethod] = useState<ResearchMethod>('quantitative');
  
  // State for results
  const [suggestions, setSuggestions] = useState<ThesisSuggestionResponse | null>(null);
  const [topicItems, setTopicItems] = useState<TopicItem[]>([]);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setFieldOfStudy('');
    setArticleKeywords('');
    setAdvancedKeywords('');
    setTargetPopulation('');
    setSuggestions(null);
    setTopicItems([]);
    setArticles(null);
    setError(null);
  };
  
  const handleTopicModeChange = (newTopicMode: TopicMode) => {
    setTopicMode(newTopicMode);
    setSuggestions(null);
    setTopicItems([]);
    setError(null);
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    // Validate inputs before setting loading state
    if (mode === 'topic' && !fieldOfStudy.trim()) {
        setError("لطفاً رشته تحصیلی را وارد کنید.");
        return;
    }
    if (mode === 'article' && !articleKeywords.trim()) {
        setError("لطفاً کلیدواژه‌ها را وارد کنید.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setTopicItems([]);
    setArticles(null);

    try {
      if (mode === 'topic') {
        let result: ThesisSuggestionResponse;
        if (topicMode === 'simple') {
          result = await generateThesisSuggestions({ fieldOfStudy });
        } else { // advanced mode
          result = await generateThesisSuggestions({ 
            fieldOfStudy, 
            keywords: advancedKeywords, 
            level: academicLevel, 
            methodology: researchMethod,
            targetPopulation: targetPopulation
          });
        }
        setSuggestions(result);
        setTopicItems(result.topics.map(topic => ({
          persian: topic,
          isTranslating: false,
          isCopied: false,
        })));
      } else { // article mode
        const result = await findRelevantArticles(articleKeywords);
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
  }, [isLoading, mode, topicMode, fieldOfStudy, articleKeywords, advancedKeywords, academicLevel, researchMethod, targetPopulation]);
  
  const handleCopyTopic = useCallback((index: number) => {
    const topicText = topicItems[index]?.persian;
    if (!topicText) return;

    navigator.clipboard.writeText(topicText).then(() => {
      setTopicItems(prevItems => prevItems.map((item, i) => 
        i === index ? { ...item, isCopied: true } : item
      ));
      setTimeout(() => {
         setTopicItems(prevItems => prevItems.map((item, i) => 
            i === index ? { ...item, isCopied: false } : item
        ));
      }, 2000);
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        setError("خطا در کپی کردن متن.");
    });
  }, [topicItems]);
  
  const handleTranslateTopic = useCallback(async (index: number) => {
    const topicText = topicItems[index]?.persian;
    if (!topicText) return;
    
    setTopicItems(prevItems => prevItems.map((item, i) => 
        i === index ? { ...item, isTranslating: true } : item
    ));

    try {
      const translation = await translateText(topicText);
      setTopicItems(prevItems => prevItems.map((item, i) => 
        i === index ? { ...item, english: translation, isTranslating: false } : item
      ));
    } catch (err) {
      console.error("Translation failed:", err);
      setError(err instanceof Error ? err.message : "ترجمه با شکست مواجه شد.");
      setTopicItems(prevItems => prevItems.map((item, i) => 
        i === index ? { ...item, isTranslating: false } : item
      ));
    }
  }, [topicItems]);
  
  const isSubmitDisabled = isLoading || (mode === 'topic' && !fieldOfStudy.trim()) || (mode === 'article' && !articleKeywords.trim());

  const buttonLabels = {
    topic: "دریافت پیشنهادها",
    article: "جستجوی مقالات"
  };

  const renderSimpleTopicForm = () => (
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
  );

  const renderAdvancedTopicForm = () => (
    <div className="w-full space-y-4">
        <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"><BookOpenIcon /></span>
            <input
                type="text"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                placeholder="* رشته تحصیلی (الزامی)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg"
                disabled={isLoading}
            />
        </div>
        <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"><SearchIcon /></span>
            <input
                type="text"
                value={advancedKeywords}
                onChange={(e) => setAdvancedKeywords(e.target.value)}
                placeholder="کلیدواژه‌های اولیه (اختیاری)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg"
                disabled={isLoading}
            />
        </div>
        <div className="relative">
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"><UsersIcon /></span>
            <input
                type="text"
                value={targetPopulation}
                onChange={(e) => setTargetPopulation(e.target.value)}
                placeholder="جامعه هدف (اختیاری، مثلا: دانشجویان، معلمان)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg"
                disabled={isLoading}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-2">مقطع تحصیلی</h3>
                <div className="flex gap-x-4 gap-y-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="level" value="arshad" checked={academicLevel === 'arshad'} onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        کارشناسی ارشد
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="level" value="doctora" checked={academicLevel === 'doctora'} onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        دکتری
                    </label>
                </div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-2">روش تحقیق</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method" value="quantitative" checked={researchMethod === 'quantitative'} onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        کمی
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method" value="qualitative" checked={researchMethod === 'qualitative'} onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        کیفی
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method" value="mixed" checked={researchMethod === 'mixed'} onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        ترکیبی
                    </label>
                </div>
            </div>
        </div>
    </div>
  );

  const renderArticleForm = () => (
    <div className="relative flex-grow">
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400"><SearchIcon /></span>
        <input
            type="text"
            value={articleKeywords}
            onChange={(e) => setArticleKeywords(e.target.value)}
            placeholder="کلیدواژه‌ها را وارد کنید (مثلا: large language models, AI ethics)"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg"
            disabled={isLoading}
        />
    </div>
  );

  const isAdvancedForm = mode === 'topic' && topicMode === 'advanced';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-4xl mx-auto flex-grow">
        
        <div className="flex justify-center mb-6">
          <div className="bg-slate-800 p-1 rounded-lg flex gap-1">
            <button onClick={() => handleModeChange('topic')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'topic' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              پیشنهاد موضوع
            </button>
            <button onClick={() => handleModeChange('article')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${mode === 'article' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
              جستجوی مقاله
            </button>
          </div>
        </div>
        
        {mode === 'topic' && (
            <div className="flex justify-center mb-4 text-sm">
                <div className="bg-slate-700/50 p-1 rounded-lg flex gap-1">
                    <button onClick={() => handleTopicModeChange('simple')} className={`px-3 py-1 rounded-md transition-colors ${topicMode === 'simple' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>ساده</button>
                    <button onClick={() => handleTopicModeChange('advanced')} className={`px-3 py-1 rounded-md transition-colors ${topicMode === 'advanced' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>پیشرفته</button>
                </div>
            </div>
        )}


        <div className="bg-slate-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 transition-all duration-300">
          <form onSubmit={handleSubmit} className={`flex ${isAdvancedForm ? 'flex-col' : 'flex-col sm:flex-row'} gap-4`}>
            {mode === 'topic' && topicMode === 'simple' && renderSimpleTopicForm()}
            {mode === 'topic' && topicMode === 'advanced' && renderAdvancedTopicForm()}
            {mode === 'article' && renderArticleForm()}
            
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-600/30 text-lg ${isAdvancedForm ? 'w-full' : 'w-full sm:w-auto'}`}
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
              <TopicSuggestionCard 
                title="موضوعات پیشنهادی برای پایان‌نامه"
                topics={topicItems}
                onCopy={handleCopyTopic}
                onTranslate={handleTranslateTopic}
              />
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
        <p>توسعه یافته توسط دیجی نورون</p>
      </footer>
    </div>
  );
};

export default App;