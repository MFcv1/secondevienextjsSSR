import React, { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Shield, Clock, AlertCircle } from 'lucide-react';

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



    if (loading) return <div className="p-12 text-center animate-pulse opacity-50">Chargement des IPs admin...</div>;

    const adminsList = Object.values(groupedAdmins);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Header (Bento Box simple) */}
            <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] ${darkMode ? 'bg-[#161616] border border-white/5' : 'bg-white border border-stone-100 shadow-sm'}`}>
                <div>
                    <h2 className={`text-2xl md:text-3xl font-black tracking-tight mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Équipe & Trafic Exclu</h2>
                    <p className={`font-medium text-xs md:text-sm ${darkMode ? 'text-white/50' : 'text-stone-500'}`}>
                        Membres de l'équipe actuellement bloqués pour garantir la fiabilité des statistiques clients.
                    </p>
                </div>
            </div>

            {/* Administrateurs List (Grille Bento Premium) */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {adminsList.map((admin) => (
                    <div key={admin.email} className={`rounded-[2rem] p-6 md:p-8 flex flex-col transition-all duration-300 ${darkMode ? 'bg-[#161616] border border-white/5 hover:bg-[#1a1a1a]' : 'bg-white border border-stone-200 shadow-sm hover:shadow-md'}`}>
                        {/* Avatar & Status */}
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3 w-[70%]">
                                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                    <Shield size={20} strokeWidth={2.5} />
                                </div>
                                <div className={`text-sm font-semibold tracking-wide truncate ${darkMode ? 'text-white' : 'text-stone-900'}`} title={admin.email}>
                                    {admin.email}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-[#22c55e]/10 px-2.5 py-1 rounded-full border border-[#22c55e]/20 shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                                <span className="text-[10px] uppercase font-bold text-[#22c55e] tracking-widest hidden sm:inline">Actif</span>
                            </div>
                        </div>

                        {/* KPI Block */}
                        <div className="mb-8">
                            <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${darkMode ? 'text-white/40' : 'text-stone-400'}`}>
                                Adresses IP Bloquées
                            </p>
                            <p className={`text-5xl md:text-6xl font-semibold tracking-tighter mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                {admin.ips.length}
                            </p>
                            <p className={`text-xs font-medium ${darkMode ? 'text-[#a1a1aa]' : 'text-stone-500'}`}>
                                Trafic anonymisé et invisibilisé.
                            </p>
                        </div>

                        {/* Footer Data */}
                        <div className={`mt-auto space-y-3 pt-6 border-t ${darkMode ? 'border-white/5' : 'border-stone-100'}`}>
                            <div className="flex justify-between items-center text-xs">
                                <span className={`font-medium ${darkMode ? 'text-white/40' : 'text-stone-500'}`}>Appareil récent</span>
                                <span className={`font-mono text-[10px] max-w-[50%] truncate ${darkMode ? 'text-white/80' : 'text-stone-700'}`} title={admin.lastIp}>
                                    {admin.lastIp}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {adminsList.length === 0 && (
                    <div className="col-span-full text-center py-20 text-stone-400">
                        <div className="flex flex-col items-center gap-4">
                            <AlertCircle size={48} className="opacity-50" />
                            <p>Aucune activité administrateur enregistrée pour le moment.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Info Légale / Explication */}
            <div className={`p-6 rounded-2xl ${darkMode ? 'bg-black/20 border border-white/5' : 'bg-stone-50 border border-stone-200'}`}>
                <div className="flex items-start gap-4">
                    <AlertCircle size={20} className={`mt-0.5 shrink-0 ${darkMode ? 'text-[#a1a1aa]' : 'text-stone-400'}`} />
                    <div className={`text-sm ${darkMode ? 'text-[#a1a1aa]' : 'text-stone-500'}`}>
                        <p className="mb-2">
                            <strong>Fonctionnement natif (IPv6) :</strong> Les appareils modernes (smartphones, PC récents) génèrent quotidiennement de nouvelles adresses IP pour protéger votre vie privée (Privacy Extensions). 
                            Cette interface re-groupe automatiquement toutes ces multiples adresses secrètes sous votre identifiant.
                        </p>
                        <p>
                            <strong>Nettoyage automatique :</strong> Les anciennes IPs non utilisées depuis plus de 90 jours sont automatiquement purgées de la base de données.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminIPManager;
