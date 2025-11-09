
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="text-center mb-8 sm:mb-12">
      <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
        دستیار هوش مصنوعی پایان نامه کاسپین تز
      </h1>
      <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
        رشته تحصیلی خود را وارد کنید تا هوش مصنوعی لیستی از کلیدواژه‌ها و موضوعات به‌روز را برای پایان‌نامه شما پیشنهاد دهد.
      </p>
    </header>
  );
};

export default Header;