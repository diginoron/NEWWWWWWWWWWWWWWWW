import React from 'react';
import type { PreProposalResponse } from '../types';
import { ExternalLinkIcon } from './Icons';

interface PreProposalCardProps {
  data: PreProposalResponse;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-b border-slate-700 pb-6 last:pb-0 last:border-b-0">
    <h3 className="text-xl font-bold text-cyan-400 mb-4">{title}</h3>
    {children}
  </section>
);

const PreProposalCard: React.FC<PreProposalCardProps> = ({ data }) => {
  const { introduction, mainObjective, specificObjectives, mainQuestion, specificQuestions, methodology } = data;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-slate-700 space-y-6">
      <h2 className="text-2xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-2">
        پیش پروپوزال پیشنهادی
      </h2>

      <Section title="مقدمه">
        <p className="text-slate-300 leading-loose text-justify">{introduction}</p>
      </Section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <Section title="اهداف تحقیق">
            <div className="space-y-3">
                <p><strong className="font-semibold text-slate-200">هدف اصلی:</strong> {mainObjective}</p>
                <div>
                    <strong className="font-semibold text-slate-200">اهداف فرعی:</strong>
                    <ul className="list-disc pr-6 mt-2 space-y-1 text-slate-300">
                        {specificObjectives.map((obj, i) => <li key={i}>{obj}</li>)}
                    </ul>
                </div>
            </div>
        </Section>
        <Section title="سوالات تحقیق">
             <div className="space-y-3">
                <p><strong className="font-semibold text-slate-200">سوال اصلی:</strong> {mainQuestion}</p>
                <div>
                    <strong className="font-semibold text-slate-200">سوالات فرعی:</strong>
                    <ul className="list-disc pr-6 mt-2 space-y-1 text-slate-300">
                        {specificQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                </div>
            </div>
        </Section>
      </div>

      <Section title="روش شناسی">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-slate-300">
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <dt className="font-semibold text-slate-200">نوع و طرح تحقیق:</dt>
                <dd>{methodology.researchTypeAndDesign}</dd>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <dt className="font-semibold text-slate-200">جامعه و نمونه:</dt>
                <dd>{methodology.populationAndSample}</dd>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <dt className="font-semibold text-slate-200">ابزار گردآوری داده ها:</dt>
                <dd>{methodology.dataCollectionTools}</dd>
            </div>
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <dt className="font-semibold text-slate-200">روش تجزیه و تحلیل داده ها:</dt>
                <dd>{methodology.dataAnalysisMethod}</dd>
            </div>
             <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 sm:col-span-2">
                <dt className="font-semibold text-slate-200">نرم افزارهای احتمالی:</dt>
                <dd>{methodology.potentialSoftware}</dd>
            </div>
        </dl>
      </Section>
      
      <div className="text-center pt-4">
        <p className="text-slate-300 mb-4">برای دریافت مشاوره تخصصی و تکمیل پروپوزال خود به وب سایت کاسپین تز مراجعه کنید.</p>
        <a
          href="https://caspianthesis.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-teal-600/40 text-lg"
        >
          <span>وب سایت کاسپین تز</span>
          <ExternalLinkIcon />
        </a>
      </div>

    </div>
  );
};

export default PreProposalCard;