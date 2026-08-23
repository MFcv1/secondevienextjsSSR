import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Mail, Trash2, Download, Search } from 'lucide-react';
import { getMillis } from '../../utils/time';
import { downloadCsv } from './exportCsv';
import {
    adminSurfaces,
    EmptyState,
    focusRingWithin,
    LoadingPanel,
    PageHeader
} from './adminUiKit';

const AdminNewsletter = ({ darkMode }) => {
    const [subscribers, setSubscribers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const q = query(
            collection(db, 'newsletter_subscribers'),
            orderBy('createdAt', 'desc')
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const subs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSubscribers(subs);
            setLoading(false);
        }, (err) => {
            console.error("Error fetching newsletter subscribers:", err);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    const handleDelete = async (id, email) => {
        if (!window.confirm(`Voulez-vous vraiment supprimer l'abonné ${email} ?`)) return;
        try {
            await deleteDoc(doc(db, 'newsletter_subscribers', id));
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression.");
        }
    };

    const handleExportCsv = () => {
        const data = subscribers.map(sub => ({
            'Nom': sub.lastName || '',
            'Prénom': sub.firstName || '',
            'Contact/Email': sub.contactInfo || '',
            'Date Inscription': sub.createdAt ? new Date(getMillis(sub.createdAt)).toLocaleDateString('fr-FR') : 'N/A',
            'Source': sub.source || 'Inconnu'
        }));
        downloadCsv(data, 'Newsletter');
    };

    const filteredSubscribers = subscribers.filter(sub =>
        (sub.contactInfo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sub.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const surfaces = adminSurfaces(darkMode);

    if (loading) return <LoadingPanel darkMode={darkMode} label="Chargement de la liste d’abonnés…" />;

    return (
        <div className="space-y-5">
            <PageHeader
                darkMode={darkMode}
                description="Base des personnes inscrites à la newsletter de la boutique."
                title="Abonnés"
                actions={(
                    <>
                        <label className={`flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 sm:min-w-[280px] ${surfaces.field} ${focusRingWithin}`}>
                            <Search className="shrink-0" size={16} />
                            <span className="sr-only">Rechercher un abonné</span>
                            <input
                                className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none"
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="E-mail, nom…"
                                value={searchTerm}
                            />
                        </label>
                        <button
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:opacity-50 ${surfaces.secondaryButton}`}
                            disabled={subscribers.length === 0}
                            onClick={handleExportCsv}
                            type="button"
                        >
                            <Download size={15} />
                            Exporter CSV
                        </button>
                    </>
                )}
            />

            {filteredSubscribers.length === 0 ? (
                <EmptyState
                    darkMode={darkMode}
                    description={searchTerm ? 'Essayez une autre recherche.' : 'Les inscriptions apparaîtront ici.'}
                    icon={<Mail size={26} />}
                    title="Aucun abonné"
                />
            ) : (
                <section className={`overflow-hidden rounded-2xl border ${surfaces.panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${surfaces.divider}`}>
                        <h3 className="text-sm font-black">Liste des abonnés</h3>
                        <span className={`text-xs tabular-nums ${surfaces.muted}`}>
                            {filteredSubscribers.length} / {subscribers.length}
                        </span>
                    </div>
                    <div className={`divide-y ${surfaces.hairline}`}>
                        {filteredSubscribers.map((subscriber) => {
                            const fullName = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ');
                            return (
                                <article
                                    className={`grid gap-3 px-5 py-4 transition sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_150px_44px] sm:items-center ${surfaces.hoverRow}`}
                                    key={subscriber.id}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black tracking-tight">
                                            {fullName || 'Contact sans nom'}
                                        </p>
                                        <p className={`mt-0.5 truncate text-xs ${surfaces.muted}`}>
                                            {subscriber.contactInfo || 'Coordonnée absente'}
                                        </p>
                                    </div>
                                    <p className={`truncate text-xs ${surfaces.muted}`}>
                                        {subscriber.source || 'Origine inconnue'}
                                    </p>
                                    <p className={`text-xs tabular-nums ${surfaces.muted}`}>
                                        {subscriber.createdAt
                                            ? new Date(getMillis(subscriber.createdAt)).toLocaleDateString('fr-FR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })
                                            : '—'}
                                    </p>
                                    <button
                                        aria-label={`Supprimer ${subscriber.contactInfo || 'cet abonné'}`}
                                        className="justify-self-start rounded-lg p-2 text-stone-400 transition hover:bg-red-500/10 hover:text-red-600 sm:justify-self-end"
                                        onClick={() => handleDelete(subscriber.id, subscriber.contactInfo)}
                                        type="button"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
};

export default AdminNewsletter;
