'use client';

import { useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2, Mail, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { functions } from '../config/firebase';
import { getFunctionTarget } from '../config/functionTargets';
import { getFirebaseAuth, loadAuthModule } from '../config/firebaseLazy';
import { getGoogleAuthErrorMessage } from '../auth/googleAuthDiagnostics';
import { logClientPerf, startClientPerf } from '../shared/clientPerf';
import { ToastProvider, useToast } from '../ui/Toast';

const PASSKEY_ENABLED_KEY = 'secondevie:passkey-enabled';
const PASSKEY_EMAIL_KEY = 'secondevie:passkey-email';
const PASSKEY_EMAILS_KEY = 'secondevie:passkey-emails';
const PASSKEY_PREPARED_TTL_MS = 4 * 60 * 1000;

const normalizeEmailValue = (email) => String(email || '').trim().toLowerCase();

const preloadOtpSignInRuntime = () => {
  if (typeof window === 'undefined') return;
  Promise.all([getFirebaseAuth(), loadAuthModule()]).catch((error) => {
    console.warn('OTP sign-in runtime preload failed:', error);
  });
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

const getPasskeySupportMessage = async ({ registration = false } = {}) => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'Passkey indisponible hors navigateur.';
  }
  if (!window.isSecureContext) {
    return 'Passkey disponible uniquement en contexte HTTPS ou localhost.';
  }
  const credentialMethod = registration ? navigator.credentials?.create : navigator.credentials?.get;
  if (!window.PublicKeyCredential || typeof credentialMethod !== 'function') {
    return 'Ce navigateur ne propose pas WebAuthn.';
  }
  return null;
};

const preparePasskeyRegistration = async () => {
  const supportMessage = await getPasskeySupportMessage({ registration: true });
  if (supportMessage) throw new Error(supportMessage);

  const generateOptions = httpsCallable(functions, getFunctionTarget('generatePasskeyRegistrationOptions'));
  const generateStartedAt = startClientPerf();
  const [{ startRegistration }, optionsResult] = await Promise.all([
    import('@simplewebauthn/browser'),
    generateOptions({ origin: window.location.origin }),
  ]);
  logClientPerf('passkey.registration.generateOptions', generateStartedAt, { phase: 'success' });
  return {
    createdAt: Date.now(),
    options: optionsResult.data.options,
    startRegistration,
  };
};

const registerPasskey = async (preparedRegistration = null, onStepChange = null) => {
  const prepared = preparedRegistration && Date.now() - preparedRegistration.createdAt < PASSKEY_PREPARED_TTL_MS
    ? preparedRegistration
    : null;
  const registration = prepared || await (async () => {
    onStepChange?.('preparing');
    return preparePasskeyRegistration();
  })();
  const verifyRegistration = httpsCallable(functions, getFunctionTarget('verifyPasskeyRegistration'));

  onStepChange?.('confirming');
  const response = await registration.startRegistration({ optionsJSON: registration.options });
  onStepChange?.('verifying');
  const verifyStartedAt = startClientPerf();
  const result = await verifyRegistration({ response });
  logClientPerf('passkey.registration.verify', verifyStartedAt, { phase: 'success' });
  if (!result.data?.success) throw new Error('Passkey non valide.');
};

const preparePasskeyAuthentication = async (email) => {
  const supportMessage = await getPasskeySupportMessage();
  if (supportMessage) throw new Error(supportMessage);

  const normalizedEmail = normalizeEmailValue(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new Error('Saisissez votre email avant la connexion rapide.');
  }

  const generateOptions = httpsCallable(functions, getFunctionTarget('generatePasskeyAuthenticationOptions'));
  const generateStartedAt = startClientPerf();
  const [{ startAuthentication }, optionsResult] = await Promise.all([
    import('@simplewebauthn/browser'),
    generateOptions({
      email: normalizedEmail,
      origin: window.location.origin,
    }),
    getFirebaseAuth(),
    loadAuthModule(),
  ]);
  logClientPerf('passkey.authentication.generateOptions', generateStartedAt, { phase: 'success' });
  return {
    createdAt: Date.now(),
    email: normalizedEmail,
    options: optionsResult.data.options,
    startAuthentication,
  };
};

