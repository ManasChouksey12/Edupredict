import React from 'react';
import { Lightbulb } from 'lucide-react';

export type InsightsPanelTheme = 'dark' | 'light';

interface InsightsPanelProps {
  title: string;
  subtitle?: string;
  body: string;
  theme?: InsightsPanelTheme;
  className?: string;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({
  title,
  subtitle,
  body,
  theme = 'dark',
  className = '',
}) => {
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-2xl border p-6 sm:p-7 ${
        isDark
          ? 'bg-slate-900/40 border-white/10 backdrop-blur-md'
          : 'bg-slate-50/90 border-slate-200/90'
      } ${className}`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-100 text-amber-800'
          }`}
        >
          <Lightbulb className="w-5 h-5" />
        </div>
        <div>
          <h4 className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </h4>
          {subtitle && (
            <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{subtitle}</p>
          )}
        </div>
      </div>
      <div
        className={`text-sm leading-relaxed whitespace-pre-wrap pl-0 sm:pl-[52px] ${
          isDark ? 'text-slate-300' : 'text-slate-700'
        }`}
      >
        {body}
      </div>
    </div>
  );
};

export default InsightsPanel;
