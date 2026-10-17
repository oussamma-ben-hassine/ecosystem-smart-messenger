'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

function AuthCallbackContent() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    if (!code) {
      setStatus('error');
      setErrorMessage("Aucun code d'autorisation reçu du serveur SSO.");
      return;
    }

    async function handleExchange() {
      try {
        const res = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(err || "Échec d'authentification SSO");
        }

        const data = await res.json();
        localStorage.setItem('messenger_token', data.accessToken);
        localStorage.setItem('messenger_user', JSON.stringify(data.profile));

        setStatus('success');
        setTimeout(() => {
          router.push('/');
        }, 700);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Erreur lors de la validation du jeton SSO.');
      }
    }

    handleExchange();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-[#F8FAFC] text-slate-900">
      <div className="w-full max-w-sm p-7 bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-indigo-500/5 flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Connexion SSO Oussama...</h2>
            <p className="text-sm text-slate-500 mt-1">Vérification sécurisée de votre identité OIDC</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Authentification Réussie !</h2>
            <p className="text-sm text-slate-500 mt-1">Ouverture de vos conversations chiffrées...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
            <h2 className="text-lg font-bold text-slate-900">Connexion SSO interrompue</h2>
            <p className="text-xs text-rose-600 bg-rose-50 px-3 py-2 rounded-xl mt-2 break-all">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-5 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
            >
              Retourner sur Oussama Messenger
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-[#F8FAFC] text-slate-900">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm text-slate-500">Chargement de la session...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
