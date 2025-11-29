
import React from 'react';
import { ExternalLinkIcon, PhoneIcon } from './Icons';

const ContactCard: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800/60 backdrop-blur-sm p-8 rounded-xl shadow-lg border border-slate-700 animate-fade-in text-center space-y-8">
      <div className="flex justify-center">
        <div className="bg-cyan-900/30 p-5 rounded-full text-cyan-400 border border-cyan-800/50">
           <PhoneIcon />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
        ارتباط با کارشناس و مشاور
      </h2>
      
      <p className="text-slate-300 text-lg leading-loose max-w-2xl mx-auto">
        هوش مصنوعی ابزاری قدرتمند برای ایده‌پردازی است، اما جایگزین تجربه و تخصص انسانی نمی‌شود. 
        برای دریافت مشاوره تخصصی، تحلیل دقیق و راهنمایی گام‌به‌گام در مسیر انجام پایان‌نامه، 
        با کارشناسان و مشاوران خبره گروه کاسپین تز در ارتباط باشید.
      </p>

      <div className="pt-4">
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-3 bg-teal-600 hover:bg-teal-500 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-xl"
        >
          <span>مشاوره تخصصی و انجام پایان نامه</span>
          <ExternalLinkIcon />
        </a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-sm text-slate-400">
         <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-slate-200 font-semibold mb-2 text-base">مشاوره رایگان</h3>
            <p>پاسخگویی به سوالات اولیه شما</p>
         </div>
         <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-slate-200 font-semibold mb-2 text-base">تضمین کیفیت</h3>
            <p>همراهی تا انتهای مسیر پژوهش</p>
         </div>
         <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-slate-200 font-semibold mb-2 text-base">تیم تخصصی</h3>
            <p>پوشش تمامی رشته‌های دانشگاهی</p>
         </div>
      </div>
    </div>
  );
};

export default ContactCard;
