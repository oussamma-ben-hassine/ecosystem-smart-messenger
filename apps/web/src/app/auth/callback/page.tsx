'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      setStatus('error');
      setErrorMessage('Aucun code d\'autorisation reçu du SSO.');
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
          throw new Error(err || 'Échec d\'authentification SSO');
        }

        const data = await res.json();
        localStorage.setItem('messenger_token', data.accessToken);
        localStorage.setItem('messenger_user', JSON.stringify(data.profile));

        setStatus('success');
        setTimeout(() => {
          router.push('/');
        }, 800);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Erreur lors de la validation du jeton SSO.');
      }
    }

    handleExchange();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="w-full max-w-sm p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-lg font-semibold text-white">Connexion SSO en cours...</h2>
            <p className="text-sm text-slate-400 mt-2">Vérification sécurisée de votre identité</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-4" />
            <h2 className="text-lg font-semibold text-white">Authentification Réussie !</h2>
            <p className="text-sm text-slate-400 mt-2">Redirection vers vos conversations...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
            <h2 className="text-lg font-semibold text-white">Échec de Connexion</h2>
            <p className="text-sm text-rose-300 mt-2">{errorMessage}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition"
            >
              Retour à l'accueil
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
