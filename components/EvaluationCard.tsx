import React from 'react';
import type { EvaluationResponse } from '../types';
import { ExternalLinkIcon } from './Icons';

interface EvaluationCardProps {
  data: EvaluationResponse;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ data }) => {
  const { score, points, overallComment } = data;

  // Determine color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 border-green-500';
    if (score >= 60) return 'text-yellow-400 border-yellow-500';
    return 'text-red-400 border-red-500';
  };

  const scoreColorClass = getScoreColor(score);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-slate-700 space-y-8 animate-fade-in">
      
      {/* Header & Score */}
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-6">
          نتیجه ارزیابی پروپوزال
        </h2>
        <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${scoreColorClass} bg-slate-900 shadow-xl`}>
          <div className="text-center">
            <span className={`text-4xl font-bold ${scoreColorClass.split(' ')[0]}`}>{score}</span>
            <span className="block text-xs text-slate-400 uppercase mt-1">از 100</span>
          </div>
        </div>
        <p className="mt-6 text-slate-300 max-w-2xl leading-relaxed italic">
          "{overallComment}"
        </p>
      </div>

      {/* Evaluation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="border-b border-slate-600 text-slate-300">
              <th className="py-3 px-4 font-semibold w-1/2 text-red-300">نقاط ضعف شناسایی شده</th>
              <th className="py-3 px-4 font-semibold w-1/2 text-green-300">بهبودهای پیشنهادی</th>
            </tr>
          </thead>
          <tbody className="text-slate-300 text-sm">
            {points.map((point, index) => (
              <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="py-4 px-4 align-top leading-loose border-l border-slate-700/50">
                    <div className="flex gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        {point.weakness}
                    </div>
                </td>
                <td className="py-4 px-4 align-top leading-loose">
                    <div className="flex gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        {point.improvement}
                    </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CTA */}
      <div className="text-center pt-6 mt-6 border-t border-slate-700">
        <p className="text-slate-300 mb-4">
          برای اصلاح نهایی پروپوزال و دریافت نمره کامل، از مشاوران خبره کاسپین تز کمک بگیرید:
        </p>
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-lg"
        >
          <span>دریافت مشاوره تخصصی گروه کاسپین تز</span>
          <ExternalLinkIcon />
        </a>
      </div>
    </div>
  );
};

export default EvaluationCard;