const loginWithPasskey = async (email, preparedAuthentication = null, onStepChange = null) => {
  const normalizedEmail = normalizeEmailValue(email);
  const prepared = preparedAuthentication?.email === normalizedEmail
    && Date.now() - Number(preparedAuthentication.createdAt || 0) < PASSKEY_PREPARED_TTL_MS
    ? preparedAuthentication
    : await preparePasskeyAuthentication(normalizedEmail);

  const verifyAuthentication = httpsCallable(functions, getFunctionTarget('verifyPasskeyAuthentication'));
  onStepChange?.('biometric');
  const response = await prepared.startAuthentication({ optionsJSON: prepared.options });
  onStepChange?.('verifying');
  const verifyStartedAt = startClientPerf();
  const result = await verifyAuthentication({
    challenge: prepared.options.challenge,
    response,
  });
  logClientPerf('passkey.authentication.verify', verifyStartedAt, { phase: 'success' });
  if (!result.data?.token) throw new Error('Token passkey manquant.');

  return {
    email: normalizedEmail,
    token: result.data.token,
  };
};

export function LegacyLoginModalContent({ open, onOpenChange, onAuthenticated }) {
  const { preloadGoogleLogin, loginWithGoogle, loginWithCustomToken } = useAuth();
  const toast = useToast();
  const [googleStatus, setGoogleStatus] = useState('preparing');
  const [passkeyUser, setPasskeyUser] = useState(null);
  const [passkeyStatus, setPasskeyStatus] = useState('idle');
  const [passkeyMessage, setPasskeyMessage] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [localPasskeyEmails, setLocalPasskeyEmails] = useState([]);
  const [useEmailCodeFallback, setUseEmailCodeFallback] = useState(false);
  const [showPasskeyAccountChoices, setShowPasskeyAccountChoices] = useState(false);
  const [preparedPasskeyAuth, setPreparedPasskeyAuth] = useState(null);
  const [passkeyPrepareStatus, setPasskeyPrepareStatus] = useState('idle');
  const [preparedPasskeyRegistration, setPreparedPasskeyRegistration] = useState(null);
  const [passkeyRegistrationPrepareStatus, setPasskeyRegistrationPrepareStatus] = useState('idle');
  const [passkeyLoginStep, setPasskeyLoginStep] = useState('idle');
  const [passkeyRegistrationStep, setPasskeyRegistrationStep] = useState('idle');
  const [otpStep, setOtpStep] = useState('email');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpStatus, setOtpStatus] = useState('idle');
  const [otpMessage, setOtpMessage] = useState('');
  const [resendAfter, setResendAfter] = useState(0);
  const otpSendInFlightRef = useRef(false);
  const otpVerifyInFlightRef = useRef(false);
  const otpCustomTokenRef = useRef(null);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const normalizedEmailValue = normalizeEmailValue(emailValue);
  const showPasskeyFirst = passkeySupported
    && !useEmailCodeFallback
    && localPasskeyEmails.includes(normalizedEmailValue);
  const passkeyLoginLabel = passkeyStatus === 'pending'
    ? (
      passkeyLoginStep === 'signing-in'
        ? 'Connexion...'
        : passkeyLoginStep === 'verifying' ? 'Verification...' : 'Empreinte...'
    )
    : 'Connexion rapide sur cet appareil';
  const passkeyRegistrationLabel = passkeyStatus === 'pending'
    ? (
      passkeyRegistrationStep === 'verifying'
        ? 'Verification...'
        : passkeyRegistrationStep === 'confirming'
          ? 'Confirmez sur cet appareil'
          : 'Ouverture...'
    )
    : passkeyStatus === 'success' ? 'Passkey activee' : 'Activer sur cet appareil';
  const isPasskeyBusy = passkeyStatus === 'pending';
  const isPasskeyPreparing = passkeyPrepareStatus === 'preparing';
  const isOtpSending = otpStatus === 'sending';
  const isOtpVerifying = otpStatus === 'verifying';
  const isOtpSigningIn = otpStatus === 'signing-in';
  const isOtpBusy = isOtpSending || isOtpVerifying || isOtpSigningIn;

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    const localPasskey = readLocalPasskeyState();
    setLocalPasskeyEmails(localPasskey.emails);
    setUseEmailCodeFallback(!localPasskey.enabled);
    if (localPasskey.enabled && localPasskey.email) {
      setEmailValue((current) => current || localPasskey.email);
    }
    getPasskeySupportMessage().then((message) => setPasskeySupported(!message)).catch(() => setPasskeySupported(false));

    const scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.style.top = `-${scrollY}px`;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusableElements = Array.from(dialog.querySelectorAll([
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(','))).filter((element) => (
        element instanceof HTMLElement
        && element.getClientRects().length > 0
        && element.getAttribute('aria-hidden') !== 'true'
      ));

      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!dialog.contains(activeElement)) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      } else if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus({ preventScroll: true });
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('modal-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);

      const previousFocus = previouslyFocusedRef.current;
      window.requestAnimationFrame(() => {
        const fallbackFocus = document.querySelector('button[aria-label="Ouvrir le menu"]');
        if (previousFocus?.isConnected) {
          previousFocus.focus({ preventScroll: true });
        } else if (fallbackFocus instanceof HTMLElement) {
          fallbackFocus.focus({ preventScroll: true });
        }
      });
    };
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setGoogleStatus('preparing');
    void preloadGoogleLogin()
      .then(() => {
        if (!cancelled) setGoogleStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setGoogleStatus('preload-error');
      });
    return () => {
      cancelled = true;
    };
  }, [open, preloadGoogleLogin]);

  useEffect(() => {
    if (!open || !showPasskeyFirst || !emailValue) {
      setPreparedPasskeyAuth(null);
      setPasskeyPrepareStatus('idle');
      return undefined;
    }

    let cancelled = false;
    const normalizedEmail = normalizeEmailValue(emailValue);
    setPasskeyPrepareStatus('preparing');

    preparePasskeyAuthentication(normalizedEmail)
      .then((prepared) => {
        if (!cancelled) {
          setPreparedPasskeyAuth(prepared);
          setPasskeyPrepareStatus('ready');
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setPreparedPasskeyAuth(null);
        setPasskeyPrepareStatus('idle');
        if (error?.code === 'functions/not-found') {
          clearLocalPasskeyState(normalizedEmail);
          const localPasskey = readLocalPasskeyState();
          setEmailValue(localPasskey.email);
          setLocalPasskeyEmails(localPasskey.emails);
          setUseEmailCodeFallback(!localPasskey.enabled);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [emailValue, open, showPasskeyFirst]);

  const passkeyUserId = passkeyUser?.uid || null;
  useEffect(() => {
    if (!open || !passkeyUserId) {
      setPreparedPasskeyRegistration(null);
      setPasskeyRegistrationPrepareStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setPasskeyRegistrationPrepareStatus('preparing');

    preparePasskeyRegistration()
      .then((prepared) => {
        if (!cancelled) {
          setPreparedPasskeyRegistration(prepared);
          setPasskeyRegistrationPrepareStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreparedPasskeyRegistration(null);
          setPasskeyRegistrationPrepareStatus('idle');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, passkeyUserId]);

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
    setPreparedPasskeyRegistration(null);
    setPasskeyLoginStep('idle');
    setPasskeyRegistrationStep('idle');
    setOtpStep('email');
    setOtpDigits(['', '', '', '', '', '']);
    setOtpStatus('idle');
    setOtpMessage('');
    setResendAfter(0);
    otpSendInFlightRef.current = false;
    otpVerifyInFlightRef.current = false;
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
    setPasskeyPrepareStatus('idle');
    setPreparedPasskeyRegistration(null);
    setPasskeyRegistrationPrepareStatus('idle');
    setPasskeyRegistrationStep('idle');
  };

  const handleCreatePasskey = async () => {
    if (!passkeyUser) return;
    setPasskeyStatus('pending');
    setPasskeyRegistrationStep(
      passkeyRegistrationPrepareStatus === 'ready' && preparedPasskeyRegistration
        ? 'confirming'
        : 'preparing'
    );
    setPasskeyMessage('');
    try {
      const preparedRegistration = preparedPasskeyRegistration;
      setPreparedPasskeyRegistration(null);
      await registerPasskey(preparedRegistration, setPasskeyRegistrationStep);
      saveLocalPasskeyState(passkeyUser.email);
      setLocalPasskeyEmails(readLocalPasskeyState().emails);
      setPasskeyStatus('success');
      setPasskeyMessage('Connexion rapide activee sur cet appareil.');
      window.setTimeout(() => {
        onOpenChange(false);
      }, 450);
    } catch (error) {
      setPasskeyRegistrationStep('idle');
      setPasskeyStatus('error');
      setPasskeyMessage(error?.message || 'Passkey indisponible sur cet appareil.');
    }
  };

  const handleSocialLogin = async (login) => {
    if (googleStatus === 'pending' || googleStatus === 'preparing') return;
    if (googleStatus === 'preload-error') {
      setGoogleStatus('preparing');
      try {
        await preloadGoogleLogin({ force: true });
        setGoogleStatus('ready');
      } catch (error) {
        setGoogleStatus('preload-error');
        toast(getGoogleAuthErrorMessage(error), { type: 'error' });
      }
      return;
    }
    setGoogleStatus('pending');
    try {
      const result = await login();
      onAuthenticated?.(result?.user || null);
      offerPasskeyOrClose(result?.user);
    } catch (error) {
      toast(getGoogleAuthErrorMessage(error), { type: 'error' });
    } finally {
      setGoogleStatus('ready');
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyStatus('pending');
    setPasskeyLoginStep('biometric');
    setPasskeyMessage('');
    try {
      const result = await loginWithPasskey(emailValue, preparedPasskeyAuth, setPasskeyLoginStep);
      setPasskeyLoginStep('signing-in');
      const signInStartedAt = startClientPerf();
      const userCredential = await loginWithCustomToken(result.token, 'passkey');
      logClientPerf('passkey.authentication.signInWithCustomToken', signInStartedAt, { phase: 'success' });
      onAuthenticated?.(userCredential?.user || null);
      saveLocalPasskeyState(result?.email || emailValue);
      setLocalPasskeyEmails(readLocalPasskeyState().emails);
      close();
    } catch (error) {
      if (error?.code === 'functions/deadline-exceeded' || error?.code === 'functions/failed-precondition') {
        setPreparedPasskeyAuth(null);
      }
      if (error?.code === 'functions/not-found') {
        clearLocalPasskeyState(emailValue);
        const localPasskey = readLocalPasskeyState();
        setEmailValue(localPasskey.email);
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
    if (otpSendInFlightRef.current) return;

    const email = normalizeEmailValue(emailValue);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast("Saisissez une adresse email valide.", { type: 'error' });
      return;
    }

    otpSendInFlightRef.current = true;
    setOtpStatus('sending');
    setOtpMessage('Envoi du code en cours...');
    setOtpStep('code');
    setOtpDigits(['', '', '', '', '', '']);
    setResendAfter(0);
    otpCustomTokenRef.current = null;
    preloadOtpSignInRuntime();
    window.setTimeout(() => {
      document.querySelector('[data-otp-index="0"]')?.focus();
    }, 320);
    const startedAt = startClientPerf();
    try {
      const sendOtp = httpsCallable(functions, getFunctionTarget('sendCustomerLoginOtp'));
      const result = await sendOtp({ email });
      logClientPerf('auth.email.sendCustomerLoginOtp', startedAt, { phase: 'success' });
      setResendAfter(Number(result.data?.resendAfterSeconds || 60));
      setOtpStatus('sent');
      setOtpMessage(`Code envoye a ${email}. S'il n'apparait pas, verifiez aussi les courriers indesirables.`);
    } catch (error) {
      logClientPerf('auth.email.sendCustomerLoginOtp', startedAt, {
        phase: 'error',
        code: error?.code || null
      });
      const message = error?.message || "Impossible d'envoyer le code pour le moment.";
      setOtpStatus('error');
      setOtpMessage(message);
      toast(message, { type: 'error' });
    } finally {
      otpSendInFlightRef.current = false;
    }
  };

  const verifyCustomerLoginCode = async (event, codeOverride = '') => {
    event?.preventDefault?.();
    if (otpVerifyInFlightRef.current) return;

    const email = normalizeEmailValue(emailValue);
    const code = codeOverride || otpDigits.join('');
    if (!/^\d{6}$/.test(code)) {
      toast('Saisissez les 6 chiffres du code.', { type: 'error' });
      return;
    }

    otpVerifyInFlightRef.current = true;
    setOtpStatus('verifying');
    setOtpMessage('');
    const verifyStartedAt = startClientPerf();
    let currentPhase = 'verify';
    let signInStartedAt = null;
    try {
      let customToken = otpCustomTokenRef.current;
      if (!customToken) {
        const verifyOtp = httpsCallable(functions, getFunctionTarget('verifyCustomerLoginOtp'));
        const result = await verifyOtp({ email, code });
        logClientPerf('auth.email.verifyCustomerLoginOtp', verifyStartedAt, { phase: 'success' });
        if (!result.data?.token) throw new Error('Token de connexion manquant.');
        customToken = result.data.token;
        otpCustomTokenRef.current = customToken;
      }
      currentPhase = 'sign-in';
      setOtpStatus('signing-in');
      signInStartedAt = startClientPerf();
      const userCredential = await loginWithCustomToken(customToken, 'email_otp');
      logClientPerf('auth.email.signInWithCustomToken', signInStartedAt, { phase: 'success' });
      onAuthenticated?.(userCredential?.user || null);
      otpCustomTokenRef.current = null;
      setOtpStatus('success');
      setOtpMessage('Email verifie. Connexion ouverte.');
      offerPasskeyOrClose(userCredential?.user);
    } catch (error) {
      const isSignInFailure = currentPhase === 'sign-in';
      logClientPerf(
        isSignInFailure ? 'auth.email.signInWithCustomToken' : 'auth.email.verifyCustomerLoginOtp',
        isSignInFailure ? signInStartedAt : verifyStartedAt,
        {
        phase: 'error',
        code: error?.code || null
        }
      );
      const isRetryableNetworkFailure = isSignInFailure && error?.code === 'auth/network-request-failed';
      if (!isRetryableNetworkFailure) otpCustomTokenRef.current = null;
      const message = isRetryableNetworkFailure
        ? 'La connexion reseau a ete interrompue apres validation du code. Reessayez sans demander un nouveau code.'
        : (error?.message || 'Code invalide ou expire.');
      setOtpStatus('error');
      setOtpMessage(message);
      toast(message, { type: 'error' });
    } finally {
      otpVerifyInFlightRef.current = false;
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const nextValue = String(value || '').replace(/\D/g, '').slice(-1);
    const nextDigits = otpDigits.map((digit, digitIndex) => (
      digitIndex === index ? nextValue : digit
    ));
    setOtpDigits(nextDigits);
    if (nextValue && typeof document !== 'undefined') {
      document.querySelector(`[data-otp-index="${index + 1}"]`)?.focus();
    }
    if (nextDigits.every(Boolean) && !otpVerifyInFlightRef.current) {
      window.setTimeout(() => verifyCustomerLoginCode(null, nextDigits.join('')), 0);
    }
  };

  const handleOtpPaste = (event) => {
    const pastedCode = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedCode.length < 2) return;
    event.preventDefault();
    const nextDigits = Array.from({ length: 6 }, (_, index) => pastedCode[index] || '');
    setOtpDigits(nextDigits);
    document.querySelector(`[data-otp-index="${Math.min(pastedCode.length, 5)}"]`)?.focus();
    if (pastedCode.length === 6 && !otpVerifyInFlightRef.current) {
      window.setTimeout(() => verifyCustomerLoginCode(null, nextDigits.join('')), 0);
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key !== 'Backspace' || otpDigits[index] || index === 0) return;
    document.querySelector(`[data-otp-index="${index - 1}"]`)?.focus();
  };

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-[3000] flex items-center justify-center bg-[#0F0F11] md:bg-stone-900/80 md:p-6 md:backdrop-blur-xl"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Connexion Seconde Vie"
      tabIndex={-1}
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={close}
        className="absolute right-4 top-4 z-[3010] flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-stone-500 transition-all hover:bg-black/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 md:right-8 md:top-8"
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
                  <div className="sv-auth-success-mark mx-auto" aria-hidden="true">
                    <span className="sv-auth-success-mark__halo" />
                    <svg viewBox="0 0 80 80" focusable="false">
                      <circle className="sv-auth-success-mark__disc" cx="40" cy="40" r="31" />
                      <circle
                        className="sv-auth-success-mark__ring"
                        cx="40"
                        cy="40"
                        r="31"
                        pathLength="1"
                      />
                      <path
                        className="sv-auth-success-mark__check"
                        d="M25 40.5 35.5 51 56 30.5"
                        pathLength="1"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold tracking-tight text-white">Connexion réussie</h3>
                    <p className="px-2 text-sm font-medium leading-relaxed text-stone-400">
                      Vous pouvez continuer, ou activer la connexion rapide sur cet appareil.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#2A2A2E] bg-[#141417] p-4 text-left transition-colors">
                    <div className="flex items-start gap-3">
                      <KeyRound size={18} className="mt-0.5 shrink-0 text-amber-400" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">Connexion rapide sur cet appareil</p>
                        <p className="text-xs leading-relaxed text-stone-400">
                          Activez Windows Hello, Face ID ou le code de votre appareil pour les prochaines connexions.
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
                      disabled={isPasskeyBusy || passkeyStatus === 'success'}
                      className="relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#0F0F11] transition-colors hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isPasskeyBusy ? <Loader2 size={15} className="relative animate-spin" /> : null}
                      <span className="relative">
                        {passkeyRegistrationLabel}
                      </span>
                      {isPasskeyBusy ? (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-stone-300">
                          <span className="sv-auth-loading-bar block h-full w-1/2 bg-emerald-400" />
                        </span>
                      ) : null}
                    </button>
                  </div>
                  {passkeyStatus === 'success' ? null : (
                    <button
                      type="button"
                      onClick={close}
                      className="w-full rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200"
                    >
                      Continuer
                    </button>
                  )}
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
                onPointerEnter={() => void preloadGoogleLogin()}
                onFocus={() => void preloadGoogleLogin()}
                disabled={googleStatus === 'preparing' || googleStatus === 'pending'}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm font-bold text-white transition-all hover:bg-[#1f1f22] disabled:cursor-wait disabled:opacity-70"
              >
                {googleStatus === 'preparing' || googleStatus === 'pending' ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <span className="flex shrink-0 rounded-full bg-white p-0.5">
                    <img src="https://www.google.com/favicon.ico" className="h-[14px] w-[14px]" alt="" />
                  </span>
                )}
                <span>
                  {googleStatus === 'preparing'
                    ? 'Préparation de Google…'
                    : googleStatus === 'pending'
                      ? 'Connexion avec Google…'
                      : googleStatus === 'preload-error'
                        ? 'Réessayer la préparation Google'
                        : 'Continuer avec Google'}
                </span>
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-[#2A2A2E]" />
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
                  {showPasskeyFirst ? 'Connexion rapide' : 'Code par email'}
                </span>
                <div className="h-px flex-1 bg-[#2A2A2E]" />
              </div>

              {showPasskeyFirst ? (
                <div className="space-y-4">
                  <input
                    name="passkey-email"
                    type="email"
                    placeholder="Adresse email du compte"
                    value={emailValue}
                    onChange={(event) => {
                      setEmailValue(event.target.value);
                      setPreparedPasskeyAuth(null);
                      setPasskeyMessage('');
                    }}
                    className="w-full rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm text-white outline-none transition-all placeholder:text-stone-500 focus:border-emerald-300/70"
                    required
                    autoComplete="username webauthn"
                  />
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handlePasskeyLogin}
                      disabled={isPasskeyBusy || isPasskeyPreparing}
                      className="relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#2A2A2E] bg-[#141417] p-4 text-sm font-bold text-white transition-colors hover:bg-[#1f1f22] disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isPasskeyBusy || isPasskeyPreparing ? <Loader2 size={16} className="relative animate-spin" /> : <KeyRound size={16} />}
                      <span className="relative">{isPasskeyPreparing ? 'Preparation...' : passkeyLoginLabel}</span>
                      {isPasskeyBusy || isPasskeyPreparing ? (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-stone-700">
                          <span className="sv-auth-loading-bar block h-full w-1/2 bg-emerald-400" />
                        </span>
                      ) : null}
                    </button>
                  </div>
                  <div className="text-center text-[11px] font-semibold text-stone-500">
                    <span>{emailValue ? `Pour ${emailValue}` : 'Utilisez Windows Hello, votre téléphone ou une clé de sécurité'}</span>
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
                      setPasskeyPrepareStatus('idle');
                    }}
                    className="w-full text-center text-xs font-bold text-stone-400 transition-colors hover:text-white"
                  >
                    Recevoir un code par email
                  </button>
                </div>
              ) : (
                <div className="sv-auth-step min-h-[315px]">
                  {otpStep === 'code' ? (
                  <form onSubmit={verifyCustomerLoginCode} className="space-y-4">
                    <div className="rounded-2xl border border-[#2A2A2E] bg-[#141417] p-4">
                      <div className="flex items-start gap-3">
                        <Mail size={18} className="mt-0.5 shrink-0 text-emerald-300" />
                        <div className="space-y-1 text-left">
                          <p className="text-sm font-bold text-white">Code envoye</p>
                          <p className="text-xs leading-relaxed text-stone-400">
                            Saisissez le code recu a {normalizeEmailValue(emailValue)}.
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
                          disabled={isOtpBusy}
                          className="h-12 rounded-xl border border-[#2A2A2E] bg-[#141417] text-center text-lg font-black text-white outline-none transition-all placeholder:text-stone-500 focus:border-emerald-300/80 md:h-14"
                          aria-label={`Chiffre ${index + 1} du code`}
                          maxLength={1}
                        />
                      ))}
                    </div>
                    {otpMessage ? (
                      <p
                        role={otpStatus === 'error' ? 'alert' : 'status'}
                        aria-live={otpStatus === 'error' ? 'assertive' : 'polite'}
                        className={`text-center text-xs font-semibold ${otpStatus === 'error' ? 'text-amber-300' : 'text-emerald-300'}`}
                      >
                        {otpMessage}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isOtpBusy || !otpDigits.every(Boolean)}
                      aria-busy={isOtpBusy}
                      className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isOtpBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isOtpSending ? 'Envoi du code...' : isOtpVerifying ? 'Verification...' : isOtpSigningIn ? 'Connexion...' : 'Se connecter'}
                      {isOtpBusy ? (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-stone-300">
                          <span className="sv-auth-loading-bar block h-full w-1/2 bg-emerald-400" />
                        </span>
                      ) : null}
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
                        disabled={resendAfter > 0 || isOtpBusy}
                        className="inline-flex items-center gap-1 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isOtpSending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
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
                      aria-label="Adresse email du compte"
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
                      <p
                        role={otpStatus === 'error' ? 'alert' : 'status'}
                        aria-live={otpStatus === 'error' ? 'assertive' : 'polite'}
                        className={`text-center text-xs font-semibold ${otpStatus === 'error' ? 'text-amber-300' : 'text-emerald-300'}`}
                      >
                        {otpMessage}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isOtpSending}
                      aria-busy={isOtpSending}
                      className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-white p-4 text-sm font-bold text-[#0F0F11] transition-all hover:bg-stone-200 disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      {isOtpSending ? <Loader2 size={16} className="animate-spin" /> : null}
                      {isOtpSending ? 'Envoi du code...' : 'Recevoir mon code'}
                      {isOtpSending ? (
                        <span className="absolute inset-x-0 bottom-0 h-1 bg-stone-300">
                          <span className="sv-auth-loading-bar block h-full w-1/2 bg-emerald-400" />
                        </span>
                      ) : null}
                    </button>
                  </form>
                  )}
                </div>
              )}

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
  onAuthenticated,
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
            <LegacyLoginModalContent
              open={isOpen}
              onAuthenticated={onAuthenticated}
              onOpenChange={setOpen}
            />
          </ToastProvider>
        </AuthProvider>
      ) : null}
    </>
  );
}
