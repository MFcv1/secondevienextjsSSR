import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    AlertCircle,
    CheckCircle2,
    Download,
    ExternalLink,
    FileText,
    Loader2,
    Mail,
    Share2,
    X,
} from 'lucide-react';
import { prepareCommerceDocumentDelivery } from './commerceV2Client';

const formatPrice = (cents, currency = 'EUR') => (
    new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency,
    }).format((Number(cents) || 0) / 100)
);

const formatDate = (value) => {
    const millis = Date.parse(value);
    return Number.isFinite(millis)
        ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(millis))
        : 'Date indisponible';
};

const base64ToBlob = (contentBase64, contentType) => {
    const binary = window.atob(contentBase64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: contentType });
};

const deviceHelp = () => {
    if (typeof navigator === 'undefined') return null;
    const userAgent = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
        || (userAgent.includes('Mac') && navigator.maxTouchPoints > 1);
    if (isIOS) {
        return 'Sur iPhone, ouvrez le PDF puis touchez Partager pour l’enregistrer dans Fichiers. Les téléchargements Safari sont aussi visibles dans Fichiers > Téléchargements.';
    }
    if (/Android/i.test(userAgent)) {
        return 'Sur Android, le PDF peut s’ouvrir directement dans Chrome. Pour le conserver, utilisez Télécharger ou le menu du lecteur PDF ; il restera ensuite dans Téléchargements.';
    }
    return 'Sur ordinateur, le PDF s’ouvre dans un nouvel onglet. Le bouton Enregistrer lance aussi une copie dans le dossier de téléchargement configuré dans votre navigateur.';
};

