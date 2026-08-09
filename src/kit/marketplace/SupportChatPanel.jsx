'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CreditCard,
  Hammer,
  Package,
  PencilRuler,
  RotateCcw,
  Truck,
  X,
} from 'lucide-react';
import KIT_CONFIG from '../config/constants';
import { getSafeSupportPageUrl } from './supportPageUrl.mjs';

const SUPPORT = KIT_CONFIG.support || {};
const ADVISOR_NAME = SUPPORT.advisorName || 'Anais';
const WHATSAPP_NUMBER = String(SUPPORT.whatsappNumber || '').replace(/[^\d]/g, '');
const TYPING_DELAY_MS = 650;

const WhatsAppIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12.04 2c-5.46 0-9.9 4.44-9.9 9.9 0 1.75.46 3.45 1.32 4.95L2 22l5.3-1.39a9.87 9.87 0 0 0 4.74 1.21h.01c5.45 0 9.9-4.44 9.9-9.9 0-2.65-1.03-5.14-2.9-7.01A9.83 9.83 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-2-1.23-.73-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.13.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z" />
  </svg>
);

const TOPICS = [
  {
    id: 'delivery',
    label: 'Livraison & retrait',
    icon: Truck,
    answer: [
      'Le tarif de livraison depend du mode choisi et il est confirme au moment du paiement.',
      'Vous pouvez aussi retirer votre piece gratuitement autour de Marseille, sur rendez-vous.',
    ],
    actions: [{ type: 'whatsapp', label: 'Une question sur ma livraison' }],
  },
  {
    id: 'payment',
    label: 'Paiement & facilites',
    icon: CreditCard,
    answer: [
      'Le paiement par carte est entierement securise via Stripe.',
      'Stripe affiche au moment du paiement les moyens disponibles et eligibles pour votre commande.',
    ],
  },
  {
    id: 'condition',
    label: 'Etat des pieces',
    icon: Hammer,
    answer: [
      'Chaque piece est unique : chinee, puis restauree a la main dans notre atelier pres de Marseille. Les photos montrent la piece reelle que vous recevrez.',
      'Un doute sur une dimension ou une finition ? Ecrivez-nous, on vous repond avec des photos supplementaires.',
    ],
    actions: [{ type: 'whatsapp', label: 'Demander plus de photos' }],
  },
  {
    id: 'custom',
    label: 'Projet sur mesure',
    icon: PencilRuler,
    answer: [
      'Vous cherchez une piece precise, ou souhaitez faire restaurer un meuble qui vous appartient ? Decrivez votre projet, nous revenons vers vous avec une proposition personnalisee.',
    ],
    actions: [{ type: 'link', href: '/devis', label: 'Faire une demande de devis' }],
  },
  {
    id: 'order',
    label: 'Suivre ma commande',
    icon: Package,
    answer: [
      'Retrouvez le statut de vos commandes et vos factures a tout moment dans votre espace client.',
    ],
    actions: [
      { type: 'link', href: '/mes-commandes', label: 'Voir mes commandes' },
      { type: 'whatsapp', label: 'Contacter directement' },
    ],
  },
  {
    id: 'returns',
    label: 'Retours & SAV',
    icon: RotateCcw,
    answer: [
      'Un souci a la reception ou une question apres votre achat ? Contactez-nous directement, nous trouvons une solution rapidement.',
    ],
    actions: [{ type: 'whatsapp', label: 'Signaler un probleme' }],
  },
];

const buildWhatsAppHref = (context = '') => {
  if (!WHATSAPP_NUMBER) return '';
  const page = typeof window !== 'undefined'
    ? getSafeSupportPageUrl(window.location.href)
    : '';
  const text = `Bonjour ${ADVISOR_NAME}, ${context || 'j\'ai une question'}${page ? ` (page : ${page})` : ''}`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
};

const TypingIndicator = () => (
  <div className="sv-chat-msg flex items-end gap-2.5" aria-label={`${ADVISOR_NAME} est en train d'ecrire`}>
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]">
      <img src="/images/logoanais-320.webp" alt="" width="20" height="15" className="h-4 w-auto object-contain brightness-0 opacity-70 dark:invert dark:opacity-90" />
    </span>
    <span className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-stone-100/80 px-3.5 py-3 dark:bg-white/[0.06]">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="sv-chat-typing-dot h-1.5 w-1.5 rounded-full bg-stone-400 dark:bg-stone-500" style={{ animationDelay: `${dot * 0.16}s` }} />
      ))}
    </span>
  </div>
);

