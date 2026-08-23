import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getCallableFunction } from '../config/firebaseLazy';
import { UserPlus, Trash2, Shield, Loader2 } from 'lucide-react';
import {
    adminSurfaces,
    EmptyState,
    Field,
    LoadingPanel,
    Notice,
    PageHeader,
    StatusDot,
    inputClass
} from './adminUiKit';

const isOwnerAdminRecord = (user) => user?.superAdmin === true || user?.role === 'owner';

const AdminUsers = ({ darkMode }) => {
    const [users, setUsers] = useState([]); // Array of user objects
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Form State
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [feedback, setFeedback] = useState({ type: '', text: '' });

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
            const addAdminFn = await getCallableFunction('addAdminUser');
            // Call Cloud Function
            const result = await addAdminFn({
                email: newEmail,
                name: newName,
                confirmText: 'AJOUTER ADMIN'
            });

            if (result.data.success) {
                setIsAddModalOpen(false);
                setNewEmail('');
                setNewName('');
                setFeedback({
                    type: 'success',
                    text: result.data.userExists
                        ? 'Compte trouvé : cette personne dispose désormais des droits administrateur.'
                        : 'Invitation enregistrée : les droits seront appliqués à la première connexion Google.'
                });
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
            const removeAdminFn = await getCallableFunction('removeAdminUser');
            await removeAdminFn({ uid, email, confirmText: 'RETIRER ADMIN' });
            setFeedback({ type: 'success', text: `Droits retirés à ${email}.` });
        } catch (error) {
            console.error(error);
            setFeedback({ type: 'error', text: error.message || 'Retrait des droits impossible.' });
        }
    };

    const surfaces = adminSurfaces(darkMode);
    const field = inputClass(darkMode);

    if (loading) return <LoadingPanel darkMode={darkMode} label="Chargement des accès administrateur…" />;

    return (
        <div className="space-y-5">
            <PageHeader
                darkMode={darkMode}
                description="Personnes autorisées à ouvrir le back-office de la boutique."
                title="Accès administrateur"
                actions={(
                    <button
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${surfaces.primaryButton}`}
                        onClick={() => { setErrorMsg(''); setIsAddModalOpen(true); }}
                        type="button"
                    >
                        <UserPlus size={15} />
                        Ajouter un administrateur
                    </button>
                )}
            />

            {feedback.text ? (
                <Notice darkMode={darkMode} tone={feedback.type === 'success' ? 'success' : 'error'}>
                    {feedback.text}
                </Notice>
            ) : null}

            {users.length === 0 ? (
                <EmptyState
                    darkMode={darkMode}
                    description="Ajoutez une personne pour lui ouvrir le back-office."
                    icon={<Shield size={26} />}
                    title="Aucun administrateur"
                />
            ) : (
                <section className={`overflow-hidden rounded-2xl border ${surfaces.panel}`}>
                    <div className={`flex items-center justify-between border-b px-5 py-3.5 ${surfaces.divider}`}>
                        <h3 className="text-sm font-black">Comptes autorisés</h3>
                        <span className={`text-xs tabular-nums ${surfaces.muted}`}>{users.length}</span>
                    </div>
                    <div className={`divide-y ${surfaces.hairline}`}>
                        {users.map((user) => {
                            const pending = user.uid.startsWith('pending_');
                            const owner = isOwnerAdminRecord(user);
                            return (
                                <article
                                    className={`grid gap-3 px-5 py-4 transition sm:grid-cols-[minmax(0,1.4fr)_150px_120px_44px] sm:items-center ${surfaces.hoverRow}`}
                                    key={user.uid}
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black tracking-tight">{user.name || 'Sans nom'}</p>
                                        <p className={`mt-0.5 truncate text-xs ${surfaces.muted}`}>{user.email}</p>
                                    </div>
                                    <StatusDot
                                        darkMode={darkMode}
                                        label={pending ? 'En attente' : 'Actif'}
                                        tone={pending ? 'amber' : 'emerald'}
                                    />
                                    <p className={`text-xs font-semibold ${surfaces.muted}`}>
                                        {owner ? 'Propriétaire' : (user.role || 'Administrateur')}
                                    </p>
                                    {owner ? <span /> : (
                                        <button
                                            aria-label={`Révoquer les droits de ${user.email}`}
                                            className="justify-self-start rounded-lg p-2 text-stone-400 transition hover:bg-red-500/10 hover:text-red-600 sm:justify-self-end"
                                            onClick={() => handleRemoveUser(user.uid, user.email)}
                                            type="button"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                </section>
            )}

            {isAddModalOpen ? (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                    <form
                        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${surfaces.panel}`}
                        onSubmit={handleAddUser}
                    >
                        <h3 className="text-xl font-black tracking-tight">Inviter un administrateur</h3>
                        <p className={`mt-1 text-sm ${surfaces.muted}`}>
                            L’accès est confirmé à la première connexion Google de la personne.
                        </p>

                        <div className="mt-5 space-y-4">
                            <Field darkMode={darkMode} htmlFor="admin-invite-name" label="Nom">
                                <input
                                    className={field}
                                    id="admin-invite-name"
                                    onChange={(event) => setNewName(event.target.value)}
                                    placeholder="Jean Dupont"
                                    required
                                    type="text"
                                    value={newName}
                                />
                            </Field>
                            <Field darkMode={darkMode} htmlFor="admin-invite-email" label="Adresse e-mail">
                                <input
                                    className={field}
                                    id="admin-invite-email"
                                    onChange={(event) => setNewEmail(event.target.value)}
                                    placeholder="prenom.nom@gmail.com"
                                    required
                                    type="email"
                                    value={newEmail}
                                />
                            </Field>
                        </div>

                        {errorMsg ? (
                            <div className="mt-4">
                                <Notice darkMode={darkMode} tone="error">{errorMsg}</Notice>
                            </div>
                        ) : null}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                className={`rounded-lg border px-4 py-2.5 text-sm font-bold transition active:translate-y-px ${surfaces.secondaryButton}`}
                                onClick={() => setIsAddModalOpen(false)}
                                type="button"
                            >
                                Annuler
                            </button>
                            <button
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-60 ${surfaces.primaryButton}`}
                                disabled={submitting}
                                type="submit"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={15} /> : <UserPlus size={15} />}
                                Envoyer l’invitation
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}
        </div>
    );
};

export default AdminUsers;
