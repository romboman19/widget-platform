import React from 'react';

export default function BrandLogo({ compact = false, dark = false, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <img
        src={compact ? '/brand/widget-platform-icon.png' : '/brand/widget-platform-logo.jpg'}
        alt="Widget Platform"
        className={compact ? 'h-9 w-9 rounded-xl object-contain' : 'h-12 w-auto object-contain'}
      />
      <div className="leading-none">
        <div className={`font-extrabold tracking-tight ${compact ? 'text-lg' : 'text-2xl'} ${dark ? 'text-white' : 'text-slate-950'}`}>
          Widget <span className="text-blue-600">Platform</span>
        </div>
        {!compact ? (
          <div className={`mt-1 text-xs uppercase tracking-[0.24em] ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            Contact widget control center
          </div>
        ) : null}
      </div>
    </div>
  );
}
