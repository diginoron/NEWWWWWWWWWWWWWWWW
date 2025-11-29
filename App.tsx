
import React, { useState, useCallback, useEffect } from 'react';
import { generateThesisSuggestions, findRelevantArticles, translateText, generatePreProposal, summarizeArticle, evaluateProposal, translateGeneralText } from './services/geminiService';
import type { ThesisSuggestionResponse, Article, AcademicLevel, ResearchMethod, PreProposalResponse, PreProposalRequest, SummaryResponse, EvaluationResponse, ProposalContent, TranslationTone, TranslationDirection, GeneralTranslateResponse, AppMode, TopicMode } from './types';
import Header from './components/Header';
import Navbar from './components/Navbar';
import SuggestionCard from './components/SuggestionCard';
import TopicSuggestionCard, { type TopicItem } from './components/TopicSuggestionCard';
import ArticleCard from './components/ArticleCard';
import PreProposalCard from './components/PreProposalCard';
import SummarizeCard from './components/SummarizeCard';
import EvaluationCard from './components/EvaluationCard';
import TranslateResultCard from './components/TranslateResultCard';
import ChatCard from './components/ChatCard';
import ContactCard from './components/ContactCard';
import HomeMenu from './components/HomeMenu';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import { BookOpenIcon, ChevronLeftIcon, FileTextIcon, SearchIcon, UsersIcon, HelpCircleIcon, UploadCloudIcon, LanguageIcon, MessageSquareIcon, PhoneIcon, ZapIcon } from './components/Icons';
import TokenEstimator from './components/TokenEstimator';

