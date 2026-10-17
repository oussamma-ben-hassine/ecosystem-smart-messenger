export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4 bg-slate-950 text-slate-100">
      <h2 className="text-xl font-bold mb-2">404 - Page Non Trouvée</h2>
      <p className="text-sm text-slate-400 mb-4">La page demandée n'existe pas.</p>
      <a href="/" className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-500 transition">
        Retour à l'accueil
      </a>
    </div>
  );
}
