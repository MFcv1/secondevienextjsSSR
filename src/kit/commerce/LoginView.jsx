import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const getGoogleLoginErrorMessage = (error) => {
  if (error?.code === 'auth/unauthorized-domain') {
    return 'Connexion Google bloquee: domaine App Hosting non autorise dans Firebase Authentication.';
  }
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Connexion Google desactivee dans Firebase Authentication.';
  }
  if (error?.code === 'auth/popup-blocked') return 'Popup Google bloquee par le navigateur.';
  if (error?.code === 'auth/popup-closed-by-user') return 'Connexion Google annulee.';
  return `Erreur Google : ${error?.message || 'connexion impossible'}`;
};

function LoginView({
  onSuccess = () => {},
  title = 'Bienvenue sur Seconde Vie',
  subtitle = "Acces reserve a l'administration.",
  emailPlaceholder = 'Adresse email',
}) {
  const { loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handle = async (event) => {
    event.preventDefault();
    try {
      await loginWithEmail(email, pass);
      onSuccess();
    } catch {
      setErrorMsg('Identifiants incorrects.');
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#0F0F11] p-0 text-white md:bg-stone-900/80 md:p-6">
      <div className="relative flex h-[100dvh] w-full animate-in zoom-in-95 overflow-hidden bg-[#0F0F11] shadow-2xl md:h-auto md:min-h-[620px] md:max-w-5xl md:rounded-[2rem]">
        <div className="relative hidden w-1/2 bg-black md:block">
          <video src="/video/login-bg.mp4" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0F0F11]" />
        </div>

        <div className="safe-pb-auth safe-pt-auth flex w-full flex-col justify-center overflow-y-auto px-6 md:w-1/2 md:px-14">
          <div className="mb-10 space-y-3 text-center md:text-left">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-stone-200 md:mx-0">
              <Lock size={22} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">{title}</h2>
              <p className="text-sm leading-relaxed text-stone-400">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                await loginWithGoogle();
                onSuccess();
              } catch (error) {
                setErrorMsg(getGoogleLoginErrorMessage(error));
              }
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm font-bold text-white transition-all hover:bg-[#1f1f22]"
          >
            <span className="flex shrink-0 rounded-full bg-white p-0.5">
              <img src="https://www.google.com/favicon.ico" className="h-[14px] w-[14px]" alt="" />
            </span>
            <span>Continuer avec Google</span>
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[#2A2A2E]" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">Acces admin</span>
            <div className="h-px flex-1 bg-[#2A2A2E]" />
          </div>

          <form onSubmit={handle} className="space-y-4">
            <input
              type="email"
              placeholder={emailPlaceholder}
              className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-[#4f4f56]"
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Mot de passe"
              className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-[#4f4f56]"
              onChange={(event) => setPass(event.target.value)}
              required
              autoComplete="current-password"
            />
            {errorMsg ? (
              <p className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-center text-xs font-semibold text-amber-200">
                {errorMsg}
              </p>
            ) : null}
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200 active:scale-[0.99]"
            >
              Connexion
            </button>
          </form>

          <div className="mt-8 text-center text-[11px] leading-relaxed text-stone-500">
            Espace reserve a l'administration Seconde Vie.
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
