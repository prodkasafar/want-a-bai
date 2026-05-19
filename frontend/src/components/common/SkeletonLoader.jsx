import React from 'react';

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 rounded-2xl animate-pulse-slow">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-brand-gold/30"></div>
        <div className="flex-1">
          <div className="h-5 w-2/3 bg-brand-gold/30 rounded mb-2"></div>
          <div className="h-4 w-1/3 bg-brand-gold/20 rounded"></div>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-brand-gold/20 rounded"></div>
        <div className="h-4 w-5/6 bg-brand-gold/20 rounded"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-20 bg-brand-gold/20 rounded-full"></div>
        <div className="h-8 w-24 bg-brand-gold/20 rounded-full"></div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse-slow border-b border-brand-gold/10">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-brand-gold/20 rounded w-4/5"></div>
        </td>
      ))}
    </tr>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-4 animate-pulse-slow">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border border-brand-gold/10 rounded-xl bg-white/40">
          <div className="w-10 h-10 rounded-lg bg-brand-gold/20"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-brand-gold/20 rounded w-1/3"></div>
            <div className="h-3 bg-brand-gold/20 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
