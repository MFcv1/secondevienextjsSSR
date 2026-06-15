'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, ShieldCheck, X } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { functions } from '../config/firebase';
import { getFirebaseAuth, loadAuthModule } from '../config/firebaseLazy';
import { ToastProvider, useToast } from '../ui/Toast';

const PASSKEY_ENABLED_KEY = 'secondevie:passkey-enabled';
const PASSKEY_EMAIL_KEY = 'secondevie:passkey-email';

const getAuthErrorMessage = (error) => {
  if (error?.code === 'auth/email-already-in-use') return 'Cet email est deja associe a un compte. Connectez-vous.';
  if (error?.code === 'auth/weak-password') return 'Le mot de passe doit contenir au moins 6 caracteres.';
  if (error?.code === 'auth/invalid-email') return "L'adresse email n'est pas valide.";
  if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
    return 'Email ou mot de passe incorrect.';
  }
  if (error?.code === 'auth/unauthorized-domain') return 'Connexion bloquee: domaine non autorise dans Firebase.';
  if (error?.code === 'auth/operation-not-allowed') return 'Ce mode de connexion est desactive dans Firebase.';
  if (error?.code === 'auth/account-exists-with-different-credential') return 'Un compte existe deja avec un autre mode de connexion.';
  if (error?.code === 'auth/popup-blocked') return 'Fenetre de connexion bloquee par le navigateur.';
  if (error?.code === 'auth/popup-closed-by-user') return 'Connexion annulee.';
  return 'Une erreur est survenue.';
};

const normalizeEmailValue = (email) => String(email || '').trim().toLowerCase();

const readLocalPasskeyState = () => {
  if (typeof window === 'undefined') return { enabled: false, email: '' };
  try {
    return {
      enabled: window.localStorage.getItem(PASSKEY_ENABLED_KEY) === 'true',
      email: normalizeEmailValue(window.localStorage.getItem(PASSKEY_EMAIL_KEY) || ''),
    };
  } catch {
    return { enabled: false, email: '' };
  }
};

const saveLocalPasskeyState = (email) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PASSKEY_ENABLED_KEY, 'true');
    window.localStorage.setItem(PASSKEY_EMAIL_KEY, normalizeEmailValue(email));
  } catch {
    // Local storage is only a display hint; passkey security stays server-side.
  }
};

const clearLocalPasskeyState = () => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PASSKEY_ENABLED_KEY);
    window.localStorage.removeItem(PASSKEY_EMAIL_KEY);
  } catch {
    // Ignore private browsing/localStorage failures.
  }
};

const getPasskeySupportMessage = async () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Passkey indisponible hors navigateur.';
  }
  if (!window.isSecureContext) {
    return 'Passkey disponible uniquement en contexte HTTPS ou localhost.';
  }
  if (!window.PublicKeyCredential || !navigator.credentials?.create) {
    return 'Ce navigateur ne propose pas WebAuthn.';
  }
  if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!available) return 'Aucun authentificateur local disponible sur cet appareil.';
  }
  return null;
};

const registerPasskey = async () => {
  const supportMessage = await getPasskeySupportMessage();
  if (supportMessage) throw new Error(supportMessage);

  const { startRegistration } = await import('@simplewebauthn/browser');
  const generateOptions = httpsCallable(functions, 'generatePasskeyRegistrationOptions');
  const verifyRegistration = httpsCallable(functions, 'verifyPasskeyRegistration');
  const optionsResult = await generateOptions({ origin: window.location.origin });
  const response = await startRegistration({ optionsJSON: optionsResult.data.options });
  const result = await verifyRegistration({ response });
  if (!result.data?.success) throw new Error('Passkey non valide.');
};

const preparePasskeyAuthentication = async (email) => {
  const supportMessage = await getPasskeySupportMessage();
  if (supportMessage) throw new Error(supportMessage);

  const normalizedEmail = normalizeEmailValue(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Saisissez votre email avant la connexion rapide.');
  }

  const generateOptions = httpsCallable(functions, 'generatePasskeyAuthenticationOptions');
  const [{ startAuthentication }, optionsResult] = await Promise.all([
    import('@simplewebauthn/browser'),
    generateOptions({
      email: normalizedEmail,
      origin: window.location.origin,
    }),
    getFirebaseAuth(),
    loadAuthModule(),
  ]);
  return {
    email: normalizedEmail,
    options: optionsResult.data.options,
    startAuthentication,
  };
};

