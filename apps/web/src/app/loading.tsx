import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-3" />
      <p className="text-sm text-slate-400">Chargement de Ecosystem Smart Messenger...</p>
    </div>
  );
}