const CommerceDocumentModal = ({ entry, onClose }) => {
    const [status, setStatus] = useState('preparing');
    const [delivery, setDelivery] = useState(null);
    const [objectUrl, setObjectUrl] = useState(null);
    const [shareFile, setShareFile] = useState(null);
    const [downloadStarted, setDownloadStarted] = useState(false);
    const [shareError, setShareError] = useState('');
    const [showHelp, setShowHelp] = useState(false);
    const [resending, setResending] = useState(false);
    const dialogRef = useRef(null);
    const closeButtonRef = useRef(null);
    const objectUrlRef = useRef(null);
    const helpText = useMemo(deviceHelp, []);

    const installDocument = useCallback((result) => {
        const blob = base64ToBlob(
            result.document.contentBase64,
            result.document.contentType
        );
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
        const nextObjectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = nextObjectUrl;
        setObjectUrl(nextObjectUrl);
        setShareFile(new File([blob], result.document.filename, {
            type: result.document.contentType,
            lastModified: Date.now(),
        }));
        setDelivery(result);
        setStatus('ready');
    }, []);

    const loadDelivery = useCallback(async ({ resend = false } = {}) => {
        if (!entry?.order?.id || !entry?.document?.documentId) return;
        if (resend) setResending(true);
        else setStatus('preparing');
        setShareError('');
        try {
            const result = await prepareCommerceDocumentDelivery(
                entry.order.id,
                entry.document.documentId
            );
            installDocument(result);
        } catch (error) {
            console.error('Commerce document delivery failed:', error);
            if (!resend) setStatus('error');
            else setShareError('L’e-mail ne peut pas être reprogrammé pour le moment. Le PDF reste disponible.');
        } finally {
            setResending(false);
        }
    }, [entry?.document?.documentId, entry?.order?.id, installDocument]);

    useEffect(() => {
        loadDelivery();
    }, [loadDelivery]);

    useEffect(() => () => {
        if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    }, []);

    useEffect(() => {
        const previousActiveElement = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
                return;
            }
            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = [...dialogRef.current.querySelectorAll(
                'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )];
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
            previousActiveElement?.focus?.();
        };
    }, [onClose]);

    const canShareFile = Boolean(
        shareFile
        && navigator.canShare
        && navigator.canShare({ files: [shareFile] })
    );

    const shareDocument = async () => {
        if (!canShareFile) return;
        setShareError('');
        try {
            await navigator.share({
                files: [shareFile],
                title: delivery.document.label,
                text: `Document de la commande CMD-${String(entry.order.id).slice(0, 10).toUpperCase()}`,
            });
        } catch (error) {
            if (error?.name !== 'AbortError') {
                setShareError('Le partage n’a pas pu être ouvert. Vous pouvez enregistrer le PDF ou utiliser la copie e-mail.');
            }
        }
    };

    if (typeof document === 'undefined') return null;
    const orderReference = `CMD-${String(entry.order.id || '').slice(0, 10).toUpperCase()}`;
    const emailMessage = delivery?.email?.queued
        ? delivery.email.reused
            ? `Une copie est déjà programmée pour ${delivery.email.maskedRecipient}.`
            : `Une copie va être envoyée à ${delivery.email.maskedRecipient}.`
        : delivery?.email?.warning
            ? delivery.email.warning
            : 'Le PDF est prêt. L’envoi par e-mail n’a pas pu être programmé.';

    return createPortal(
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-5">
            <button
                type="button"
                onClick={onClose}
                aria-label="Fermer la fenêtre du document"
                className="absolute inset-0 cursor-default"
            />
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="commerce-document-title"
                aria-describedby="commerce-document-description"
                className="relative max-h-[calc(100dvh-12px)] w-full overflow-y-auto rounded-t-[16px] bg-white text-[#1d1d1f] shadow-[0_24px_80px_rgba(0,0,0,.2)] sm:max-h-[calc(100dvh-40px)] sm:max-w-[620px] sm:rounded-[16px]"
            >
                <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[#d2d2d7] sm:hidden" aria-hidden="true" />
                <div className="flex items-start justify-between gap-4 border-b border-[#e8e8ed] px-5 py-5 sm:px-7">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#86868b]">Document de commande</p>
                        <h2 id="commerce-document-title" className="mt-2 text-[24px] font-semibold leading-tight sm:text-[28px]">
                            {status === 'preparing' ? 'Préparation de votre document' : status === 'error' ? 'Document indisponible' : 'Votre document est prêt'}
                        </h2>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer"
                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#6e6e73] transition-colors hover:bg-[#f5f5f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="px-5 py-6 sm:px-7 sm:py-7">
                    {status === 'preparing' ? (
                        <div className="py-10 text-center" aria-live="polite" aria-busy="true">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#f5faff] text-[#175c9c]">
                                <Loader2 size={27} className="animate-spin motion-reduce:animate-none" />
                            </div>
                            <p id="commerce-document-description" className="mx-auto mt-5 max-w-sm text-[14px] leading-6 text-[#6e6e73]">
                                Nous sécurisons le PDF et préparons aussi une copie pour votre boîte e-mail.
                            </p>
                        </div>
                    ) : status === 'error' ? (
                        <div className="py-8 text-center" aria-live="assertive">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[12px] bg-[#fff7f7] text-[#9f3434]">
                                <AlertCircle size={27} />
                            </div>
                            <p id="commerce-document-description" className="mx-auto mt-5 max-w-sm text-[14px] leading-6 text-[#6e6e73]">
                                Le document ne peut pas être préparé pour le moment. Aucun téléchargement incomplet n’a été créé.
                            </p>
                            <button
                                type="button"
                                onClick={() => loadDelivery()}
                                className="mt-6 min-h-11 rounded-full bg-[#1d1d1f] px-6 text-[14px] font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                            >
                                Réessayer
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-[12px] border border-[#e8e8ed] bg-[#fbfbfd] p-4 sm:p-5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-white text-[#175c9c] shadow-[0_1px_2px_rgba(0,0,0,.05)]">
                                    <FileText size={24} strokeWidth={1.6} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                        <p className="text-[15px] font-semibold">{delivery.document.label}</p>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[11px] font-semibold text-[#047857]">
                                            <CheckCircle2 size={13} /> Prêt
                                        </span>
                                    </div>
                                    <p id="commerce-document-description" className="mt-1 text-[13px] leading-5 text-[#6e6e73]">
                                        {orderReference} · {formatDate(delivery.document.issuedAt)} · {formatPrice(delivery.document.amountCents, delivery.document.currency)}
                                    </p>
                                    <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[#9a6a35]">Sandbox · document non fiscal</p>
                                </div>
                            </div>

                            <div className={`mt-4 flex gap-3 rounded-[12px] border px-4 py-3.5 ${delivery.email.queued ? 'border-[#d8e6f5] bg-[#f5faff]' : 'border-[#eadfbf] bg-[#fffaf0]'}`} aria-live="polite">
                                <Mail size={18} className={`mt-0.5 shrink-0 ${delivery.email.queued ? 'text-[#175c9c]' : 'text-[#8a5a13]'}`} />
                                <div className="min-w-0">
                                    <p className={`text-[13px] font-semibold ${delivery.email.queued ? 'text-[#175c9c]' : 'text-[#8a5a13]'}`}>
                                        {delivery.email.queued ? 'Copie e-mail programmée' : 'PDF disponible sur le site'}
                                    </p>
                                    <p className="mt-1 break-words text-[12px] leading-5 text-[#5f6368]">{emailMessage}</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-3 sm:grid-cols-2">
                                <a
                                    href={objectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] sm:col-span-2"
                                >
                                    <ExternalLink size={18} />
                                    Ouvrir le PDF
                                </a>
                                <a
                                    href={objectUrl}
                                    download={delivery.document.filename}
                                    onClick={() => setDownloadStarted(true)}
                                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#b9d4ee] bg-[#f5faff] px-4 text-[13px] font-semibold text-[#175c9c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                                >
                                    <Download size={17} />
                                    Enregistrer
                                </a>
                                {canShareFile ? (
                                    <button
                                        type="button"
                                        onClick={shareDocument}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d2d2d7] px-4 text-[13px] font-semibold text-[#1d1d1f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3]"
                                    >
                                        <Share2 size={17} />
                                        Partager
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => loadDelivery({ resend: true })}
                                        disabled={resending}
                                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#d2d2d7] px-4 text-[13px] font-semibold text-[#1d1d1f] disabled:opacity-60"
                                    >
                                        {resending ? <Loader2 size={17} className="animate-spin" /> : <Mail size={17} />}
                                        Renvoyer l’e-mail
                                    </button>
                                )}
                            </div>

                            {canShareFile ? (
                                <button
                                    type="button"
                                    onClick={() => loadDelivery({ resend: true })}
                                    disabled={resending}
                                    className="mx-auto mt-4 flex min-h-10 items-center gap-2 text-[12px] font-medium text-[#0066cc] disabled:opacity-60"
                                >
                                    {resending ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
                                    Renvoyer la copie e-mail
                                </button>
                            ) : null}

                            {downloadStarted ? (
                                <p className="mt-4 rounded-[8px] bg-[#f7faf7] px-4 py-3 text-center text-[12px] leading-5 text-[#2f5d46]" aria-live="polite">
                                    Téléchargement lancé. Le bouton « Ouvrir le PDF » reste disponible si vous ne retrouvez pas le fichier.
                                </p>
                            ) : null}
                            {shareError ? <p className="mt-4 text-center text-[12px] leading-5 text-[#9f3434]" role="alert">{shareError}</p> : null}

                            <div className="mt-5 border-t border-[#e8e8ed] pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowHelp((value) => !value)}
                                    aria-expanded={showHelp}
                                    className="min-h-10 text-[12px] font-medium text-[#0066cc]"
                                >
                                    Où retrouver mon fichier ?
                                </button>
                                {showHelp ? <p className="mt-2 text-[12px] leading-5 text-[#6e6e73]">{helpText}</p> : null}
                            </div>
                        </>
                    )}
                </div>
            </section>
        </div>,
        document.body
    );
};

export default CommerceDocumentModal;
