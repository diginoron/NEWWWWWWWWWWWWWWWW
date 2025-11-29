
import React from 'react';
import { AppMode } from '../types';
import { 
  ZapIcon, 
  SearchIcon, 
  FileTextIcon, 
  UploadCloudIcon, 
  ClipboardCheckIcon, 
  LanguageIcon, 
  MessageSquareIcon, 
  PhoneIcon 
} from './Icons';

interface HomeMenuProps {
  onModeSelect: (mode: AppMode) => void;
}

const HomeMenu: React.FC<HomeMenuProps> = ({ onModeSelect }) => {
  const menuItems = [
    {
      id: 'topic',
      title: 'پیشنهاد موضوع',
      description: 'ایده‌پردازی و یافتن موضوعات جدید و خلاقانه برای پایان‌نامه',
      icon: <ZapIcon />,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'chat',
      title: 'مشاوره هوشمند',
      description: 'گفتگو با هوش مصنوعی برای راهنمایی در مسیر پژوهش',
      icon: <MessageSquareIcon />,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      id: 'article',
      title: 'جستجوی مقاله',
      description: 'یافتن مقالات علمی مرتبط و معتبر با کلیدواژه‌های شما',
      icon: <SearchIcon />,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      id: 'pre-proposal',
      title: 'پیش پروپوزال',
      description: 'نگارش اولیه پروپوزال شامل اهداف، سوالات و روش تحقیق',
      icon: <FileTextIcon />,
      color: 'from-orange-500 to-amber-500'
    },
    {
      id: 'summarize',
      title: 'خلاصه‌سازی',
      description: 'مطالعه و استخراج نکات کلیدی از فایل‌های مقاله (PDF/Word)',
      icon: <UploadCloudIcon />,
      color: 'from-pink-500 to-rose-500'
    },
    {
      id: 'evaluate',
      title: 'ارزیابی پروپوزال',
      description: 'بررسی علمی پروپوزال شما و ارائه پیشنهادات اصلاحی',
      icon: <ClipboardCheckIcon />,
      color: 'from-blue-600 to-cyan-600'
    },
    {
      id: 'translate',
      title: 'مترجم هوشمند',
      description: 'ترجمه متون تخصصی و آکادمیک با کیفیت بالا',
      icon: <LanguageIcon />,
      color: 'from-indigo-500 to-violet-500'
    },
    {
      id: 'contact',
      title: 'ارتباط با مشاور',
      description: 'دریافت مشاوره تخصصی از تیم مجرب کاسپین تز',
      icon: <PhoneIcon />,
      color: 'from-slate-600 to-slate-500'
    }
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onModeSelect(item.id as AppMode)}
          className="group relative overflow-hidden bg-slate-800/60 backdrop-blur-sm border border-slate-700 rounded-xl p-6 text-right transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-slate-600"
        >
          <div className={`absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b ${item.color}`} />
          
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${item.color} text-white shadow-lg group-hover:shadow-${item.color}/50 transition-shadow`}>
              {React.cloneElement(item.icon as React.ReactElement, { width: 24, height: 24 })}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {item.description}
              </p>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-500/20 to-transparent group-hover:via-cyan-500/50 transition-all" />
        </button>
      ))}
    </div>
  );
};

export default HomeMenu;