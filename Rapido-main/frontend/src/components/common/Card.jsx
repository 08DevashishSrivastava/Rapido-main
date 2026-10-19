import React from 'react';

export default function Card({ children, className = '', glow = false, accent = '' }) {
  let accentClass = 'bg-white border-slate-200/80 shadow-sm';
  if (accent === 'blue') accentClass = 'bg-blue-50/50 border-blue-200/80 shadow-sm';
  else if (accent === 'teal') accentClass = 'bg-teal-50/50 border-teal-200/80 shadow-sm';
  else if (accent === 'green') accentClass = 'bg-emerald-50/50 border-emerald-200/80 shadow-sm';
  else if (accent === 'orange') accentClass = 'bg-amber-50/50 border-amber-200/80 shadow-sm';
  else if (accent === 'lavender') accentClass = 'bg-purple-50/50 border-purple-200/80 shadow-sm';
  else if (accent === 'soft') accentClass = 'bg-slate-50/80 border-slate-200/80 shadow-sm';
  else if (glow) accentClass = 'bg-white border-blue-300 shadow-md ring-1 ring-blue-500/10';

  return (
    <div className={`border rounded-2xl p-5 sm:p-6 transition-all duration-200 ${accentClass} ${className}`}>
      {children}
    </div>
  );
}
