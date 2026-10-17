'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center text-center">
          <h2 className="text-xl font-bold mb-2 text-rose-500">Erreur critique</h2>
          <p className="text-sm text-slate-400 mb-6">{error?.message || 'Erreur inattendue dans le système.'}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500 transition text-white"
          >
            Réinitialiser
          </button>
        </div>
      </body>
    </html>
  );
}
