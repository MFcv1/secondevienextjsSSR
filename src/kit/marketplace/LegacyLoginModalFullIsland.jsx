'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Mail, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { functions } from '../config/firebase';
import { getFirebaseAuth, loadAuthModule } from '../config/firebaseLazy';
import { ToastProvider, useToast } from '../ui/Toast';

const PASSKEY_ENABLED_KEY = 'secondevie:passkey-enabled';
const PASSKEY_EMAIL_KEY = 'secondevie:passkey-email';
const PASSKEY_EMAILS_KEY = 'secondevie:passkey-emails';

const getAuthErrorMessage = (error) => {
  if (error?.code === 'auth/invalid-email') return "L'adresse email n'est pas valide.";
  if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
    return 'Identifiants incorrects.';
  }
  if (error?.code === 'auth/unauthorized-domain') return 'Connexion bloquee: domaine non autorise dans Firebase.';
  if (error?.code === 'auth/operation-not-allowed') return 'Ce mode de connexion est desactive dans Firebase.';
  if (error?.code === 'auth/account-exists-with-different-credential') return 'Un compte existe deja avec un autre mode de connexion.';
  if (error?.code === 'auth/popup-blocked') return 'Fenetre de connexion bloquee par le navigateur.';
  if (error?.code === 'auth/popup-closed-by-user') return 'Connexion annulee.';
  return 'Une erreur est survenue.';
};

const normalizeEmailValue = (email) => String(email || '').trim().toLowerCase();

const maskEmail = (email) => {
  const normalized = normalizeEmailValue(email);
  const [name = '', domain = ''] = normalized.split('@');
  if (!name || !domain) return normalized;
  const visibleStart = name.slice(0, Math.min(2, name.length));
  const visibleEnd = name.length > 3 ? name.slice(-1) : '';
  return `${visibleStart}${'*'.repeat(Math.max(3, name.length - visibleStart.length - visibleEnd.length))}${visibleEnd}@${domain}`;
};

const readLocalPasskeyState = () => {
  if (typeof window === 'undefined') return { enabled: false, email: '', emails: [] };
  try {
    const legacyEmail = normalizeEmailValue(window.localStorage.getItem(PASSKEY_EMAIL_KEY) || '');
    const parsedEmails = JSON.parse(window.localStorage.getItem(PASSKEY_EMAILS_KEY) || '[]');
    const emails = Array.from(new Set([
      ...(Array.isArray(parsedEmails) ? parsedEmails.map(normalizeEmailValue) : []),
      legacyEmail,
    ].filter(Boolean)));

    return {
      enabled: window.localStorage.getItem(PASSKEY_ENABLED_KEY) === 'true',
      email: emails[0] || '',
      emails,
    };
  } catch {
    return { enabled: false, email: '', emails: [] };
  }
};

const saveLocalPasskeyState = (email) => {
  if (typeof window === 'undefined') return;
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) return;
  try {
    const currentState = readLocalPasskeyState();
    const emails = [
      normalizedEmail,
      ...currentState.emails.filter((storedEmail) => storedEmail !== normalizedEmail),
    ].slice(0, 5);

    window.localStorage.setItem(PASSKEY_ENABLED_KEY, 'true');
    window.localStorage.setItem(PASSKEY_EMAIL_KEY, normalizedEmail);
    window.localStorage.setItem(PASSKEY_EMAILS_KEY, JSON.stringify(emails));
  } catch {
    // Local storage is only a display hint; passkey security stays server-side.
  }
};

const hasLocalPasskeyForEmail = (email) => {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) return false;
  return readLocalPasskeyState().emails.includes(normalizedEmail);
};

