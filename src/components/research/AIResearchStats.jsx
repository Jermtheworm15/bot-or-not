import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const studies = [
  {
    stat: '50.2%',
    label: 'Human baseline accuracy',
    detail: 'Nightingale & Farid (2022) — participants identified AI-generated faces at near-random chance.',
    source: 'Nature Scientific Reports',
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  {
    stat: '39%',
    label: 'Pass rate in standard Turing Tests',
    detail: 'In controlled evaluations, judges correctly identified AI agents as non-human only 61% of the time — less than expected.',
    source: 'Warwick & Shah, 2016',
    accent: 'text-violet-400',
    border: 'border-violet-500/20',
  },
  {
    stat: '66%',
    label: 'Trust AI faces over real ones',
    detail: 'McNeely-White et al. (2023) found AI-generated faces were rated as significantly more trustworthy than photographs of real people.',
    source: 'Psychological Science',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  {
    stat: '13%',
    label: 'Improvement with training',
    detail: 'Users exposed to AI detection feedback improved accuracy by ~13 percentage points over 20 trials — consistent with our platform data.',
    source: 'Köbis et al., 2021 · Current Biology',
    accent: 'text-sky-400',
    border: 'border-sky-500/20',
  },
];

export default function AIResearchStats() {
  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-2 font-semibold">Peer-Reviewed Research</p>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            The Turing Test in the Age of Generative AI
          </h2>
          <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Alan Turing proposed in 1950 that if a machine could converse indistinguishably from a human, it should be considered intelligent.
            Today, that benchmark extends to images, voices, and faces — and humans are failing it at alarming rates.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {studies.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 + 0.2 }}
              className={`bg-zinc-900/60 border ${s.border} rounded-xl p-5 backdrop-blur-sm`}
            >
              <p className={`text-4xl font-black mb-1 ${s.accent}`}>{s.stat}</p>
              <p className="text-white font-semibold text-sm mb-2">{s.label}</p>
              <p className="text-zinc-400 text-xs leading-relaxed mb-3">{s.detail}</p>
              <p className="text-zinc-600 text-[10px] uppercase tracking-wider font-medium">{s.source}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 text-sm text-zinc-400 leading-relaxed">
          <p className="text-zinc-300 font-semibold mb-2">Where our platform fits in</p>
          <p>
            Our crowd-sourced detection data tracks real human performance across thousands of AI-generated and authentic images —
            providing a live, continuously updated benchmark that complements controlled lab studies.
            Every vote you cast contributes to a growing dataset on human AI-detection capability.
          </p>
          <a
            href="https://doi.org/10.1038/s41598-022-23456-9"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-violet-400 hover:text-violet-300 text-xs transition-colors"
          >
            Read the Nightingale & Farid study <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}