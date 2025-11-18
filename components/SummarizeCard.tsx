import React from 'react';
import type { SummaryResponse } from '../types';

interface SummarizeCardProps {
  data: SummaryResponse;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="border-b border-slate-700 pb-6 last:pb-0 last:border-b-0">
    <h3 className="text-xl font-bold text-cyan-400 mb-4">{title}</h3>
    <div className="text-slate-300 leading-loose text-justify">{children}</div>
  </section>
);

const SummarizeCard: React.FC<SummarizeCardProps> = ({ data }) => {
  const { title, introduction, researchMethod, dataCollectionMethod, statisticalPopulation, dataAnalysisMethod, results } = data;

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 sm:p-8 rounded-xl shadow-lg border border-slate-700 space-y-6">
      <h2 className="text-2xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500 mb-2">
        خلاصه مقاله
      </h2>

      <Section title="عنوان و مقدمه مقاله">
        <p><strong className="font-semibold text-slate-200">عنوان: </strong>{title}</p>
        <p className="mt-2">{introduction}</p>
      </Section>

      <Section title="روش تحقیق مقاله">
        <p>{researchMethod}</p>
      </Section>

      <Section title="روش گردآوری داده‌ها">
        <p>{dataCollectionMethod}</p>
      </Section>
      
      <Section title="جامعه آماری">
        <p>{statisticalPopulation}</p>
      </Section>

      <Section title="روش تحلیل داده‌ها">
        <p>{dataAnalysisMethod}</p>
      </Section>

      <Section title="نتایج مقاله">
        <p>{results}</p>
      </Section>
      
    </div>
  );
};

export default SummarizeCard;