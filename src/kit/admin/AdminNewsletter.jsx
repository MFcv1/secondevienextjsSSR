import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Mail, Trash2, Download, Search } from 'lucide-react';
import { getMillis } from '../../utils/time';
import { downloadCsv } from './exportCsv';

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

    if (loading) return <div className="p-12 text-center animate-pulse opacity-50">Chargement de la liste d'abonnés...</div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* Header */}
            <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${darkMode ? 'bg-stone-900 text-white' : 'bg-stone-900 text-white'}`}>
                <div>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-1 md:mb-2 flex items-center gap-3">
                        <Mail size={28} className="text-stone-300" /> Abonnés Newsletter
                    </h2>
                    <p className="text-stone-400 font-medium text-xs md:text-sm">Base de données des clients intéressés par la newsletter.</p>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher (email, nom)..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-stone-900 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm"
                        />
                    </div>
                    <button
                        onClick={handleExportCsv}
                        className="w-full sm:w-auto px-6 py-4 bg-white text-stone-900 rounded-xl font-black uppercase text-[10px] md:text-xs tracking-widest hover:bg-stone-200 transition-colors flex items-center justify-center gap-3 shadow-lg shrink-0"
                    >
                        <Download size={16} /> Exporter CSV
                    </button>
                </div>
            </div>

            {/* List */}
            <div className={`rounded-[2.5rem] overflow-hidden shadow-sm ring-1 ${darkMode ? 'bg-stone-800 ring-stone-700/50' : 'bg-white ring-stone-100'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'bg-stone-900/50 text-stone-400' : 'bg-stone-50 text-stone-500'}`}>
                                <th className="p-6 pb-4">Nom Complet</th>
                                <th className="p-6 pb-4">Contact (Email/Tél)</th>
                                <th className="p-6 pb-4 hidden md:table-cell">Date d'inscription</th>
                                <th className="p-6 pb-4 hidden sm:table-cell">Source</th>
                                <th className="p-6 pb-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-700/50">
                            {filteredSubscribers.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center text-stone-400 font-bold">
                                        Aucun abonné trouvé.
                                    </td>
                                </tr>
                            ) : (
                                filteredSubscribers.map((sub) => (
                                    <tr key={sub.id} className={`group transition-colors ${darkMode ? 'hover:bg-stone-700/30' : 'hover:bg-stone-50'}`}>
                                        <td className="p-6 py-4">
                                            <div className={`font-black tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>
                                                {sub.firstName} {sub.lastName}
                                            </div>
                                        </td>
                                        <td className="p-6 py-4">
                                            <div className={`font-mono text-sm break-all ${darkMode ? 'text-stone-300' : 'text-stone-600'}`}>
                                                {sub.contactInfo}
                                            </div>
                                        </td>
                                        <td className="p-6 py-4 hidden md:table-cell">
                                            <div className="text-xs text-stone-400 font-bold">
                                                {sub.createdAt ? new Date(getMillis(sub.createdAt)).toLocaleDateString('fr-FR', {
                                                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                }) : '-'}
                                            </div>
                                        </td>
                                        <td className="p-6 py-4 hidden sm:table-cell">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${darkMode ? 'bg-stone-700 text-stone-300' : 'bg-stone-100 text-stone-500'}`}>
                                                {sub.source}
                                            </span>
                                        </td>
                                        <td className="p-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(sub.id, sub.contactInfo)}
                                                className={`p-2 rounded-lg transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 ${darkMode ? 'bg-red-900/10 hover:bg-red-900/30 text-red-500' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                                                title="Supprimer l'abonné"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminNewsletter;