const loginWithPasskey = async (email, preparedAuthentication = null) => {
  const normalizedEmail = normalizeEmailValue(email);
  const prepared = preparedAuthentication?.email === normalizedEmail
    ? preparedAuthentication
    : await preparePasskeyAuthentication(normalizedEmail);

  const verifyAuthentication = httpsCallable(functions, 'verifyPasskeyAuthentication');
  const response = await prepared.startAuthentication({ optionsJSON: prepared.options });
  const result = await verifyAuthentication({
    challenge: prepared.options.challenge,
    response,
  });
  if (!result.data?.token) throw new Error('Token passkey manquant.');

  const [auth, module] = await Promise.all([getFirebaseAuth(), loadAuthModule()]);
  return {
    email: normalizedEmail,
    signInPromise: module.signInWithCustomToken(auth, result.data.token),
  };
};

export function LegacyLoginModalContent({ open, onOpenChange }) {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, verifyEmail } = useAuth();
  const toast = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAuthSuccess, setShowAuthSuccess] = useState(false);
  const [passkeyUser, setPasskeyUser] = useState(null);
  const [passkeyStatus, setPasskeyStatus] = useState('idle');
  const [passkeyMessage, setPasskeyMessage] = useState('');
  const [emailVerificationMessage, setEmailVerificationMessage] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [hasLocalPasskey, setHasLocalPasskey] = useState(false);
  const [usePasswordFallback, setUsePasswordFallback] = useState(false);
  const [preparedPasskeyAuth, setPreparedPasskeyAuth] = useState(null);
  const showPasskeyFirst = hasLocalPasskey && !isSignUp && !usePasswordFallback;

  useEffect(() => {
    if (!open) return undefined;

    const localPasskey = readLocalPasskeyState();
    setHasLocalPasskey(localPasskey.enabled);
    if (localPasskey.enabled && localPasskey.email) {
      setEmailValue((current) => current || localPasskey.email);
    }

    const scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${scrollY}px`;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open || !showPasskeyFirst || !emailValue) {
      setPreparedPasskeyAuth(null);
      return undefined;
    }

    let cancelled = false;
    const normalizedEmail = normalizeEmailValue(emailValue);

    preparePasskeyAuthentication(normalizedEmail)
      .then((prepared) => {
        if (!cancelled) setPreparedPasskeyAuth(prepared);
      })
      .catch((error) => {
        if (cancelled) return;
        setPreparedPasskeyAuth(null);
        if (error?.code === 'functions/not-found') {
          clearLocalPasskeyState();
          setHasLocalPasskey(false);
          setUsePasswordFallback(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [emailValue, open, showPasskeyFirst]);

  if (!open) return null;

  const close = () => {
    setShowAuthSuccess(false);
    setPasskeyUser(null);
    setPasskeyStatus('idle');
    setPasskeyMessage('');
    setEmailVerificationMessage('');
    setUsePasswordFallback(false);
    setPreparedPasskeyAuth(null);
    onOpenChange(false);
  };

  const offerPasskeyOrClose = (user) => {
    if (!user || user.isAnonymous) {
      close();
      return;
    }
    setPasskeyUser(user);
    setPasskeyStatus('idle');
    setPasskeyMessage('');
  };

  const handleCreatePasskey = async () => {
    if (!passkeyUser) return;
    setPasskeyStatus('pending');
    setPasskeyMessage('');
    try {
      await registerPasskey();
      saveLocalPasskeyState(passkeyUser.email);
      setHasLocalPasskey(true);
      setPasskeyStatus('success');
      setPasskeyMessage('Connexion rapide activee sur cet appareil.');
    } catch (error) {
      setPasskeyStatus('error');
      setPasskeyMessage(error?.message || 'Passkey indisponible sur cet appareil.');
    }
  };

  const handleSocialLogin = async (login) => {
    try {
      const result = await login();
      offerPasskeyOrClose(result?.user);
    } catch (error) {
      toast(getAuthErrorMessage(error), { type: 'error' });
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyStatus('pending');
    setPasskeyMessage('');
    try {
      const result = await loginWithPasskey(emailValue, preparedPasskeyAuth);
      saveLocalPasskeyState(result?.email || emailValue);
      close();
      result.signInPromise.catch((error) => {
        console.error('Passkey Firebase sign-in error:', error);
      });
    } catch (error) {
      if (error?.code === 'functions/not-found') {
        clearLocalPasskeyState();
        setHasLocalPasskey(false);
        setUsePasswordFallback(true);
      }
      setPasskeyStatus('error');
      setPasskeyMessage(error?.message || 'Connexion rapide indisponible.');
      toast(error?.message || 'Connexion rapide indisponible.', { type: 'error' });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') || '');
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    try {
      if (isSignUp) {
        if (password !== confirmPassword) throw new Error('password_mismatch');
        const userCredential = await signupWithEmail(email, password);
        setPasskeyUser(userCredential.user);
        setShowAuthSuccess(true);
        setEmailVerificationMessage("Envoi du lien de confirmation en cours...");
        verifyEmail(userCredential.user)
          .then(() => {
            setEmailVerificationMessage("Un lien de confirmation vient d'etre envoye. Pensez a regarder dans vos spams.");
          })
          .catch((error) => {
            console.error('Email verification send error:', error);
            setEmailVerificationMessage("Compte cree. Le lien de confirmation n'a pas pu etre envoye pour le moment.");
          });
      } else {
        const userCredential = await loginWithEmail(email, password);
        offerPasskeyOrClose(userCredential?.user);
      }
    } catch (error) {
      if (error?.message === 'password_mismatch') {
        toast('Les mots de passe ne correspondent pas.', { type: 'error' });
      } else {
        toast(getAuthErrorMessage(error), { type: 'error' });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#0F0F11] md:bg-stone-900/80 md:p-6 md:backdrop-blur-xl"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Connexion Seconde Vie"
    >
      <button
        type="button"
        onClick={close}
        className="absolute right-4 top-4 z-[3010] flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-stone-500 transition-all hover:bg-black/40 hover:text-white md:right-8 md:top-8"
        aria-label="Fermer la connexion"
      >
        <X size={20} />
      </button>

      <div className="relative flex h-[100dvh] w-full animate-in zoom-in-95 overflow-hidden bg-[#0F0F11] shadow-2xl md:h-auto md:max-h-[85vh] md:max-w-5xl md:rounded-[2rem]">
        <div className="relative hidden w-1/2 bg-black md:block">
          <video src="/video/login-bg.mp4" autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0F0F11]" />
        </div>

        <div className="safe-pb-auth safe-pt-auth flex w-full flex-col justify-center overflow-y-auto px-6 text-white md:w-1/2 md:px-14">
          {showAuthSuccess ? (
            <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold tracking-tight text-white">Verifiez vos emails !</h3>
                <p className="px-2 text-sm font-medium leading-relaxed text-stone-400">
                  {emailVerificationMessage || "Compte cree. Vous pouvez activer la connexion rapide."}
                </p>
              </div>
              {passkeyUser ? (
                <div className="rounded-2xl border border-[#2A2A2E] bg-[#141417] p-4 text-left">
                  <div className="flex items-start gap-3">
                    <KeyRound size={18} className="mt-0.5 shrink-0 text-amber-400" />
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Connexion rapide/passkey</p>
                      <p className="text-xs leading-relaxed text-stone-400">
                        Activez Face ID, empreinte ou code appareil pour les prochaines connexions.
                      </p>
                    </div>
                  </div>
                  {passkeyMessage ? (
                    <p className={`mt-3 text-xs font-semibold ${passkeyStatus === 'success' ? 'text-emerald-400' : 'text-amber-300'}`}>
                      {passkeyMessage}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={handleCreatePasskey}
                    disabled={passkeyStatus === 'pending' || passkeyStatus === 'success'}
                    className="mt-4 w-full rounded-xl border border-[#2A2A2E] bg-white/5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {passkeyStatus === 'pending' ? 'Activation...' : passkeyStatus === 'success' ? 'Passkey activee' : 'Activer sur cet appareil'}
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={close}
                className="mt-4 w-full rounded-xl bg-[#24242B] py-4 font-bold tracking-wide text-white transition-all hover:bg-[#2F2F37]"
              >
                C'est compris
              </button>
            </div>
          ) : (
            <>
              {passkeyUser ? (
                <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-sm">
                    <ShieldCheck size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-white">Connexion reussie</h3>
                    <p className="px-2 text-sm font-medium leading-relaxed text-stone-400">
                      Vous pouvez continuer, ou activer la connexion rapide sur cet appareil.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#2A2A2E] bg-[#141417] p-4 text-left">
                    <div className="flex items-start gap-3">
                      <KeyRound size={18} className="mt-0.5 shrink-0 text-amber-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Connexion rapide/passkey</p>
                        <p className="text-xs leading-relaxed text-stone-400">
                          Activez Face ID, empreinte ou code appareil pour les prochaines connexions.
                        </p>
                      </div>
                    </div>
                    {passkeyMessage ? (
                      <p className={`mt-3 text-xs font-semibold ${passkeyStatus === 'success' ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {passkeyMessage}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleCreatePasskey}
                      disabled={passkeyStatus === 'pending' || passkeyStatus === 'success'}
                      className="mt-4 w-full rounded-xl border border-[#2A2A2E] bg-white/5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {passkeyStatus === 'pending' ? 'Activation...' : passkeyStatus === 'success' ? 'Passkey activee' : 'Activer sur cet appareil'}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    className="w-full rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200"
                  >
                    Continuer
                  </button>
                </div>
              ) : (
            <>
              <div className="mb-10 space-y-2 text-center md:text-left">
                <h3 id="form-title" className="text-2xl font-bold tracking-tight text-white md:text-3xl">
                  Bienvenue sur Seconde Vie
                </h3>
                <p className="text-sm leading-relaxed text-stone-400">
                  {isSignUp ? 'Creez votre espace client pour suivre vos commandes.' : 'Connectez-vous a votre espace client.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleSocialLogin(loginWithGoogle)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm font-bold text-white transition-all hover:bg-[#1f1f22]"
              >
                <span className="flex shrink-0 rounded-full bg-white p-0.5">
                  <img src="https://www.google.com/favicon.ico" className="h-[14px] w-[14px]" alt="" />
                </span>
                <span>Continuer avec Google</span>
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#2A2A2E]" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                  {showPasskeyFirst ? 'Connexion locale' : 'Ou par email'}
                </span>
                <div className="h-px flex-1 bg-[#2A2A2E]" />
              </div>

              {showPasskeyFirst ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyStatus === 'pending'}
                    className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm font-bold text-amber-100 transition-all hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound size={16} />
                    <span>{passkeyStatus === 'pending' ? 'Verification...' : 'Connexion rapide sur cet appareil'}</span>
                  </button>
                  {passkeyMessage && !passkeyUser ? (
                    <p className="text-center text-xs font-semibold text-amber-300">{passkeyMessage}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setUsePasswordFallback(true);
                      setPasskeyStatus('idle');
                      setPasskeyMessage('');
                    }}
                    className="w-full text-center text-xs font-bold text-stone-400 transition-colors hover:text-white"
                  >
                    Utiliser email et mot de passe
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" data-signup={isSignUp ? 'true' : 'false'}>
                  <input
                    name="email"
                    type="email"
                    placeholder="Adresse email"
                    value={emailValue}
                    onChange={(event) => setEmailValue(event.target.value)}
                    className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-[#4f4f56]"
                    required
                    autoComplete="email"
                  />

                  <label className="relative block">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mot de passe"
                      className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 pr-12 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-[#4f4f56]"
                      required
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 transition-colors hover:text-white"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </label>

                  {isSignUp ? (
                    <label className="relative block">
                      <input
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirmer le mot de passe"
                        className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 pr-12 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-[#4f4f56]"
                        required
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 transition-colors hover:text-white"
                        aria-label={showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </label>
                  ) : null}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200"
                  >
                    {isSignUp ? 'Creer mon compte' : 'Connexion'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsSignUp((value) => !value);
                  setUsePasswordFallback(false);
                  setPasskeyMessage('');
                  setPasskeyStatus('idle');
                }}
                className="mt-6 w-full text-center text-xs font-bold text-stone-400 transition-colors hover:text-white"
              >
                {isSignUp ? 'J’ai deja un compte' : 'Creer un compte client'}
              </button>

              <div className="mt-8 text-center text-[11px] leading-relaxed text-stone-500">
                Votre connexion implique l'acceptation des{' '}
                <button type="button" className="font-bold text-stone-400 hover:text-white">Conditions</button>
                {' '}et de la{' '}
                <button type="button" className="font-bold text-stone-400 hover:text-white">Politique de confidentialite</button>
              </div>
            </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegacyLoginModalIsland({
  buttonClassName = '',
  buttonLabel = 'Connexion',
  buttonAriaLabel = 'Ouvrir la connexion',
  showShieldIcon = false,
  open,
  onOpenChange,
  renderTrigger = true,
} = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof open === 'boolean';
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = (nextOpen) => {
    if (!isControlled) setInternalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  return (
    <>
      {renderTrigger ? (
        <button type="button" className={buttonClassName} onClick={() => setOpen(true)} aria-label={buttonAriaLabel}>
          {showShieldIcon ? <ShieldCheck size={14} className="text-stone-400 transition-colors group-hover:text-amber-500" /> : null}
          <span className="text-[10px] font-black uppercase tracking-[0.16em]">{buttonLabel}</span>
        </button>
      ) : null}
      {isOpen ? (
        <AuthProvider>
          <ToastProvider>
            <LegacyLoginModalContent open={isOpen} onOpenChange={setOpen} />
          </ToastProvider>
        </AuthProvider>
      ) : null}
    </>
  );
}
