import React, { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { doc, onSnapshot } from 'firebase/firestore';
import { functions, db } from '../config/firebase';
import { Users, UserPlus, Trash2, Shield, Loader, AlertCircle } from 'lucide-react';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

const AdminUsers = ({ darkMode }) => {
    const [users, setUsers] = useState([]); // Array of user objects
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // --- 1. Fetch Users from Firestore ---
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'sys_metadata', 'admin_users'), (docSnap) => {
            if (docSnap.exists() && docSnap.data().users) {
                const usersMap = docSnap.data().users;
                const usersArray = Object.entries(usersMap).map(([uid, data]) => ({
                    uid,
                    ...data
                }));
                setUsers(usersArray);
            } else {
                setUsers([]);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching admin users:", err);
            setLoading(false);
        });

        return () => unsub();
    }, []);

    // --- 2. Add User Handler ---
    const handleAddUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');

        try {
            const addAdminFn = httpsCallable(functions, 'addAdminUser');
            // Call Cloud Function
            const result = await addAdminFn({
                email: newEmail,
                name: newName
            });

            if (result.data.success) {
                setIsAddModalOpen(false);
                setNewEmail('');
                setNewName('');
                alert(result.data.userExists ? "Compte trouvé ! L'utilisateur est désormais Admin." : "Invitation ajoutée ! L'utilisateur deviendra Admin dès sa première connexion Google.");
            } else {
                setErrorMsg(result.data.message || "Une erreur est survenue lors de l'ajout.");
            }
        } catch (error) {
            console.error(error);
            setErrorMsg(error.message || "Une erreur est survenue.");
        } finally {
            setSubmitting(false);
        }
    };

    // --- 3. Remove User Handler ---
    const handleRemoveUser = async (uid, email) => {
        if (!window.confirm(`Voulez-vous vraiment retirer les droits d'administration à ${email} ?`)) return;

        try {
            const removeAdminFn = httpsCallable(functions, 'removeAdminUser');
            await removeAdminFn({ uid, email });
            // Firestore sync is automatic via onSnapshot
        } catch (error) {
            console.error(error);
            alert("Erreur: " + error.message);
        }
    };

    if (loading) return <div className="p-12 text-center animate-pulse opacity-50">Chargement des maîtres du lieu...</div>;

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 pb-20">
            {/* Header */}
            <div className={`p-8 rounded-[2.5rem] shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b ${darkMode ? 'bg-[#161616] border-white/5' : 'bg-white border-stone-200/60'}`}>
                <div>
                    <h2 className="text-3xl font-black tracking-tighter mb-2">Maîtres des Lieux</h2>
                    <p className={`font-medium text-xs tracking-wide ${darkMode ? 'text-white/40' : 'text-stone-400'}`}>Gérez l'accès au portail d'administration de votre boutique.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className={`group w-full sm:w-auto px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 shadow-xl ${
                        darkMode 
                            ? 'bg-white text-stone-900 hover:bg-stone-200' 
                            : 'bg-stone-900 text-white hover:bg-stone-800'
                    }`}
                >
                    <UserPlus size={16} className="group-hover:rotate-12 transition-transform" /> 
                    Ajouter un Admin
                </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map(user => (
                    <div key={user.uid} className={`p-8 rounded-[2.5rem] relative group transition-all duration-500 border overflow-hidden ${darkMode ? 'bg-[#161616] border-white/5 hover:border-white/20' : 'bg-white border-stone-100 shadow-sm hover:shadow-xl hover:shadow-stone-200/40'}`}>
                        {/* Status Pulse */}
                        <div className="absolute top-8 right-8">
                            <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${user.uid.startsWith('pending_') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.uid.startsWith('pending_') ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}></span>
                                {user.uid.startsWith('pending_') ? 'En attente' : 'Actif'}
                            </div>
                        </div>

                        <div className="flex items-start justify-between mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-300 ${darkMode ? 'bg-white/5 border-white/5 text-stone-400 group-hover:text-white' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>
                                <Shield size={28} strokeWidth={1.5} />
                            </div>

                            {/* Bouton Supprimer */}
                            {user.email !== SUPER_ADMIN_EMAIL && (
                                <button
                                    onClick={() => handleRemoveUser(user.uid, user.email)}
                                    className={`p-3 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 ${darkMode ? 'bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white' : 'bg-red-50 hover:bg-red-500 text-red-500 hover:text-white'}`}
                                    title="Révoquer les droits"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className={`text-xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-stone-900'}`}>{user.name}</h3>
                                <p className={`text-xs font-medium opacity-50 mt-1`}>{user.email}</p>
                            </div>

                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border-2 transition-colors ${
                                user.email === SUPER_ADMIN_EMAIL 
                                    ? (darkMode ? 'bg-amber-500/5 border-amber-500/20 text-amber-500' : 'bg-amber-50 border-amber-200 text-amber-600') 
                                    : (darkMode ? 'bg-white/5 border-white/5 text-white/40' : 'bg-stone-50 border-stone-100 text-stone-400')
                            }`}>
                                <Users size={12} />
                                {user.email === SUPER_ADMIN_EMAIL ? 'Propriétaire' : (user.role || 'Administrateur')}
                            </div>
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <div className="col-span-full text-center py-20 text-stone-400">
                        Aucun administrateur trouvé.
                    </div>
                )}
            </div>

            {/* ADD USER MODAL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <div className={`relative w-full max-w-md rounded-[2.5rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-in zoom-in-95 border ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-stone-100'}`}>
                        <div className="mb-8">
                            <h3 className={`text-3xl font-black tracking-tighter mb-2 ${darkMode ? 'text-white' : 'text-stone-900'}`}>Inviter un Admin</h3>
                            <p className={`text-xs font-medium tracking-wide ${darkMode ? 'text-white/30' : 'text-stone-400'}`}>L'accès sera validé lors de leur inscription.</p>
                        </div>

                        <form onSubmit={handleAddUser} className="space-y-6">
                            <div className="space-y-2">
                                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 ${darkMode ? 'text-white/30' : 'text-stone-400'}`}>Identité</label>
                                <input
                                    type="text"
                                    value={newName} onChange={e => setNewName(e.target.value)}
                                    placeholder="Ex: Jean Dupont"
                                    className={`w-full p-5 rounded-2xl font-bold border-2 transition-all duration-300 outline-none ${
                                        darkMode 
                                            ? 'bg-white/5 border-white/5 text-white focus:border-white/20' 
                                            : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-stone-200 shadow-inner shadow-stone-900/5'
                                    }`}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`block text-[10px] font-black uppercase tracking-[0.2em] mb-3 ml-1 ${darkMode ? 'text-white/30' : 'text-stone-400'}`}>Email Professionnel</label>
                                <input
                                    type="email"
                                    value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                    placeholder="email@gmail.com"
                                    className={`w-full p-5 rounded-2xl font-bold border-2 transition-all duration-300 outline-none ${
                                        darkMode 
                                            ? 'bg-white/5 border-white/5 text-white focus:border-white/20' 
                                            : 'bg-stone-50 border-stone-100 text-stone-900 focus:border-stone-200 shadow-inner shadow-stone-900/5'
                                    }`}
                                    required
                                />
                            </div>

                            {errorMsg && (
                                <div className="p-4 rounded-2xl bg-red-500/10 text-red-500 text-[11px] font-black flex items-center gap-3 border border-red-500/20 animate-in shake-1">
                                    <AlertCircle size={14} /> {errorMsg}
                                </div>
                            )}

                            <div className="pt-4 flex flex-col md:flex-row gap-4">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${darkMode ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200'}`}>Annuler</button>
                                <button type="submit" disabled={submitting} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl ${darkMode ? 'bg-white text-stone-900 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
                                    {submitting ? <Loader size={16} className="animate-spin" /> : <><UserPlus size={16} /> Envoyer</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