declare global {
  interface Window {
    pdfjsLib: any;
    mammoth: any;
  }
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="relative group flex items-center">
    <span className="ml-2 text-slate-400 cursor-help">
      <HelpCircleIcon />
    </span>
    <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-64 bg-slate-700 text-white text-xs rounded-md py-2 px-3 z-10 shadow-lg text-center">
      {text}
    </div>
  </div>
);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('home');
  const [topicMode, setTopicMode] = useState<TopicMode>('simple');

  // State for inputs
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [articleKeywords, setArticleKeywords] = useState('');
  const [advancedKeywords, setAdvancedKeywords] = useState('');
  const [targetPopulation, setTargetPopulation] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('arshad');
  const [researchMethod, setResearchMethod] = useState<ResearchMethod>('quantitative');
  const [preProposalTopic, setPreProposalTopic] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Evaluation State inputs
  const [evalStatement, setEvalStatement] = useState('');
  const [evalSignificance, setEvalSignificance] = useState('');
  const [evalObjectives, setEvalObjectives] = useState('');
  const [evalQuestions, setEvalQuestions] = useState('');
  const [evalMethodology, setEvalMethodology] = useState('');

  // Translation State inputs
  const [translateInput, setTranslateInput] = useState('');
  const [translateTone, setTranslateTone] = useState<TranslationTone>('formal');
  const [translateDirection, setTranslateDirection] = useState<TranslationDirection>('fa-en');
  
  // State for results
  const [suggestions, setSuggestions] = useState<ThesisSuggestionResponse | null>(null);
  const [topicItems, setTopicItems] = useState<TopicItem[]>([]);
  const [articles, setArticles] = useState<Article[] | null>(null);
  const [preProposal, setPreProposal] = useState<PreProposalResponse | null>(null);
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);
  const [translationResult, setTranslationResult] = useState<GeneralTranslateResponse | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenEstimate, setTokenEstimate] = useState({ input: 0, output: 0, total: 0 });

  // Token estimation logic
  useEffect(() => {
    const estimateTokens = (text: string): number => Math.ceil(text.length / 3);

    let inputTokens = 0;
    let outputTokens = 0;
    let basePromptTokens = 0;
    let userText = '';

    const PROMPT_SIZES = {
        topicSimple: 200, topicAdvanced: 330, article: 270,
        preProposal: 670, summarize: 330, evaluate: 500, translate: 200, chat: 100, contact: 0, home: 0
    };
    const OUTPUT_SIZES = {
        topicSimple: 150, topicAdvanced: 300, article: 450,
        preProposal: 800, summarize: 700, evaluate: 600, translate: 0, chat: 150, contact: 0, home: 0
    };

    switch (mode) {
        case 'topic':
            if (topicMode === 'simple') {
                basePromptTokens = PROMPT_SIZES.topicSimple;
                outputTokens = OUTPUT_SIZES.topicSimple;
                userText = `${fieldOfStudy} ${advancedKeywords}`;
            } else {
                basePromptTokens = PROMPT_SIZES.topicAdvanced;
                outputTokens = OUTPUT_SIZES.topicAdvanced;
                userText = `${fieldOfStudy} ${advancedKeywords} ${targetPopulation}`;
            }
            break;
        case 'article':
            basePromptTokens = PROMPT_SIZES.article;
            outputTokens = OUTPUT_SIZES.article;
            userText = articleKeywords;
            break;
        case 'pre-proposal':
            basePromptTokens = PROMPT_SIZES.preProposal;
            outputTokens = OUTPUT_SIZES.preProposal;
            userText = `${preProposalTopic} ${targetPopulation}`;
            break;
        case 'summarize':
            basePromptTokens = PROMPT_SIZES.summarize;
            outputTokens = OUTPUT_SIZES.summarize;
            if (uploadedFile) {
                // We truncate to 15000 chars approx
                const estimatedChars = Math.min(uploadedFile.size, 15000); 
                const fileContentTokens = Math.ceil(estimatedChars / 3);
                inputTokens = basePromptTokens + fileContentTokens;
            } else {
                inputTokens = basePromptTokens;
            }
            break;
        case 'evaluate':
            basePromptTokens = PROMPT_SIZES.evaluate;
            outputTokens = OUTPUT_SIZES.evaluate;
            // Count all text fields
            userText = `${evalStatement} ${evalSignificance} ${evalObjectives} ${evalQuestions} ${evalMethodology}`;
            break;
        case 'translate':
            basePromptTokens = PROMPT_SIZES.translate;
            // Output is roughly equal to input for translation
            const contentTokens = estimateTokens(translateInput);
            outputTokens = contentTokens; 
            userText = translateInput;
            break;
        case 'chat':
             // For chat, we don't display a constant token estimate as it updates dynamically in the component
             setTokenEstimate({ input: 0, output: 0, total: 0 });
             return;
        case 'contact':
        case 'home':
             setTokenEstimate({ input: 0, output: 0, total: 0 });
             return;
    }

    if (mode !== 'summarize') {
       inputTokens = basePromptTokens + estimateTokens(userText);
    }
    
    const total = inputTokens + outputTokens;
    setTokenEstimate({ input: inputTokens, output: outputTokens, total });

  }, [mode, topicMode, fieldOfStudy, articleKeywords, advancedKeywords, targetPopulation, preProposalTopic, uploadedFile, evalStatement, evalSignificance, evalObjectives, evalQuestions, evalMethodology, translateInput]);


  const handleGenerateSuggestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldOfStudy.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setTopicItems([]);

    try {
      const result = await generateThesisSuggestions({
        fieldOfStudy,
        keywords: advancedKeywords,
        level: topicMode === 'advanced' ? academicLevel : undefined,
        methodology: topicMode === 'advanced' ? researchMethod : undefined,
        targetPopulation: topicMode === 'advanced' ? targetPopulation : undefined,
      });
      setSuggestions(result);
      setTopicItems(result.topics.map(t => ({ persian: t, isTranslating: false, isCopied: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در برقراری ارتباط با سرور.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslateTopic = async (index: number) => {
    if (topicItems[index].english || topicItems[index].isTranslating) return;

    setTopicItems(prev => prev.map((item, i) => i === index ? { ...item, isTranslating: true } : item));

    try {
        const translation = await translateText(topicItems[index].persian);
        setTopicItems(prev => prev.map((item, i) => i === index ? { ...item, english: translation, isTranslating: false } : item));
    } catch (err) {
        // Handle error specifically for translation or just console log
        console.error("Translation failed", err);
        setTopicItems(prev => prev.map((item, i) => i === index ? { ...item, isTranslating: false } : item));
    }
  };

  const handleCopyTopic = (index: number) => {
    const item = topicItems[index];
    const textToCopy = item.english ? `${item.persian}\n${item.english}` : item.persian;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        setTopicItems(prev => prev.map((item, i) => i === index ? { ...item, isCopied: true } : item));
        setTimeout(() => {
            setTopicItems(prev => prev.map((item, i) => i === index ? { ...item, isCopied: false } : item));
        }, 1500);
    });
  };

  const handleFindArticles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleKeywords.trim()) return;

    setIsLoading(true);
    setError(null);
    setArticles(null);

    try {
      const result = await findRelevantArticles(articleKeywords);
      setArticles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در یافتن مقالات.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePreProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preProposalTopic.trim()) return;

    setIsLoading(true);
    setError(null);
    setPreProposal(null);

    try {
      const result = await generatePreProposal({
        topic: preProposalTopic,
        level: academicLevel,
        methodology: researchMethod,
        targetPopulation
      });
      setPreProposal(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ایجاد پیش پروپوزال.');
    } finally {
      setIsLoading(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result;
            if (!result) return reject("خطا در خواندن فایل");

            if (file.type === "application/pdf") {
                try {
                    const pdf = await window.pdfjsLib.getDocument(result).promise;
                    let fullText = "";
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(" ");
                        fullText += pageText + " ";
                    }
                    resolve(fullText);
                } catch (err) {
                    reject("خطا در پردازش فایل PDF. لطفاً از فایل متنی یا Word استفاده کنید.");
                }
            } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
                try {
                    const { value } = await window.mammoth.extractRawText({ arrayBuffer: result });
                    resolve(value);
                } catch (err) {
                    reject("خطا در پردازش فایل Word.");
                }
            } else {
                 // Try parsing as text
                 const textReader = new FileReader();
                 textReader.onload = (e) => resolve(e.target?.result as string);
                 textReader.readAsText(file);
            }
        };
        reader.readAsArrayBuffer(file);
    });
  };

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;

    setIsLoading(true);
    setError(null);
    setSummary(null);

    try {
      const text = await extractTextFromFile(uploadedFile);
      if (text.length < 100) throw new Error("متن فایل استخراج شده بسیار کوتاه است.");
      
      const result = await summarizeArticle(text.substring(0, 15000)); // Limit char count
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در پردازش فایل.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Simple check: at least one field should be filled
    if (!evalStatement && !evalSignificance && !evalObjectives && !evalQuestions && !evalMethodology) {
        setError('لطفاً حداقل یک بخش از پروپوزال را وارد کنید.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setEvaluation(null);

    try {
      const result = await evaluateProposal({
        statement: evalStatement,
        significance: evalSignificance,
        objectives: evalObjectives,
        questions: evalQuestions,
        methodology: evalMethodology
      });
      setEvaluation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در ارزیابی پروپوزال.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTranslate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!translateInput.trim()) return;

      setIsLoading(true);
      setError(null);
      setTranslationResult(null);

      try {
          const result = await translateGeneralText({
              text: translateInput,
              tone: translateTone,
              direction: translateDirection
          });
          setTranslationResult(result);
      } catch (err) {
          setError(err instanceof Error ? err.message : 'خطا در ترجمه متن.');
      } finally {
          setIsLoading(false);
      }
  };


  return (
    <div className="min-h-screen bg-slate-900 pb-12 font-sans text-slate-100">
      <Navbar currentMode={mode} onModeChange={setMode} />
      
      <div className="container mx-auto px-4 mt-8">
        <Header />

        <div className="max-w-4xl mx-auto mb-8">
           {/* Navigation is handled by Navbar now */}
        </div>

        {error && (
            <div className="max-w-4xl mx-auto mb-8">
                <ErrorAlert message={error} />
            </div>
        )}

        <div className="max-w-4xl mx-auto transition-all duration-300">
            {mode === 'home' && (
                <HomeMenu onModeSelect={setMode} />
            )}

            {mode === 'topic' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
                        <div className="flex justify-center mb-6">
                            <div className="bg-slate-900/50 p-1 rounded-lg inline-flex">
                                <button
                                    onClick={() => setTopicMode('simple')}
                                    className={`px-4 py-2 rounded-md text-sm transition-colors ${topicMode === 'simple' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    جستجوی ساده
                                </button>
                                <button
                                    onClick={() => setTopicMode('advanced')}
                                    className={`px-4 py-2 rounded-md text-sm transition-colors ${topicMode === 'advanced' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    جستجوی پیشرفته
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleGenerateSuggestions} className="space-y-6">
                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2">رشته تحصیلی</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                        <BookOpenIcon />
                                    </div>
                                    <input
                                        type="text"
                                        value={fieldOfStudy}
                                        onChange={(e) => setFieldOfStudy(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 pr-10 p-2.5"
                                        placeholder="مثال: روانشناسی بالینی، مدیریت بازرگانی..."
                                        required
                                    />
                                </div>
                            </div>

                            {topicMode === 'advanced' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-slate-300 text-sm font-bold mb-2 flex items-center">
                                            کلیدواژه‌های مرتبط
                                            <Tooltip text="کلماتی که دوست دارید در موضوع پایان‌نامه وجود داشته باشند." />
                                        </label>
                                        <input
                                            type="text"
                                            value={advancedKeywords}
                                            onChange={(e) => setAdvancedKeywords(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                            placeholder="مثال: هوش هیجانی، رضایت شغلی"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-sm font-bold mb-2">جامعه هدف</label>
                                        <input
                                            type="text"
                                            value={targetPopulation}
                                            onChange={(e) => setTargetPopulation(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                            placeholder="مثال: دانش‌آموزان دبیرستان، کارکنان بانک"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-sm font-bold mb-2">مقطع تحصیلی</label>
                                        <select
                                            value={academicLevel}
                                            onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                        >
                                            <option value="arshad">کارشناسی ارشد</option>
                                            <option value="doctora">دکتری</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-slate-300 text-sm font-bold mb-2">روش تحقیق</label>
                                        <select
                                            value={researchMethod}
                                            onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                        >
                                            <option value="quantitative">کمی (Quantitative)</option>
                                            <option value="qualitative">کیفی (Qualitative)</option>
                                            <option value="mixed">ترکیبی (Mixed Method)</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                {isLoading ? <LoadingSpinner /> : <ZapIcon />}
                                <span>{isLoading ? 'در حال ایده پردازی...' : 'پیشنهاد موضوع'}</span>
                            </button>
                            <TokenEstimator input={tokenEstimate.input} output={tokenEstimate.output} total={tokenEstimate.total} />
                        </form>
                    </div>

                    {suggestions && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <SuggestionCard title="کلیدواژه‌های پیشنهادی" items={suggestions.keywords} />
                            <TopicSuggestionCard 
                                title="موضوعات پیشنهادی" 
                                topics={topicItems} 
                                onCopy={handleCopyTopic}
                                onTranslate={handleTranslateTopic}
                            />
                        </div>
                    )}
                </div>
            )}

            {mode === 'article' && (
                <div className="space-y-8 animate-fade-in">
                     <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
                        <form onSubmit={handleFindArticles} className="space-y-6">
                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2">کلیدواژه‌ها (فارسی)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                        <SearchIcon />
                                    </div>
                                    <input
                                        type="text"
                                        value={articleKeywords}
                                        onChange={(e) => setArticleKeywords(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 pr-10 p-2.5"
                                        placeholder="مثال: یادگیری ماشین در پزشکی"
                                        required
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-2">ما کلیدواژه‌های شما را به انگلیسی ترجمه کرده و در منابع معتبر جستجو می‌کنیم.</p>
                            </div>
                             <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <LoadingSpinner /> : <SearchIcon />}
                                <span>{isLoading ? 'در حال جستجو...' : 'یافتن مقالات'}</span>
                            </button>
                             <TokenEstimator input={tokenEstimate.input} output={tokenEstimate.output} total={tokenEstimate.total} />
                        </form>
                     </div>
                     {articles && <ArticleCard articles={articles} />}
                </div>
            )}
            
            {mode === 'pre-proposal' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
                         <form onSubmit={handleGeneratePreProposal} className="space-y-6">
                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2">موضوع پایان‌نامه</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                        <FileTextIcon />
                                    </div>
                                    <input
                                        type="text"
                                        value={preProposalTopic}
                                        onChange={(e) => setPreProposalTopic(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 pr-10 p-2.5"
                                        placeholder="موضوع خود را وارد کنید..."
                                        required
                                    />
                                </div>
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">جامعه هدف</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                                            <UsersIcon />
                                        </div>
                                        <input
                                            type="text"
                                            value={targetPopulation}
                                            onChange={(e) => setTargetPopulation(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block pl-10 pr-10 p-2.5"
                                            placeholder="اختیاری"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">مقطع تحصیلی</label>
                                    <select
                                        value={academicLevel}
                                        onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                    >
                                        <option value="arshad">کارشناسی ارشد</option>
                                        <option value="doctora">دکتری</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">روش تحقیق</label>
                                    <select
                                        value={researchMethod}
                                        onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                    >
                                        <option value="quantitative">کمی</option>
                                        <option value="qualitative">کیفی</option>
                                        <option value="mixed">ترکیبی</option>
                                    </select>
                                </div>
                             </div>

                             <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <LoadingSpinner /> : <FileTextIcon />}
                                <span>{isLoading ? 'در حال نگارش...' : 'تولید پیش پروپوزال'}</span>
                            </button>
                            <TokenEstimator input={tokenEstimate.input} output={tokenEstimate.output} total={tokenEstimate.total} />
                        </form>
                    </div>
                    {preProposal && <PreProposalCard data={preProposal} />}
                </div>
            )}

            {mode === 'summarize' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
                        <form onSubmit={handleSummarize} className="space-y-6">
                            <div className="flex flex-col items-center justify-center w-full">
                                <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-800 hover:border-cyan-500 transition-all duration-300 group">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <div className="text-slate-400 group-hover:text-cyan-400 transition-colors mb-3">
                                            <UploadCloudIcon />
                                        </div>
                                        <p className="mb-2 text-sm text-slate-400"><span className="font-semibold text-cyan-500">برای آپلود کلیک کنید</span> یا فایل را اینجا رها کنید</p>
                                        <p className="text-xs text-slate-500">PDF یا DOCX (حداکثر 10 مگابایت)</p>
                                    </div>
                                    <input 
                                        id="dropzone-file" 
                                        type="file" 
                                        className="hidden" 
                                        accept=".pdf,.docx"
                                        onChange={(e) => setUploadedFile(e.target.files ? e.target.files[0] : null)}
                                    />
                                </label>
                            </div>
                            
                            {uploadedFile && (
                                <div className="text-center text-emerald-400 bg-emerald-900/20 p-2 rounded-lg border border-emerald-900/50">
                                    فایل انتخاب شد: <span className="font-semibold">{uploadedFile.name}</span>
                                </div>
                            )}

                             <button
                                type="submit"
                                disabled={isLoading || !uploadedFile}
                                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <LoadingSpinner /> : <FileTextIcon />}
                                <span>{isLoading ? 'در حال خواندن و خلاصه سازی...' : 'آپلود و خلاصه سازی'}</span>
                            </button>
                            <TokenEstimator input={tokenEstimate.input} output={tokenEstimate.output} total={tokenEstimate.total} note="تخمین توکن بر اساس حجم فایل آپلود شده است." />
                        </form>
                    </div>
                    {summary && <SummarizeCard data={summary} />}
                </div>
            )}

            {mode === 'evaluate' && (
                 <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
                         <div className="mb-6 p-4 bg-amber-900/30 border border-amber-700/50 rounded-lg text-amber-200 text-sm">
                            بخش‌های پروپوزال خود را در کادرهای زیر وارد کنید. نیازی نیست همه بخش‌ها پر شوند، اما هر چه اطلاعات بیشتری بدهید، ارزیابی دقیق‌تر خواهد بود.
                         </div>
                         <form onSubmit={handleEvaluate} className="space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">بیان مسئله (Statement of Problem)</label>
                                    <textarea
                                        value={evalStatement}
                                        onChange={(e) => setEvalStatement(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 h-32"
                                        placeholder="متن بیان مسئله را اینجا کپی کنید..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">اهمیت و ضرورت (Significance)</label>
                                    <textarea
                                        value={evalSignificance}
                                        onChange={(e) => setEvalSignificance(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 h-32"
                                        placeholder="متن اهمیت و ضرورت را اینجا کپی کنید..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">اهداف تحقیق (Objectives)</label>
                                    <textarea
                                        value={evalObjectives}
                                        onChange={(e) => setEvalObjectives(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 h-32"
                                        placeholder="اهداف اصلی و فرعی..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">سوالات/فرضیات (Questions/Hypotheses)</label>
                                    <textarea
                                        value={evalQuestions}
                                        onChange={(e) => setEvalQuestions(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 h-32"
                                        placeholder="سوالات یا فرضیات تحقیق..."
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-slate-300 text-sm font-bold mb-2">روش‌شناسی (Methodology)</label>
                                    <textarea
                                        value={evalMethodology}
                                        onChange={(e) => setEvalMethodology(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 h-32"
                                        placeholder="توضیح روش، جامعه آماری، ابزار و..."
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <LoadingSpinner /> : <ZapIcon />}
                                <span>{isLoading ? 'در حال بررسی دقیق...' : 'ارزیابی علمی پروپوزال'}</span>
                            </button>
                            <TokenEstimator input={tokenEstimate.input} output={tokenEstimate.output} total={tokenEstimate.total} />
                        </form>
                    </div>
                    {evaluation && <EvaluationCard data={evaluation} />}
                 </div>
            )}

            {mode === 'translate' && (
                <div className="space-y-8 animate-fade-in">
                    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700">
                        <form onSubmit={handleTranslate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">نوع ترجمه</label>
                                    <select
                                        value={translateDirection}
                                        onChange={(e) => setTranslateDirection(e.target.value as TranslationDirection)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                    >
                                        <option value="fa-en">فارسی به انگلیسی</option>
                                        <option value="en-fa">انگلیسی به فارسی</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-300 text-sm font-bold mb-2">لحن ترجمه</label>
                                    <select
                                        value={translateTone}
                                        onChange={(e) => setTranslateTone(e.target.value as TranslationTone)}
                                        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
                                    >
                                        <option value="formal">رسمی و اداری (Formal)</option>
                                        <option value="academic">آکادمیک و تخصصی (Academic)</option>
                                        <option value="informal">غیررسمی و دوستانه (Informal)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-slate-300 text-sm font-bold mb-2">متن شما</label>
                                <textarea
                                    value={translateInput}
                                    onChange={(e) => setTranslateInput(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5 h-40"
                                    placeholder="متن خود را اینجا وارد کنید..."
                                    required
                                />
                                <p className="text-xs text-slate-500 mt-2 text-left">{translateInput.length} کاراکتر</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                {isLoading ? <LoadingSpinner /> : <LanguageIcon />}
                                <span>{isLoading ? 'در حال ترجمه...' : 'ترجمه هوشمند'}</span>
                            </button>
                            <TokenEstimator input={tokenEstimate.input} output={tokenEstimate.output} total={tokenEstimate.total} />
                        </form>
                    </div>
                    {translationResult && <TranslateResultCard originalText={translateInput} translatedText={translationResult.translation} direction={translateDirection} />}
                </div>
            )}

            {mode === 'chat' && <ChatCard />}

            {mode === 'contact' && <ContactCard />}

        </div>
      </div>
    </div>
  );
};

export default App;