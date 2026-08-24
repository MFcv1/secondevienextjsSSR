'use client';

import { useState } from 'react';
import {
    Check,
    Clock,
    Copy,
    Loader2,
    Mail,
    Package,
    RotateCcw,
    Truck,
    X,
    XCircle,
} from 'lucide-react';
import { getMillis } from '../../../../utils/time';
import { formatShippingAddress } from '../../../../utils/shippingAddress';
import {
    formatClock,
    formatDateTime,
    formatDayLabel,
    formatPrice,
    getDeliveryModeLabel,
    getOrderJourney,
    getPaymentLabel,
    getTimelineMeta,
    isRefundedWithGoodsOnSite,
    orderReference,
} from './orderPresentation';
import { insetClass, mutedTextClass, pillClass, softClass } from './orderTones';
import { GhostAction, PrimaryAction } from './OrderActionButtons';

const TIMELINE_ICONS = {
    package: Package,
    check: Check,
    cross: XCircle,
    refund: RotateCcw,
    truck: Truck,
    clock: Clock,
};

const SectionTitle = ({ children, darkMode }) => (
    <h4 className={`text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedTextClass(darkMode)}`}>
        {children}
    </h4>
);

/** Valeur metier copiable en un geste : e-mail, telephone, adresse, suivi. */
function CopyValue({ darkMode, label, mono = false, value }) {
    const [copied, setCopied] = useState(false);
    if (!value) {
        return (
            <div className="flex items-baseline justify-between gap-3 py-1.5">
                <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] ${mutedTextClass(darkMode)}`}>{label}</span>
                <span className={`text-[11px] font-medium ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>Non renseigné</span>
            </div>
        );
    }
    return (
        <div className="group flex items-baseline justify-between gap-3 py-1.5">
            <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-[0.08em] ${mutedTextClass(darkMode)}`}>{label}</span>
            <span className="flex min-w-0 items-baseline gap-1.5">
                <span className={`truncate text-right text-[11.5px] font-semibold ${mono ? 'font-mono text-[10.5px]' : ''}`} title={value}>
                    {value}
                </span>
                <button
                    type="button"
                    aria-label={`Copier ${label}`}
                    onClick={() => {
                        navigator.clipboard?.writeText(value).then(() => {
                            setCopied(true);
                            window.setTimeout(() => setCopied(false), 1600);
                        }).catch(() => {});
                    }}
                    className={`shrink-0 rounded-full p-1 opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100 ${darkMode ? 'text-stone-500 hover:text-white' : 'text-stone-400 hover:text-stone-950'} ${copied ? '!opacity-100 text-emerald-500' : ''}`}
                >
                    {copied ? <Check size={11} strokeWidth={2.4} /> : <Copy size={11} strokeWidth={1.8} />}
                </button>
            </span>
        </div>
    );
}

export default function OrderDetailPanel({
    actionError = '',
    actionPlan = { primary: null, secondary: [] },
    busy = false,
    commandsEnabled = true,
    darkMode = false,
    onAction,
    onClose,
    order,
    timeline,
    timelineLoading = false,
    variant = 'column',
}) {
    const journey = getOrderJourney(order);
    const events = Array.isArray(timeline) ? timeline : [];
    const hasActions = Boolean(actionPlan.primary);
    const legacy = order.schemaVersion !== 2;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <header className={`shrink-0 border-b px-5 pb-4 pt-5 sm:px-6 ${darkMode ? 'border-white/[0.07]' : 'border-black/[0.055]'}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className={`font-mono text-[10px] ${mutedTextClass(darkMode)}`}>{orderReference(order)}</p>
                        <h3 className="mt-1 truncate text-[19px] font-extrabold tracking-[-0.035em]">
                            {order.shipping?.fullName || 'Client inconnu'}
                        </h3>
                        <p className={`mt-1 text-[10px] font-semibold ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>
                            {formatDayLabel(order.createdAt)} · {formatClock(order.createdAt)} · {getDeliveryModeLabel(order)}
                        </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <div className="text-right">
                            <p className="text-[17px] font-extrabold tabular-nums tracking-[-0.03em]">{formatPrice(order.total)}</p>
                            <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.06em] ${pillClass(journey.tone, darkMode)}`}>
                                {journey.label}
                            </span>
                            {journey.detail ? (
                                <p className={`mt-1 text-[10px] font-semibold ${mutedTextClass(darkMode)}`}>{journey.detail}</p>
                            ) : null}
                        </div>
                        {variant === 'sheet' ? (
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Fermer le détail"
                                className={`grid h-9 w-9 place-items-center rounded-full ring-1 ${darkMode ? 'text-stone-400 ring-white/10' : 'text-stone-500 ring-black/[0.07]'}`}
                            >
                                <X size={16} strokeWidth={1.8} />
                            </button>
                        ) : null}
                    </div>
                </div>
            </header>

            <div
                data-native-scroll-region="true"
                onWheel={(event) => event.stopPropagation()}
                className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6 custom-scrollbar"
            >
                {/* 1. Ce qu'il reste a faire — toujours en premier, jamais en bas de page. */}
                <section className="space-y-2.5">
                    <SectionTitle darkMode={darkMode}>Prochaine étape</SectionTitle>
                    {isRefundedWithGoodsOnSite(order) ? (
                        <p className={`rounded-[16px] px-4 py-3.5 text-[11px] leading-5 ring-1 ${softClass('info', darkMode)} ring-sky-500/15`}>
                            Remboursement effectué. Le meuble est toujours à l’atelier. Ne le republiez pas tant que sa remise en stock n’a pas été enregistrée dans <strong className="font-extrabold">Retours</strong>.
                        </p>
                    ) : null}
                    {!commandsEnabled ? (
                        <p className={`rounded-[16px] px-4 py-3.5 text-[11px] leading-5 ring-1 ${insetClass(darkMode)} ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                            Actions commerce neutralisées. Aucun statut ni stock n’est modifié depuis le navigateur.
                        </p>
                    ) : legacy ? (
                        <p className={`rounded-[16px] px-4 py-3.5 text-[11px] leading-5 ring-1 ${insetClass(darkMode)} ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                            Commande antérieure à la refonte commerce : consultation seule.
                        </p>
                    ) : hasActions ? (
                        <>
                            <PrimaryAction
                                darkMode={darkMode}
                                label={actionPlan.primary.label}
                                icon={actionPlan.primary.icon}
                                busy={busy}
                                onClick={() => onAction(actionPlan.primary)}
                            />
                            {actionPlan.secondary.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {actionPlan.secondary.map((action) => (
                                        <GhostAction
                                            key={action.id}
                                            darkMode={darkMode}
                                            label={action.label}
                                            icon={action.icon}
                                            disabled={busy}
                                            onClick={() => onAction(action)}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <p className={`rounded-[16px] px-4 py-3.5 text-[11px] leading-5 ring-1 ${insetClass(darkMode)} ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                            Rien à faire pour l’instant sur cette commande.
                        </p>
                    )}
                    {actionError ? (
                        <p role="alert" aria-live="assertive" className="rounded-[16px] bg-red-500/10 px-4 py-3 text-[11px] leading-5 text-red-600 ring-1 ring-red-500/15 dark:text-red-400">
                            {actionError}
                        </p>
                    ) : null}
                </section>

                {/* 2. Le parcours horodate : la donnee que la commercante consulte le plus. */}
                <section className="space-y-2.5">
                    <SectionTitle darkMode={darkMode}>Parcours</SectionTitle>
                    <div className={`rounded-[18px] px-4 py-3 ring-1 ${insetClass(darkMode)}`}>
                        {timelineLoading ? (
                            <p className={`flex items-center gap-2 py-2 text-[11px] ${mutedTextClass(darkMode)}`}>
                                <Loader2 size={13} className="animate-spin" />
                                Chargement des événements…
                            </p>
                        ) : events.length > 0 ? (
                            <ol className="relative space-y-0">
                                <span
                                    aria-hidden="true"
                                    className={`absolute left-[9px] top-3 bottom-3 w-px ${darkMode ? 'bg-white/10' : 'bg-black/[0.08]'}`}
                                />
                                {events.map((event, index) => {
                                    const meta = getTimelineMeta(event);
                                    const Icon = TIMELINE_ICONS[meta.icon] || Clock;
                                    const millis = getMillis(event.at);
                                    const isLast = index === events.length - 1;
                                    return (
                                        <li key={`${event.type}-${millis}-${index}`} className="relative flex items-center gap-3 py-1.5">
                                            <span className={`relative z-[1] grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full ${isLast ? softClass(meta.tone, darkMode) : (darkMode ? 'bg-[#11110f] text-stone-500 ring-1 ring-white/10' : 'bg-white text-stone-400 ring-1 ring-black/[0.07]')}`}>
                                                <Icon size={10} strokeWidth={2.2} />
                                            </span>
                                            <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                                                <span className={`truncate text-[11.5px] font-bold ${isLast ? '' : (darkMode ? 'text-stone-400' : 'text-stone-600')}`}>
                                                    {meta.label}
                                                </span>
                                                {millis ? (
                                                    <time
                                                        dateTime={new Date(millis).toISOString()}
                                                        className={`shrink-0 text-[10px] tabular-nums ${mutedTextClass(darkMode)}`}
                                                    >
                                                        {formatDateTime(event.at)}
                                                    </time>
                                                ) : null}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ol>
                        ) : (
                            <p className={`py-2 text-[11px] ${mutedTextClass(darkMode)}`}>
                                L’historique précis n’est pas disponible pour cette ancienne commande.
                            </p>
                        )}
                    </div>
                </section>

                {/* 3. Panier */}
                <section className="space-y-2.5">
                    <SectionTitle darkMode={darkMode}>Panier</SectionTitle>
                    <div className={`rounded-[18px] px-4 py-3 ring-1 ${insetClass(darkMode)}`}>
                        {(order.items || []).map((item, index) => (
                            <div key={`${item.productId || item.name}-${index}`} className="flex items-baseline justify-between gap-3 py-1.5 text-[11.5px]">
                                <span className={`min-w-0 truncate font-semibold ${darkMode ? 'text-stone-300' : 'text-stone-700'}`}>
                                    {Number(item.quantity) > 1 ? <span className={mutedTextClass(darkMode)}>{item.quantity}× </span> : null}
                                    {item.name}
                                </span>
                                <span className="shrink-0 font-bold tabular-nums">{formatPrice(item.price)}</span>
                            </div>
                        ))}
                        <div className={`mt-1.5 flex items-baseline justify-between border-t pt-2.5 text-[12.5px] font-extrabold ${darkMode ? 'border-white/[0.07]' : 'border-black/[0.055]'}`}>
                            <span>Total</span>
                            <span className="tabular-nums">{formatPrice(order.total)}</span>
                        </div>
                    </div>
                </section>

                {/* 4. Client et livraison */}
                <section className="space-y-2.5">
                    <SectionTitle darkMode={darkMode}>Client &amp; livraison</SectionTitle>
                    <div className={`rounded-[18px] px-4 py-2 ring-1 ${insetClass(darkMode)}`}>
                        <CopyValue darkMode={darkMode} label="Compte" value={order.userEmail} />
                        <CopyValue darkMode={darkMode} label="E-mail" value={order.shipping?.email} />
                        <CopyValue darkMode={darkMode} label="Téléphone" value={order.shipping?.phone} />
                        <CopyValue darkMode={darkMode} label="Adresse" value={formatShippingAddress(order.shipping)} />
                        <CopyValue darkMode={darkMode} label="Paiement" value={getPaymentLabel(order)} />
                    </div>

                    {order.fulfillmentSummary?.status === 'shipped' ? (
                        <div className={`rounded-[18px] px-4 py-3 ring-1 ${insetClass(darkMode)}`}>
                            <p className={`flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedTextClass(darkMode)}`}>
                                <Truck size={11} strokeWidth={2} /> Suivi de livraison
                            </p>
                            {order.shipmentTracking?.mode === 'tracked' ? (
                                <>
                                    <p className="mt-2 text-[12px] font-extrabold">{order.shipmentTracking.carrierLabel}</p>
                                    <CopyValue darkMode={darkMode} label="Numéro" value={order.shipmentTracking.trackingNumber} mono />
                                </>
                            ) : (
                                <p className={`mt-2 text-[11px] leading-5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                    Expédition confirmée sans numéro de suivi.
                                </p>
                            )}
                        </div>
                    ) : null}
                </section>

                {/* 5. Le technique se replie : la boutique ne le lit jamais. */}
                <details className={`group rounded-[18px] px-4 py-3 ring-1 ${insetClass(darkMode)}`}>
                    <summary className={`flex cursor-pointer list-none items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.12em] ${mutedTextClass(darkMode)}`}>
                        Détails techniques
                        <span className="text-[10px] font-bold normal-case tracking-normal group-open:hidden">Afficher</span>
                        <span className="hidden text-[10px] font-bold normal-case tracking-normal group-open:inline">Masquer</span>
                    </summary>
                    <div className="mt-1">
                        <CopyValue darkMode={darkMode} label="PaymentIntent" value={order.stripePaymentIntentId} mono />
                        <CopyValue darkMode={darkMode} label="UID client" value={order.userId} mono />
                        <CopyValue darkMode={darkMode} label="ID commande" value={order.id} mono />
                        {order.checkoutAuthMethod ? (
                            <CopyValue darkMode={darkMode} label="Vérification" value={order.checkoutAuthMethod} />
                        ) : null}
                        {order.emailProof ? (
                            <div className="flex items-baseline justify-between gap-3 py-1.5">
                                <span className={`text-[10px] font-extrabold uppercase tracking-[0.08em] ${mutedTextClass(darkMode)}`}>E-mails</span>
                                <span className="flex items-center gap-1.5 text-[10px] font-semibold">
                                    <Mail size={11} strokeWidth={1.8} className={mutedTextClass(darkMode)} />
                                    client {order.emailProof?.client?.sent ? 'envoyé' : 'non confirmé'} · admin {order.emailProof?.admin?.sent ? 'envoyé' : 'non confirmé'}
                                </span>
                            </div>
                        ) : null}
                    </div>
                </details>
            </div>
        </div>
    );
}
