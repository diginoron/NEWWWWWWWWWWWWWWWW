
import React, { useState } from 'react';
import type { AppMode } from '../types';
import { MenuIcon, XIcon } from './Icons';

interface NavbarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems: { id: AppMode | 'home'; label: string }[] = [
    { id: 'home', label: 'صفحه نخست' },
    { id: 'topic', label: 'پیشنهاد موضوع' },
    { id: 'article', label: 'جستجوی مقاله' },
    { id: 'pre-proposal', label: 'پیش پروپوزال' },
    { id: 'summarize', label: 'خلاصه سازی' },
    { id: 'evaluate', label: 'ارزیابی پروپوزال' },
    { id: 'translate', label: 'مترجم هوشمند' },
  ];

  const handleNavClick = (id: AppMode | 'home') => {
    if (id === 'home') {
      onModeChange('topic'); // Reset to default/home view
    } else {
      onModeChange(id);
    }
    setIsOpen(false);
  };

  return (
    <nav className="bg-slate-800/80 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Menu (Right Side in RTL) */}
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-reverse space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    (item.id === 'home' && currentMode === 'topic') || item.id === currentMode
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

           {/* Mobile Menu Button (Right Side in RTL) */}
           <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">باز کردن منو</span>
              {isOpen ? <XIcon /> : <MenuIcon />}
            </button>
          </div>

          {/* Logo (Left Side in RTL) */}
          <div className="flex-shrink-0 flex items-center gap-3">
             <div className="text-left hidden sm:block">
                <h1 className="text-white font-bold text-lg leading-tight">کاسپین تز</h1>
                <p className="text-cyan-400 text-xs">دستیار هوشمند پژوهش</p>
             </div>
             <img
              className="h-12 w-12 rounded-full border-2 border-slate-600"
              src="https://caspianthesis.com/wp-content/uploads/2021/06/LOGO.jpg"
              alt="Logo"
            />
          </div>

        </div>
      </div>

      {/* Mobile Menu (Waterfall style) */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`} id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-slate-800 border-t border-slate-700">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`block w-full text-right px-3 py-3 rounded-md text-base font-medium ${
                 (item.id === 'home' && currentMode === 'topic') || item.id === currentMode
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
