import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Shield, AlertCircle } from 'lucide-react';
import {
    adminSurfaces,
    EmptyState,
    LoadingPanel,
    Panel,
    PageHeader,
    StatusDot
} from './adminUiKit';

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
});

const formatTimestamp = (value) => {
    const date = value?.toDate?.();
    if (!date || Number.isNaN(date.getTime())) return '—';
    return dateFormatter.format(date);
};

const AdminIPManager = ({ darkMode }) => {
    const [adminIPs, setAdminIPs] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'sys_metadata', 'admin_ips'), (docSnap) => {
            if (docSnap.exists() && docSnap.data().ips) {
                setAdminIPs(docSnap.data().ips);
            } else {
                setAdminIPs({});
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching admin IPs:", err);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // Grouper les IPs par administrateur (Email)
    // Car l'IPv6 change très souvent (Privacy Extensions sur mobiles/PC modernes)
    const groupedAdmins = useMemo(() => {
        return Object.entries(adminIPs).reduce((acc, [ip, data]) => {
            const email = data.adminEmail || 'Admin Inconnu';
            if (!acc[email]) {
                acc[email] = {
                    email,
                    ips: [],
                    lastSeen: null,
                    lastIp: null,
                    firstSeen: null
                };
            }
            acc[email].ips.push(ip);

            // Comparaison des dates pour trouver la dernière visite globale
            const dataLastSeen = data.lastSeen?.toDate?.() || new Date(0);
            const accLastSeen = acc[email].lastSeen?.toDate?.() || new Date(0);

            if (dataLastSeen > accLastSeen) {
                acc[email].lastSeen = data.lastSeen;
                acc[email].lastIp = ip;
            }

            // Comparaison pour la toute première visite globale
            const dataFirstSeen = data.firstSeen?.toDate?.() || new Date();
            const accFirstSeen = acc[email].firstSeen?.toDate?.() || new Date();
            
            if (!acc[email].firstSeen || dataFirstSeen < accFirstSeen) {
                acc[email].firstSeen = data.firstSeen;
            }

            return acc;
        }, {});
    }, [adminIPs]);



    const surfaces = adminSurfaces(darkMode);
    const adminsList = Object.values(groupedAdmins);
    const totalIps = adminsList.reduce((total, admin) => total + admin.ips.length, 0);

    if (loading) return <LoadingPanel darkMode={darkMode} label="Chargement du trafic exclu…" />;

    return (
        <div className="space-y-5">
            <PageHeader
                darkMode={darkMode}
                description="Adresses de l’équipe exclues des statistiques pour garder des chiffres clients fiables."
                title="Trafic interne"
                badge={adminsList.length ? (
                    <StatusDot
                        darkMode={darkMode}
                        label={`${totalIps} adresse${totalIps > 1 ? 's' : ''} exclue${totalIps > 1 ? 's' : ''}`}
                        tone="emerald"
                    />
                ) : null}
            />

            {adminsList.length === 0 ? (
                <EmptyState
                    darkMode={darkMode}
                    description="Aucune session administrateur n’a encore été enregistrée."
                    icon={<Shield size={26} />}
                    title="Aucun trafic interne"
                />
            ) : (
                <section className={`overflow-hidden rounded-2xl border ${surfaces.panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${surfaces.divider}`}>
                        <h3 className="text-sm font-black">Membres suivis</h3>
                        <span className={`text-xs tabular-nums ${surfaces.muted}`}>{adminsList.length}</span>
                    </div>
                    <div className={`divide-y ${surfaces.hairline}`}>
                        {adminsList.map((admin) => (
                            <article
                                className={`grid gap-3 px-5 py-4 transition sm:grid-cols-[minmax(0,1.5fr)_110px_minmax(0,1fr)_140px] sm:items-center ${surfaces.hoverRow}`}
                                key={admin.email}
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${darkMode ? 'bg-white/[0.06] text-stone-300' : 'bg-stone-100 text-stone-500'}`}>
                                        <Shield size={16} />
                                    </span>
                                    <p className="truncate text-sm font-bold tracking-tight" title={admin.email}>
                                        {admin.email}
                                    </p>
                                </div>
                                <p className={`text-xs font-semibold ${surfaces.muted}`}>
                                    <span className={`text-sm font-black tabular-nums ${darkMode ? 'text-white' : 'text-stone-950'}`}>
                                        {admin.ips.length}
                                    </span>{' '}
                                    IP
                                </p>
                                <p className={`truncate font-mono text-xs ${surfaces.muted}`} title={admin.lastIp}>
                                    {admin.lastIp || '—'}
                                </p>
                                <p className={`text-xs font-semibold tabular-nums ${surfaces.muted}`}>
                                    {formatTimestamp(admin.lastSeen)}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <Panel darkMode={darkMode} title="Pourquoi plusieurs adresses par personne">
                <div className={`flex items-start gap-3 text-sm leading-6 ${surfaces.muted}`}>
                    <AlertCircle className={`mt-0.5 shrink-0 ${surfaces.faint}`} size={17} />
                    <div className="space-y-2">
                        <p>
                            Les appareils récents changent d’adresse IPv6 chaque jour (Privacy Extensions). Ces adresses
                            sont regroupées automatiquement sous le compte correspondant.
                        </p>
                        <p>
                            Les adresses inutilisées depuis plus de 90 jours sont purgées automatiquement.
                        </p>
                    </div>
                </div>
            </Panel>
        </div>
    );
};

export default AdminIPManager;
