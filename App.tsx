
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
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import { BookOpenIcon, ChevronLeftIcon, FileTextIcon, SearchIcon, UsersIcon, HelpCircleIcon, UploadCloudIcon, LanguageIcon } from './components/Icons';
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
  const [mode, setMode] = useState<AppMode>('topic');
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
        preProposal: 670, summarize: 330, evaluate: 500, translate: 200
    };
    const OUTPUT_SIZES = {
        topicSimple: 150, topicAdvanced: 300, article: 450,
        preProposal: 800, summarize: 700, evaluate: 600, translate: 0 // Variable
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
    }

    if (mode !== 'summarize') {
       inputTokens = basePromptTokens + estimateTokens(userText);
    }
    
    const hasInput = (mode === 'topic' && fieldOfStudy.trim() !== '') ||
                     (mode === 'article' && articleKeywords.trim() !== '') ||
                     (mode === 'pre-proposal' && preProposalTopic.trim() !== '') ||
                     (mode === 'summarize' && uploadedFile !== null) ||
                     (mode === 'evaluate' && (evalStatement.trim() !== '' || evalSignificance.trim() !== '' || evalObjectives.trim() !== '' || evalQuestions.trim() !== '' || evalMethodology.trim() !== '')) ||
                     (mode === 'translate' && translateInput.trim() !== '');

    if (!hasInput) {
        setTokenEstimate({ input: 0, output: 0, total: 0 });
        return;
    }
    
    const roundToNearest = (num: number, nearest: number) => Math.max(nearest, Math.ceil(num / nearest) * nearest);
    
    const finalInput = roundToNearest(inputTokens, 50);
    const finalOutput = roundToNearest(outputTokens, 50);

    setTokenEstimate({
        input: finalInput,
        output: finalOutput,
        total: finalInput + finalOutput,
    });

  }, [mode, topicMode, fieldOfStudy, advancedKeywords, targetPopulation, articleKeywords, preProposalTopic, uploadedFile, evalStatement, evalSignificance, evalObjectives, evalQuestions, evalMethodology, translateInput]);

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    setFieldOfStudy('');
    setArticleKeywords('');
    setAdvancedKeywords('');
    setTargetPopulation('');
    setPreProposalTopic('');
    setUploadedFile(null);
    setSuggestions(null);
    setTopicItems([]);
    setArticles(null);
    setPreProposal(null);
    setSummary(null);
    setEvaluation(null);
    setTranslationResult(null);
    setError(null);
    
    // Reset Eval inputs
    setEvalStatement('');
    setEvalSignificance('');
    setEvalObjectives('');
    setEvalQuestions('');
    setEvalMethodology('');

    // Reset Translate
    setTranslateInput('');
  };
  
  const handleTopicModeChange = (newTopicMode: TopicMode) => {
    setTopicMode(newTopicMode);
    setSuggestions(null);
    setTopicItems([]);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

        if (file.size > MAX_FILE_SIZE) {
            setError("حجم فایل نباید بیشتر از 4 مگابایت باشد.");
            setUploadedFile(null);
            return;
        }
        
        const allowedTypes = [
            'application/pdf', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'text/plain'
        ];
        if (!allowedTypes.includes(file.type)) {
            setError("فرمت فایل نامعتبر است. لطفاً یک فایل PDF، DOCX یا TXT آپلود کنید.");
            setUploadedFile(null);
            return;
        }
        setUploadedFile(file);
        setError(null);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        const MAX_PAGES = 10; // Reduced to 10 pages
        
        for (let i = 1; i <= Math.min(pdf.numPages, MAX_PAGES); i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        if (!fullText.trim()) {
            throw new Error('فایل PDF فاقد محتوای متنی قابل استخراج است. ممکن است شامل تصاویر اسکن شده باشد.');
        }
        return fullText;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.extractRawText({ arrayBuffer });
        if (!result.value.trim()) {
             throw new Error('فایل Word فاقد محتوای متنی قابل استخراج است.');
        }
        return result.value;
    } else if (file.type === 'text/plain') {
        return file.text();
    } else {
        throw new Error('فرمت فایل پشتیبانی نمی‌شود. لطفاً یک فایل PDF، DOCX یا TXT انتخاب کنید.');
    }
  };


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (mode === 'topic' && !fieldOfStudy.trim()) {
        setError("لطفاً رشته تحصیلی را وارد کنید.");
        return;
    }
    if (mode === 'article' && !articleKeywords.trim()) {
        setError("لطفاً کلیدواژه‌ها را وارد کنید.");
        return;
    }
    if (mode === 'pre-proposal' && !preProposalTopic.trim()) {
        setError("لطفاً موضوع پایان‌نامه را وارد کنید.");
        return;
    }
     if (mode === 'summarize' && !uploadedFile) {
        setError("لطفاً یک فایل آپلود کنید.");
        return;
    }
    // New Validation: Check if AT LEAST ONE field is filled
    const hasEvalInput = evalStatement.trim() || evalSignificance.trim() || evalObjectives.trim() || evalQuestions.trim() || evalMethodology.trim();
    if (mode === 'evaluate' && !hasEvalInput) {
        setError("لطفاً حداقل یک بخش از پروپوزال را برای ارزیابی تکمیل کنید.");
        return;
    }
    if (mode === 'translate') {
        if (!translateInput.trim()) {
            setError("لطفاً متن را برای ترجمه وارد کنید.");
            return;
        }
        const wordCount = translateInput.trim().split(/\s+/).length;
        if (wordCount > 500) {
            setError("متن ورودی نباید بیشتر از 500 کلمه باشد.");
            return;
        }
    }

    setIsLoading(true);
    setError(null);
    setSuggestions(null);
    setTopicItems([]);
    setArticles(null);
    setPreProposal(null);
    setSummary(null);
    setEvaluation(null);
    setTranslationResult(null);

    const TRUNCATE_LIMIT = 15000; 

    try {
      if (mode === 'topic') {
        let result: ThesisSuggestionResponse;
        if (topicMode === 'simple') {
          // Pass advancedKeywords if user entered them in simple mode too
          result = await generateThesisSuggestions({ 
              fieldOfStudy,
              keywords: advancedKeywords 
            });
        } else {
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
      } else if (mode === 'article') {
        const result = await findRelevantArticles(articleKeywords);
        setArticles(result);
      } else if (mode === 'pre-proposal') {
        const params: PreProposalRequest = {
            topic: preProposalTopic,
            level: academicLevel,
            methodology: researchMethod,
            targetPopulation: targetPopulation,
        };
        const result = await generatePreProposal(params);
        setPreProposal(result);
      } else if (mode === 'summarize' && uploadedFile) {
        try {
          let articleContent = await extractTextFromFile(uploadedFile);
          if (articleContent.length > TRUNCATE_LIMIT) {
              articleContent = articleContent.substring(0, TRUNCATE_LIMIT);
          }
          const result = await summarizeArticle(articleContent);
          setSummary(result);
        } catch (parseError) {
          if (parseError instanceof Error) {
            setError(`خطا در پردازش فایل: ${parseError.message}`);
          } else {
            setError('خطا در پردازش فایل.');
          }
        }
      } else if (mode === 'evaluate') {
          const params: ProposalContent = {
            statement: evalStatement,
            significance: evalSignificance,
            objectives: evalObjectives,
            questions: evalQuestions,
            methodology: evalMethodology
          };
          const result = await evaluateProposal(params);
          setEvaluation(result);
      } else if (mode === 'translate') {
          const result = await translateGeneralText({
            text: translateInput,
            tone: translateTone,
            direction: translateDirection
          });
          setTranslationResult(result);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(`خطا در دریافت اطلاعات: ${err.message}.`);
      } else {
        setError('یک خطای ناشناخته رخ داد.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, mode, topicMode, fieldOfStudy, articleKeywords, advancedKeywords, academicLevel, researchMethod, targetPopulation, preProposalTopic, uploadedFile, evalStatement, evalSignificance, evalObjectives, evalQuestions, evalMethodology, translateInput, translateTone, translateDirection]);
  
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
  
  const isSubmitDisabled = isLoading || 
    (mode === 'topic' && !fieldOfStudy.trim()) || 
    (mode === 'article' && !articleKeywords.trim()) ||
    (mode === 'pre-proposal' && !preProposalTopic.trim()) ||
    (mode === 'summarize' && !uploadedFile) || 
    (mode === 'evaluate' && !(evalStatement.trim() || evalSignificance.trim() || evalObjectives.trim() || evalQuestions.trim() || evalMethodology.trim())) ||
    (mode === 'translate' && !translateInput.trim());


  const buttonLabels = {
    topic: "دریافت پیشنهادها",
    article: "جستجوی مقالات",
    'pre-proposal': "ایجاد پیش پروپوزال",
    summarize: "خلاصه کن",
    evaluate: "ارزیابی پروپوزال",
    translate: "ترجمه کن"
  };

  const renderSimpleTopicForm = () => (
     <div className="relative flex-grow flex flex-col gap-4 w-full">
        <div className="relative w-full">
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
        <div className="relative w-full">
             <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                <SearchIcon />
            </span>
            <input
                type="text"
                value={advancedKeywords}
                onChange={(e) => setAdvancedKeywords(e.target.value)}
                placeholder="کلیدواژه‌های دلخواه (اختیاری)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-sm"
                disabled={isLoading}
            />
        </div>
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

  const renderFileUploadForm = (labelText: string) => (
     <div className="w-full space-y-4 flex flex-col items-center">
        <label htmlFor="file-upload" className="w-full cursor-pointer bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-cyan-500 transition-colors duration-300">
            <div className="flex flex-col items-center justify-center text-slate-400">
                <UploadCloudIcon />
                <p className="mt-2 text-lg font-semibold text-slate-200">{labelText}</p>
                <p className="text-sm">فرمت‌های مجاز: PDF, DOCX, TXT (حداکثر حجم: 4 مگابایت)</p>
            </div>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" disabled={isLoading} />
        </label>
        {uploadedFile && (
            <div className="mt-4 text-center bg-slate-700/50 py-2 px-4 rounded-lg text-slate-300">
                <p>فایل انتخاب شده: <span className="font-semibold text-cyan-400">{uploadedFile.name}</span></p>
                <p className="text-xs text-amber-400 mt-1">توجه: تنها 10 صفحه اول فایل پردازش می‌شود.</p>
            </div>
        )}
     </div>
  );

  const renderEvaluationForm = () => (
    <div className="w-full space-y-4">
        <p className="text-sm text-slate-400 mb-2">برای دریافت تحلیل دقیق، بخش‌های مورد نظر از پروپوزال خود را در کادرهای زیر وارد کنید. نیازی به تکمیل همه موارد نیست.</p>
        
        <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-sm">1. بیان مسئله</label>
            <textarea
                value={evalStatement}
                onChange={(e) => setEvalStatement(e.target.value)}
                placeholder="متن بیان مسئله..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm min-h-[100px]"
                disabled={isLoading}
            />
        </div>

        <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-sm">2. اهمیت و ضرورت موضوع</label>
            <textarea
                value={evalSignificance}
                onChange={(e) => setEvalSignificance(e.target.value)}
                placeholder="متن اهمیت موضوع..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm min-h-[80px]"
                disabled={isLoading}
            />
        </div>

        <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-sm">3. اهداف تحقیق</label>
            <textarea
                value={evalObjectives}
                onChange={(e) => setEvalObjectives(e.target.value)}
                placeholder="اهداف اصلی و فرعی..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm min-h-[80px]"
                disabled={isLoading}
            />
        </div>

        <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-sm">4. سوالات و فرضیات تحقیق</label>
            <textarea
                value={evalQuestions}
                onChange={(e) => setEvalQuestions(e.target.value)}
                placeholder="سوالات و فرضیات..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm min-h-[80px]"
                disabled={isLoading}
            />
        </div>

        <div className="space-y-2">
            <label className="block text-slate-300 font-semibold text-sm">5. روش‌شناسی تحقیق</label>
            <textarea
                value={evalMethodology}
                onChange={(e) => setEvalMethodology(e.target.value)}
                placeholder="شامل: روش تحقیق، جامعه و نمونه، ابزار گردآوری داده‌ها، روش تجزیه و تحلیل داده‌ها..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none text-sm min-h-[120px]"
                disabled={isLoading}
            />
        </div>
    </div>
  );

  const renderTranslateForm = () => (
      <div className="w-full space-y-4">
          <div className="relative">
             <div className="flex justify-between items-center mb-1">
                <span className="text-slate-300 text-sm font-semibold">متن ورودی</span>
                <span className={`text-xs ${translateInput.trim().split(/\s+/).length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                    {translateInput.trim() ? translateInput.trim().split(/\s+/).length : 0} / 500 کلمه
                </span>
             </div>
             <textarea
                value={translateInput}
                onChange={(e) => setTranslateInput(e.target.value)}
                placeholder="متن خود را برای ترجمه وارد کنید..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 focus:ring-2 focus:ring-cyan-500 outline-none text-base min-h-[150px]"
                disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
             {/* Direction */}
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                    <LanguageIcon />
                    جهت ترجمه
                </h3>
                <div className="flex gap-x-4 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="direction" value="fa-en" checked={translateDirection === 'fa-en'} onChange={() => setTranslateDirection('fa-en')} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        فارسی به انگلیسی
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="direction" value="en-fa" checked={translateDirection === 'en-fa'} onChange={() => setTranslateDirection('en-fa')} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        انگلیسی به فارسی
                    </label>
                </div>
             </div>

             {/* Tone */}
             <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-1">
                    لحن ترجمه
                     <Tooltip text="رسمی: مناسب متون اداری. غیررسمی: دوستانه و محاوره. آکادمیک: مناسب مقالات علمی." />
                </h3>
                <div className="flex gap-x-4 gap-y-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tone" value="formal" checked={translateTone === 'formal'} onChange={(e) => setTranslateTone(e.target.value as TranslationTone)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        رسمی (Official)
                    </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tone" value="academic" checked={translateTone === 'academic'} onChange={(e) => setTranslateTone(e.target.value as TranslationTone)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        آکادمیک (Academic)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="tone" value="informal" checked={translateTone === 'informal'} onChange={(e) => setTranslateTone(e.target.value as TranslationTone)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        غیررسمی (Informal)
                    </label>
                </div>
             </div>
          </div>
      </div>
  );
  
  const renderPreProposalForm = () => (
    <div className="w-full space-y-4">
      <div className="relative">
        <span className="absolute top-4 right-0 flex items-center pr-4 text-slate-400"><FileTextIcon /></span>
        <textarea
            value={preProposalTopic}
            onChange={(e) => setPreProposalTopic(e.target.value)}
            placeholder="* موضوع دقیق پایان‌نامه خود را اینجا وارد کنید..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pr-12 pl-4 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors duration-200 text-lg min-h-[80px] resize-y"
            disabled={isLoading}
            rows={3}
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
             <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Tooltip text="گروهی که قصد دارید تحقیق خود را روی آن انجام دهید (مثال: معلمان، دانشجویان، مدیران)." />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-2 flex items-center">
                  مقطع تحصیلی
                  <Tooltip text="سطح آکادمیک تحقیق شما که بر عمق و نوآوری موضوع تاثیر می‌گذارد." />
                </h3>
                <div className="flex gap-x-4 gap-y-2 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="level_pre" value="arshad" checked={academicLevel === 'arshad'} onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        کارشناسی ارشد
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="level_pre" value="doctora" checked={academicLevel === 'doctora'} onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        دکتری
                    </label>
                </div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <h3 className="font-semibold mb-2 flex items-center">
                  روش تحقیق
                  <Tooltip text="رویکرد کلی شما برای جمع‌آوری و تحلیل داده‌ها (کمی: اعداد و آمار، کیفی: مصاحبه و تحلیل محتوا، ترکیبی: هر دو)." />
                </h3>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method_pre" value="quantitative" checked={researchMethod === 'quantitative'} onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        کمی
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method_pre" value="qualitative" checked={researchMethod === 'qualitative'} onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        کیفی
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="method_pre" value="mixed" checked={researchMethod === 'mixed'} onChange={(e) => setResearchMethod(e.target.value as ResearchMethod)} className="form-radio bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500 w-4 h-4" />
                        ترکیبی
                    </label>
                </div>
            </div>
        </div>
    </div>
  );

  const isMultiInputForm = (mode === 'topic' && topicMode === 'advanced') || mode === 'pre-proposal' || mode === 'evaluate' || mode === 'translate' || (mode === 'topic' && topicMode === 'simple');
  const isSingleInputForm = false; // With the new simple form, it's also multi-line (or at least stacked)
  const isFileUploadForm = mode === 'summarize';

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar currentMode={mode} onModeChange={handleModeChange} />
      
      <div className="flex-grow flex flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl mx-auto">
          <Header />
          
          <div className="flex justify-center mb-6">
            <div className="bg-slate-800 p-1 rounded-lg flex gap-1 flex-wrap justify-center">
              <button onClick={() => handleModeChange('topic')} className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${mode === 'topic' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                پیشنهاد موضوع
              </button>
              <button onClick={() => handleModeChange('article')} className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${mode === 'article' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                جستجوی مقاله
              </button>
              <button onClick={() => handleModeChange('pre-proposal')} className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${mode === 'pre-proposal' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                پیش پروپوزال
              </button>
              <button onClick={() => handleModeChange('summarize')} className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${mode === 'summarize' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                خلاصه سازی مقالات
              </button>
              <button onClick={() => handleModeChange('evaluate')} className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${mode === 'evaluate' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                ارزیابی پروپوزال
              </button>
               <button onClick={() => handleModeChange('translate')} className={`px-3 py-2 rounded-md text-xs sm:text-sm font-semibold transition-colors ${mode === 'translate' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                مترجم هوشمند
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
            <form onSubmit={handleSubmit} className={`flex ${isMultiInputForm || isFileUploadForm ? 'flex-col' : 'flex-col sm:flex-row'} items-start gap-4`}>
              {mode === 'topic' && topicMode === 'simple' && renderSimpleTopicForm()}
              {mode === 'topic' && topicMode === 'advanced' && renderAdvancedTopicForm()}
              {mode === 'article' && renderArticleForm()}
              {mode === 'pre-proposal' && renderPreProposalForm()}
              {mode === 'summarize' && renderFileUploadForm('فایل مقاله خود را اینجا بکشید یا کلیک کنید')}
              {mode === 'evaluate' && renderEvaluationForm()}
              {mode === 'translate' && renderTranslateForm()}
              
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-cyan-600/30 text-lg ${isMultiInputForm || isFileUploadForm ? 'w-full mt-2' : ''} ${isSingleInputForm ? 'w-full sm:w-auto self-center sm:self-auto' : ''}`}
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
            <TokenEstimator 
              input={tokenEstimate.input} 
              output={tokenEstimate.output}
              total={tokenEstimate.total}
              note={(mode === 'summarize') && uploadedFile ? 'به دلیل محدودیت‌های سرور، تنها بخشی از ابتدای فایل (حدود 15000 کاراکتر) برای پردازش ارسال می‌شود.' : undefined}
            />
          </div>

          <div className="mt-8">
            {error && <ErrorAlert message={error} />}
            
            {suggestions && mode === 'topic' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <SuggestionCard title="کلیدواژه‌های پیشنهادی" items={suggestions.keywords} />
                  <TopicSuggestionCard 
                    title="موضوعات پیشنهادی برای پایان‌نامه"
                    topics={topicItems}
                    onCopy={handleCopyTopic}
                    onTranslate={handleTranslateTopic}
                  />
                </div>
                <div className="mt-8 text-center bg-slate-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-slate-700 animate-fade-in">
                  <p className="text-slate-300 mb-4 text-lg">
                    برای مشاوره و نگارش پروپوزال و پایان نامه بر اساس موضوعات انتخابی از خدمات تخصصی کاسپین تز استفاده کنید:
                  </p>
                  <a
                    href="https://caspianthesis.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-lg"
                  >
                   دریافت مشاوره تخصصی گروه کاسپین تز
                  </a>
                </div>
              </>
            )}

            {articles && mode === 'article' && (
               <div className="animate-fade-in">
                  <ArticleCard articles={articles} />
              </div>
            )}

            {preProposal && mode === 'pre-proposal' && (
              <div className="animate-fade-in">
                  <PreProposalCard data={preProposal} />
              </div>
            )}

            {summary && mode === 'summarize' && (
              <div className="animate-fade-in">
                <SummarizeCard data={summary} />
              </div>
            )}

            {evaluation && mode === 'evaluate' && (
              <div className="animate-fade-in">
                <EvaluationCard data={evaluation} />
              </div>
            )}

            {translationResult && mode === 'translate' && (
                <div className="animate-fade-in">
                    <TranslateResultCard 
                      originalText={translateInput} 
                      translatedText={translationResult.translation} 
                      direction={translateDirection}
                    />
                </div>
            )}
          </div>
        </div>
      </div>
      <footer className="text-center text-slate-500 mt-8 mb-4 text-sm">
        <p>توسعه یافته توسط دیجی نورون</p>
      </footer>
    </div>
  );
};

export default App;
