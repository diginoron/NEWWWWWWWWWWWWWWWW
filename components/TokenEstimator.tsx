import React from 'react';
import { ZapIcon } from './Icons';

interface TokenEstimatorProps {
  input: number;
  output: number;
  total: number;
  note?: string;
}

const TokenEstimator: React.FC<TokenEstimatorProps> = ({ input, output, total, note }) => {
  if (total === 0) {
    return null;
  }

  return (
    <div className="mt-4 text-xs text-slate-400 bg-slate-900/50 p-3 rounded-lg border border-slate-700 flex items-center justify-center gap-x-4 gap-y-2 flex-wrap animate-fade-in">
      <div className="flex items-center gap-2">
        <ZapIcon />
        <span className="font-semibold text-slate-300">هزینه تخمینی توکن:</span>
      </div>
      <span>ورودی: ~{input.toLocaleString('fa-IR')}</span>
      <span className="hidden sm:inline">|</span>
      <span>خروجی: ~{output.toLocaleString('fa-IR')}</span>
      <span className="hidden sm:inline">|</span>
      <span className="font-bold text-cyan-400">مجموع: ~{total.toLocaleString('fa-IR')}</span>
      {note && <p className="w-full text-center text-slate-500 text-[10px] mt-1">{note}</p>}
    </div>
  );
};

export default TokenEstimator;
