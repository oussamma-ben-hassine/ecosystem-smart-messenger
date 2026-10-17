'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-slate-950 text-slate-100">
      <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold mb-2 text-white">Une erreur est survenue</h2>
        <p className="text-sm text-slate-400 mb-6">{error?.message || 'Erreur inattendue dans l\'application.'}</p>
        <button
          onClick={() => reset()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500 transition text-white"
        >
          <RotateCcw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  );
}
