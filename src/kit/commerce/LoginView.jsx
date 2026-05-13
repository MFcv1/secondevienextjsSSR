import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function LoginView({ onSuccess }) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const handle = async (e) => {
    e.preventDefault();
    try { await loginWithEmail(email, pass); onSuccess(); }
    catch { setErrorMsg("Identifiants incorrects."); }
  };
  return (
    <div className="max-w-xs mx-auto py-40 text-center space-y-6 animate-in zoom-in-95 text-stone-900">
      <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl transition-transform hover:scale-105 hover:rotate-3"><Lock size={32} /></div>
      <div className="space-y-2 text-stone-900">
        <h2 className="text-3xl font-black tracking-tighter leading-tight text-stone-900">Portail Maître</h2>
        <p className="text-stone-400 text-xs italic font-serif">Accès restreint à l&apos;administration</p>
      </div>
      <div className="space-y-4">
        <button
          onClick={async () => {
            try { await loginWithGoogle(); onSuccess(); }
            catch (e) { setErrorMsg("Erreur Google : " + e.message); }
          }}
          className="w-full py-4 bg-white text-stone-900 border-2 border-stone-200 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-stone-50 hover:border-stone-300 transition-all flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          Continuer avec Google
        </button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-stone-200"></div>
          <span className="flex-shrink-0 mx-4 text-stone-300 text-[10px] font-bold uppercase tracking-widest">Ou classique</span>
          <div className="flex-grow border-t border-stone-200"></div>
        </div>

        <form onSubmit={handle} className="space-y-3">
          <input type="email" placeholder="Email artisan" className="w-full p-4 rounded-xl bg-white border border-stone-200 font-bold outline-none focus:ring-4 ring-amber-50 transition-all shadow-sm text-stone-900 text-base" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" className="w-full p-4 rounded-xl bg-white border border-stone-200 font-bold outline-none focus:ring-4 ring-amber-50 transition-all shadow-sm text-stone-900 text-base" onChange={e => setPass(e.target.value)} required />
          {errorMsg && <p className="text-[10px] text-red-600 font-bold bg-red-50 py-2 rounded-lg">{errorMsg}</p>}
          <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-stone-800 active:scale-95 transition-all">Connexion</button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;