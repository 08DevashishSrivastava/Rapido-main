import React from 'react';

export default function Card({ children, className = '', glow = false }) {
  return (
    <div
      className={`bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm ${
        glow ? 'border-blue-500/30 shadow-blue-500/5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
