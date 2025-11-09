
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8 sm:mb-12">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
        دستیار هوش مصنوعی پایان نامه کاسپین تز
      </h1>
      <p className="mt-4 text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
        <strong className="text-amber-400">توجه:</strong> هوش مصنوعی فقط برای کمک به شما برای ایده پردازی در انجام پایان نامه است. استفاده تنها از آن ممکن است منجر به از بین رفتن سابقه تحصیلی شما توسط وزارت علوم شود. برای دریافت خدمات مشاوره تخصصی به گروه تخصصی کاسپین تز مراجعه کنید.
      </p>
      <div className="mt-6">
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-lg"
        >
          دریافت مشاوره تخصصی
        </a>
      </div>
    </header>
  );
};

export default Header;