export default function SupportChatPanel({ open = false, onClose = () => {} }) {
  const router = useRouter();
  const [messages, setMessages] = React.useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      paragraphs: [
        `Bonjour, je suis ${ADVISOR_NAME}. Bienvenue chez Seconde Vie !`,
        'Comment puis-je vous aider ? Choisissez un sujet ci-dessous, ou ecrivez-nous directement sur WhatsApp.',
      ],
    },
  ]);
  const [typing, setTyping] = React.useState(false);
  const scrollRef = React.useRef(null);
  const closeButtonRef = React.useRef(null);
  const typingTimerRef = React.useRef(null);
  const headingId = React.useId();

  React.useEffect(() => () => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
  }, []);

  React.useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.setTimeout(() => closeButtonRef.current?.focus({ preventScroll: true }), 60);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return undefined;
    if (typeof window === 'undefined' || window.innerWidth >= 640) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  React.useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    node.scrollTo({ top: node.scrollHeight, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  }, [messages, typing, open]);

  const selectTopic = React.useCallback((topic) => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    setMessages((current) => [
      ...current,
      { id: `user-${topic.id}-${Date.now()}`, role: 'user', paragraphs: [topic.label] },
    ]);
    setTyping(true);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    typingTimerRef.current = window.setTimeout(() => {
      setTyping(false);
      setMessages((current) => [
        ...current,
        {
          id: `answer-${topic.id}-${Date.now()}`,
          role: 'assistant',
          paragraphs: topic.answer,
          actions: topic.actions || [],
        },
      ]);
    }, prefersReducedMotion ? 80 : TYPING_DELAY_MS);
  }, []);

  const handleAction = React.useCallback((action, context) => {
    if (action.type === 'whatsapp') {
      const href = buildWhatsAppHref(context);
      if (href) {
        window.open(href, '_blank', 'noopener,noreferrer');
        return;
      }
      setMessages((current) => {
        if (current.some((message) => message.id.startsWith('whatsapp-soon'))) return current;
        return [
          ...current,
          {
            id: `whatsapp-soon-${Date.now()}`,
            role: 'assistant',
            paragraphs: [
              'Notre canal WhatsApp ouvre tres bientot ! En attendant, ecrivez-nous via la page devis : nous vous repondons personnellement.',
            ],
            actions: [{ type: 'link', href: '/devis', label: 'Nous ecrire' }],
          },
        ];
      });
      return;
    }
    if (action.href) router.push(action.href);
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-hidden={!open}
      inert={!open ? '' : undefined}
      className={`fixed bottom-[calc(5.4rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[230] origin-bottom-right sm:left-auto sm:right-5 sm:w-[392px] ${open ? 'pointer-events-auto' : 'pointer-events-none'}`}
    >
      <div
        className={`flex max-h-[min(37.5rem,calc(100dvh-9.5rem))] flex-col rounded-[26px] bg-white/75 p-1.5 text-stone-900 shadow-[0_32px_90px_-24px_rgba(51,42,34,0.35)] ring-1 ring-stone-900/[0.07] backdrop-blur-2xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-[#0c0b0a]/90 dark:text-stone-100 dark:shadow-[0_32px_90px_-18px_rgba(0,0,0,0.72)] dark:ring-white/[0.08] ${open ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-3 scale-[0.97] opacity-0'}`}
      >
        <div className="flex items-center gap-3 px-3.5 pb-2.5 pt-2.5">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(51,42,34,0.08)] dark:bg-white/[0.08] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <img src="/images/logoanais-320.webp" alt="" width="28" height="21" className="h-6 w-auto object-contain brightness-0 opacity-80 dark:invert dark:opacity-100" />
          </span>
          <span className="min-w-0 flex-1">
            <span id={headingId} className="block truncate font-serif text-[17px] font-bold leading-tight">
              {KIT_CONFIG.brandName} <span className="font-sans text-[11px] font-semibold text-stone-400 dark:text-stone-500">avec {ADVISOR_NAME}</span>
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              {SUPPORT.replyHint || 'Reponse rapide'}
            </span>
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer le chat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-900/[0.05] text-stone-500 transition-all duration-200 hover:bg-stone-900/[0.1] hover:text-stone-800 active:scale-95 dark:bg-white/[0.08] dark:text-stone-300 dark:hover:bg-white/[0.14] dark:hover:text-stone-100"
          >
            <X size={15} strokeWidth={1.7} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[20px] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] dark:bg-[#151412] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div ref={scrollRef} className="search-suggest-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-3 pt-4">
            <div className="flex flex-col gap-3">
              {messages.map((message) => (
                message.role === 'assistant' ? (
                  <div key={message.id} className="sv-chat-msg flex items-end gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-stone-100 dark:bg-white/[0.08]">
                      <img src="/images/logoanais-320.webp" alt="" width="20" height="15" className="h-4 w-auto object-contain brightness-0 opacity-70 dark:invert dark:opacity-90" />
                    </span>
                    <div className="min-w-0 max-w-[85%]">
                      <div className="rounded-2xl rounded-bl-md bg-stone-100/80 px-3.5 py-2.5 dark:bg-white/[0.06]">
                        {message.paragraphs.map((paragraph, index) => (
                          <p key={index} className={`text-[13px] leading-relaxed ${index > 0 ? 'mt-2' : ''}`}>{paragraph}</p>
                        ))}
                      </div>
                      {message.actions?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {message.actions.map((action, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => handleAction(action, action.label)}
                              className={`group flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold tracking-wide transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${action.type === 'whatsapp'
                                ? 'bg-[#25D366]/[0.12] text-[#128C4B] shadow-[inset_0_0_0_1px_rgba(37,211,102,0.22)] hover:bg-[#25D366]/[0.2] dark:bg-[#25D366]/[0.14] dark:text-[#4fd47f] dark:shadow-[inset_0_0_0_1px_rgba(37,211,102,0.25)] dark:hover:bg-[#25D366]/[0.22]'
                                : 'bg-[#9A654B]/10 text-[#8B5C42] hover:bg-[#9A654B]/[0.16] dark:bg-[#D9B58D]/10 dark:text-[#D9B58D] dark:hover:bg-[#D9B58D]/[0.16]'}`}
                            >
                              {action.type === 'whatsapp' ? <WhatsAppIcon size={13} /> : null}
                              {action.label}
                              <ArrowRight size={11} strokeWidth={2} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div key={message.id} className="sv-chat-msg flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-stone-900 px-3.5 py-2.5 text-[13px] leading-relaxed text-white dark:bg-[#D9B58D] dark:text-stone-950">
                      {message.paragraphs[0]}
                    </p>
                  </div>
                )
              ))}
              {typing ? <TypingIndicator /> : null}
            </div>
          </div>

          <div className="border-t border-stone-100 px-4 pb-3.5 pt-3 dark:border-white/[0.06]">
            <p className="pb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-stone-400 dark:text-stone-500">
              Sujets frequents
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    disabled={typing}
                    onClick={() => selectTopic(topic)}
                    className="flex items-center gap-1.5 rounded-full bg-stone-900/[0.04] px-3 py-2 text-[11px] font-semibold tracking-wide text-stone-700 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-stone-900/[0.08] active:scale-[0.97] disabled:opacity-50 dark:bg-white/[0.06] dark:text-stone-200 dark:hover:bg-white/[0.12]"
                  >
                    <Icon size={12} strokeWidth={1.75} className="text-stone-400 dark:text-stone-500" />
                    {topic.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleAction({ type: 'whatsapp' }, 'j\'ai une question')}
          className="group relative mt-1.5 flex w-full items-center gap-3 overflow-hidden rounded-[20px] bg-gradient-to-b from-[#2BC46A] to-[#1B9E50] px-3.5 py-3 text-left text-white shadow-[0_16px_34px_-14px_rgba(27,158,80,0.6),inset_0_1px_0_rgba(255,255,255,0.28)] ring-1 ring-[#178A45]/40 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_18px_40px_-14px_rgba(27,158,80,0.75),inset_0_1px_0_rgba(255,255,255,0.32)] hover:brightness-[1.05] active:scale-[0.985] dark:ring-white/[0.12]"
        >
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(130%_70%_at_50%_-10%,rgba(255,255,255,0.22),transparent_58%)]" />
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/[0.28] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105">
            <WhatsAppIcon size={19} />
            <span className="absolute -bottom-px -right-px h-3 w-3 rounded-full bg-[#B4F4CD] ring-[2.5px] ring-[#1FA958]" aria-hidden="true" />
          </span>
          <span className="relative min-w-0 flex-1">
            <span className="block text-[13px] font-bold tracking-wide">Discuter sur WhatsApp</span>
            <span className="block truncate text-[11px] font-medium text-white/80">Reponse directe et personnalisee</span>
          </span>
          <span className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.15] ring-1 ring-white/[0.22] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
            <ArrowRight size={12} strokeWidth={2} />
          </span>
        </button>
      </div>
    </div>
  );
}