const clearLocalPasskeyState = (email = '') => {
  if (typeof window === 'undefined') return;
  try {
    const normalizedEmail = normalizeEmailValue(email);
    if (!normalizedEmail) {
      window.localStorage.removeItem(PASSKEY_ENABLED_KEY);
      window.localStorage.removeItem(PASSKEY_EMAIL_KEY);
      window.localStorage.removeItem(PASSKEY_EMAILS_KEY);
      return;
    }

    const emails = readLocalPasskeyState().emails.filter((storedEmail) => storedEmail !== normalizedEmail);
    if (emails.length === 0) {
      window.localStorage.removeItem(PASSKEY_ENABLED_KEY);
      window.localStorage.removeItem(PASSKEY_EMAIL_KEY);
      window.localStorage.removeItem(PASSKEY_EMAILS_KEY);
      return;
    }

    window.localStorage.setItem(PASSKEY_ENABLED_KEY, 'true');
    window.localStorage.setItem(PASSKEY_EMAIL_KEY, emails[0]);
    window.localStorage.setItem(PASSKEY_EMAILS_KEY, JSON.stringify(emails));
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

const loginWithPasskey = async (email, preparedAuthentication = null, onStepChange = null) => {
  const normalizedEmail = normalizeEmailValue(email);
  const prepared = preparedAuthentication?.email === normalizedEmail
    ? preparedAuthentication
    : await preparePasskeyAuthentication(normalizedEmail);

  const verifyAuthentication = httpsCallable(functions, 'verifyPasskeyAuthentication');
  onStepChange?.('biometric');
  const response = await prepared.startAuthentication({ optionsJSON: prepared.options });
  onStepChange?.('verifying');
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
  const { loginWithGoogle, loginWithCustomToken } = useAuth();
  const toast = useToast();
  const [passkeyUser, setPasskeyUser] = useState(null);
  const [passkeyStatus, setPasskeyStatus] = useState('idle');
  const [passkeyMessage, setPasskeyMessage] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [hasLocalPasskey, setHasLocalPasskey] = useState(false);
  const [localPasskeyEmails, setLocalPasskeyEmails] = useState([]);
  const [useEmailCodeFallback, setUseEmailCodeFallback] = useState(false);
  const [showPasskeyAccountChoices, setShowPasskeyAccountChoices] = useState(false);
  const [preparedPasskeyAuth, setPreparedPasskeyAuth] = useState(null);
  const [passkeyLoginStep, setPasskeyLoginStep] = useState('idle');
  const [otpStep, setOtpStep] = useState('email');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpStatus, setOtpStatus] = useState('idle');
  const [otpMessage, setOtpMessage] = useState('');
  const [resendAfter, setResendAfter] = useState(0);
  const showPasskeyFirst = hasLocalPasskey && !useEmailCodeFallback;
  const passkeyLoginLabel = passkeyStatus === 'pending'
    ? (passkeyLoginStep === 'verifying' ? 'Verification...' : 'Empreinte...')
    : 'Connexion rapide sur cet appareil';

  useEffect(() => {
    if (!open) return undefined;

    const localPasskey = readLocalPasskeyState();
    setHasLocalPasskey(localPasskey.enabled);
    setLocalPasskeyEmails(localPasskey.emails);
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
          clearLocalPasskeyState(normalizedEmail);
          const localPasskey = readLocalPasskeyState();
          setEmailValue(localPasskey.email);
          setHasLocalPasskey(localPasskey.enabled);
          setLocalPasskeyEmails(localPasskey.emails);
          setUseEmailCodeFallback(!localPasskey.enabled);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [emailValue, open, showPasskeyFirst]);

  useEffect(() => {
    if (!open || resendAfter <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendAfter((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [open, resendAfter]);

  if (!open) return null;

  const close = () => {
    setPasskeyUser(null);
    setPasskeyStatus('idle');
    setPasskeyMessage('');
    setUseEmailCodeFallback(false);
    setShowPasskeyAccountChoices(false);
    setPreparedPasskeyAuth(null);
    setPasskeyLoginStep('idle');
    setOtpStep('email');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpStatus('idle');
    setOtpMessage('');
    setResendAfter(0);
    onOpenChange(false);
  };

  const offerPasskeyOrClose = (user) => {
    if (!user || user.isAnonymous) {
      close();
      return;
    }
    if (hasLocalPasskeyForEmail(user.email)) {
      saveLocalPasskeyState(user.email);
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
      setLocalPasskeyEmails(readLocalPasskeyState().emails);
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
    setPasskeyLoginStep('biometric');
    setPasskeyMessage('');
    try {
      const result = await loginWithPasskey(emailValue, preparedPasskeyAuth, setPasskeyLoginStep);
      saveLocalPasskeyState(result?.email || emailValue);
      setLocalPasskeyEmails(readLocalPasskeyState().emails);
      close();
      result.signInPromise.catch((error) => {
        console.error('Passkey Firebase sign-in error:', error);
      });
    } catch (error) {
      if (error?.code === 'functions/not-found') {
        clearLocalPasskeyState(emailValue);
        const localPasskey = readLocalPasskeyState();
        setEmailValue(localPasskey.email);
        setHasLocalPasskey(localPasskey.enabled);
        setLocalPasskeyEmails(localPasskey.emails);
        setUseEmailCodeFallback(!localPasskey.enabled);
      }
      setPasskeyLoginStep('idle');
      setPasskeyStatus('error');
      setPasskeyMessage(error?.message || 'Connexion rapide indisponible.');
      toast(error?.message || 'Connexion rapide indisponible.', { type: 'error' });
    }
  };

  const requestCustomerLoginCode = async (event) => {
    event.preventDefault();
    const email = normalizeEmailValue(emailValue);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("Saisissez une adresse email valide.", { type: 'error' });
      return;
    }

    setOtpStatus('sending');
    setOtpMessage('');
    try {
      const sendOtp = httpsCallable(functions, 'sendCustomerLoginOtp');
      const result = await sendOtp({ email });
      setOtpStep('code');
      setOtpDigits(['', '', '', '', '', '']);
      setResendAfter(Number(result.data?.resendAfterSeconds || 60));
      setOtpStatus('sent');
      setOtpMessage(`Code envoye a ${maskEmail(email)}.`);
    } catch (error) {
      const message = error?.message || "Impossible d'envoyer le code pour le moment.";
      setOtpStatus('error');
      setOtpMessage(message);
      toast(message, { type: 'error' });
    }
  };

  const verifyCustomerLoginCode = async (event) => {
    event.preventDefault();
    const email = normalizeEmailValue(emailValue);
    const code = otpDigits.join('');
    if (!/^\d{6}$/.test(code)) {
      toast('Saisissez les 6 chiffres du code.', { type: 'error' });
      return;
    }

    setOtpStatus('verifying');
    setOtpMessage('');
    try {
      const verifyOtp = httpsCallable(functions, 'verifyCustomerLoginOtp');
      const result = await verifyOtp({ email, code });
      if (!result.data?.token) throw new Error('Token de connexion manquant.');
      const userCredential = await loginWithCustomToken(result.data.token);
      setOtpStatus('success');
      setOtpMessage('Email verifie. Connexion ouverte.');
      offerPasskeyOrClose(userCredential?.user);
    } catch (error) {
      const message = error?.message || 'Code invalide ou expire.';
      setOtpStatus('error');
      setOtpMessage(message);
      toast(message, { type: 'error' });
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const nextValue = String(value || '').replace(/\D/g, '').slice(-1);
    setOtpDigits((current) => current.map((digit, digitIndex) => (
      digitIndex === index ? nextValue : digit
    )));
    if (nextValue && typeof document !== 'undefined') {
      document.querySelector(`[data-otp-index="${index + 1}"]`)?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedCode.length < 2) return;
    event.preventDefault();
    setOtpDigits(Array.from({ length: 6 }, (_, index) => pastedCode[index] || ''));
    document.querySelector(`[data-otp-index="${Math.min(pastedCode.length, 5)}"]`)?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key !== 'Backspace' || otpDigits[index] || index === 0) return;
    document.querySelector(`[data-otp-index="${index - 1}"]`)?.focus();
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
                  Entrez votre email, puis le code a 6 chiffres recu dans votre boite mail.
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
                  {showPasskeyFirst ? 'Connexion locale' : 'Code par email'}
                </span>
                <div className="h-px flex-1 bg-[#2A2A2E]" />
              </div>

              {showPasskeyFirst ? (
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={passkeyStatus === 'pending'}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm font-bold text-amber-100 transition-all hover:bg-amber-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <KeyRound size={16} className={passkeyStatus === 'pending' ? 'animate-pulse' : ''} />
                    <span>{passkeyLoginLabel}</span>
                  </button>
                  <div className="text-center text-[11px] font-semibold text-stone-500">
                    <span>Pour {emailValue}</span>
                    {localPasskeyEmails.length > 1 ? (
                      <>
                        <span className="mx-2 text-stone-700">.</span>
                        <button
                          type="button"
                          onClick={() => setShowPasskeyAccountChoices((value) => !value)}
                          className="text-amber-200 transition-colors hover:text-amber-100"
                        >
                          Changer
                        </button>
                      </>
                    ) : null}
                  </div>
                  {passkeyMessage && !passkeyUser ? (
                    <p className="text-center text-xs font-semibold text-amber-300">{passkeyMessage}</p>
                  ) : null}
                  {localPasskeyEmails.length > 1 && showPasskeyAccountChoices ? (
                    <div className="space-y-1 rounded-2xl border border-[#2A2A2E] bg-[#101014] p-2">
                      {localPasskeyEmails.map((storedEmail) => (
                        <button
                          key={storedEmail}
                          type="button"
                          onClick={() => {
                            setEmailValue(storedEmail);
                            setPasskeyStatus('idle');
                            setPasskeyLoginStep('idle');
                            setPasskeyMessage('');
                            setPreparedPasskeyAuth(null);
                            setShowPasskeyAccountChoices(false);
                          }}
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                            storedEmail === emailValue
                              ? 'bg-amber-400/10 text-amber-100'
                              : 'text-stone-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {storedEmail}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setUseEmailCodeFallback(true);
                      setShowPasskeyAccountChoices(false);
                      setPasskeyStatus('idle');
                      setPasskeyLoginStep('idle');
                      setPasskeyMessage('');
                    }}
                    className="w-full text-center text-xs font-bold text-stone-400 transition-colors hover:text-white"
                  >
                    Recevoir un code par email
                  </button>
                </div>
              ) : otpStep === 'code' ? (
                  <form onSubmit={verifyCustomerLoginCode} className="space-y-4">
                    <div className="rounded-2xl border border-[#2A2A2E] bg-[#141417] p-4">
                      <div className="flex items-start gap-3">
                        <Mail size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-bold text-white">Code envoye</p>
                          <p className="text-xs leading-relaxed text-stone-400">
                            Saisissez le code recu a {maskEmail(emailValue)}.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-6 gap-2" onPaste={handleOtpPaste}>
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          data-otp-index={index}
                          type="text"
                          inputMode="numeric"
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          value={digit}
                          onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                          onKeyDown={(event) => handleOtpKeyDown(index, event)}
                          className="h-12 rounded-xl border border-[#2A2A2E] bg-[#141417] text-center text-lg font-black text-white outline-none transition-all placeholder:text-stone-500 focus:border-emerald-300/80 md:h-14"
                          aria-label={`Chiffre ${index + 1} du code`}
                          maxLength={1}
                        />
                      ))}
                    </div>
                    {otpMessage ? (
                      <p className={`text-center text-xs font-semibold ${otpStatus === 'error' ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {otpMessage}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={otpStatus === 'verifying'}
                      className="w-full rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpStatus === 'verifying' ? 'Verification...' : 'Se connecter'}
                    </button>
                    <div className="flex items-center justify-between gap-3 text-xs font-bold text-stone-400">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStep('email');
                          setOtpDigits(['', '', '', '', '', '']);
                          setOtpMessage('');
                          setOtpStatus('idle');
                        }}
                        className="transition-colors hover:text-white"
                      >
                        Modifier l'email
                      </button>
                      <button
                        type="button"
                        onClick={requestCustomerLoginCode}
                        disabled={resendAfter > 0 || otpStatus === 'sending'}
                        className="inline-flex items-center gap-1 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RotateCcw size={13} />
                        {resendAfter > 0 ? `Renvoyer dans ${resendAfter}s` : 'Renvoyer le code'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={requestCustomerLoginCode} className="space-y-4">
                    <input
                      name="email"
                      type="email"
                      placeholder="Adresse email"
                      value={emailValue}
                      onChange={(event) => {
                        setEmailValue(event.target.value);
                        setOtpMessage('');
                      }}
                      className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-[#4f4f56]"
                      required
                      autoComplete="email"
                    />
                    {otpMessage ? (
                      <p className={`text-center text-xs font-semibold ${otpStatus === 'error' ? 'text-amber-300' : 'text-emerald-300'}`}>
                        {otpMessage}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={otpStatus === 'sending'}
                      className="w-full rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {otpStatus === 'sending' ? 'Envoi du code...' : 'Recevoir mon code'}
                    </button>
                  </form>
                )
              }

              <button
                type="button"
                onClick={() => {
                  setOtpStep('email');
                  setOtpDigits(['', '', '', '', '', '']);
                  setOtpMessage('');
                  setUseEmailCodeFallback(false);
                  setShowPasskeyAccountChoices(false);
                  setPasskeyMessage('');
                  setPasskeyStatus('idle');
                  setPasskeyLoginStep('idle');
                }}
                className="mt-6 w-full text-center text-xs font-bold text-stone-400 transition-colors hover:text-white"
              >
                Code email = connexion et creation de compte
              </button>

              <div className="mt-8 text-center text-[11px] leading-relaxed text-stone-500">
                Votre connexion implique l'acceptation des{' '}
                <button type="button" className="font-bold text-stone-400 hover:text-white">Conditions</button>
                {' '}et de la{' '}
                <button type="button" className="font-bold text-stone-400 hover:text-white">Politique de confidentialite</button>
              </div>
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
