import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, ArrowRight, Trash2, Send, CornerDownRight } from 'lucide-react';
import { db, appId } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { getMillis } from '../../utils/time';
import KIT_CONFIG from '../config/constants';

const AdminComments = ({ darkMode = false }) => {
    // State
    const [itemsWithComments, setItemsWithComments] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [activeComments, setActiveComments] = useState([]);
    const [replyText, setReplyText] = useState('');

    const messagesEndRef = useRef(null);

    // 1. Fetch items with comments (unified 'furniture' collection)
    useEffect(() => {
        const unsubFurniture = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'furniture'), (snap) => {
            const all = snap.docs
                .map(d => ({ id: d.id, ...d.data(), _collection: 'furniture' }))
                .filter(i => i.commentCount > 0)
                .sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
            setItemsWithComments(all);
        });

        return () => unsubFurniture();
    }, []);

    // 2. Load Conversation when Item Selected
    useEffect(() => {
        if (!selectedItemId) return;

        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'furniture', selectedItemId, 'comments'), orderBy('createdAt', 'asc'));

        const unsub = onSnapshot(q, (snap) => {
            setActiveComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsub();
    }, [selectedItemId, itemsWithComments]);

    // Actions
    const handleReply = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedItemId) return;

        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'furniture', selectedItemId, 'comments'), {
                text: replyText.trim(),
                userId: 'ADMIN',
                userName: `${KIT_CONFIG.brandName} (Admin)`,
                isAdmin: true,
                createdAt: serverTimestamp()
            });

            // NO MANUAL INCREMENT HERE - Cloud Function 'onCommentCreated' handles it.

            setReplyText('');
        } catch (error) {
            console.error("Error replying:", error);
            alert("Erreur envoi réponse");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Supprimer ce message ?")) return;
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'furniture', selectedItemId, 'comments', commentId));

            // NO MANUAL DECREMENT HERE - Cloud Function 'onCommentDeleted' handles it.

        } catch (error) { console.error(error); }
    };

    const selectedItem = itemsWithComments.find(i => i.id === selectedItemId);

    return (
        <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden min-h-[600px] flex transition-all ${darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}>
            {/* --- SIDEBAR LISTE --- */}
            <div className={`w-full md:w-80 border-r flex flex-col ${selectedItemId ? 'hidden md:flex' : 'flex'} ${darkMode ? 'bg-stone-900/40 border-stone-700' : 'bg-stone-50/50 border-stone-100'}`}>
                <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-stone-700' : 'border-stone-100'}`}>
                    <h3 className="font-black uppercase tracking-widest text-xs text-stone-500">Boîte de réception</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${darkMode ? 'bg-stone-700 text-stone-300' : 'bg-stone-200 text-stone-600'}`}>{itemsWithComments.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {itemsWithComments.length === 0 ? (
                        <div className="p-8 text-center opacity-40">
                            <MessageCircle className="mx-auto mb-2" />
                            <p className="text-xs font-bold">Aucun commentaire</p>
                        </div>
                    ) : (
                        itemsWithComments.map(item => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItemId(item.id)}
                                className={`p-4 border-b cursor-pointer transition-all group ${darkMode ? 'border-stone-700' : 'border-stone-100'} ${selectedItemId === item.id ? (darkMode ? 'bg-stone-800 border-l-4 border-l-white shadow-sm' : 'bg-white border-l-4 border-l-stone-900 shadow-sm') : (darkMode ? 'hover:bg-stone-800/50 border-l-4 border-l-transparent' : 'hover:bg-white border-l-4 border-l-transparent')}`}
                            >
                                <div className="flex gap-3">
                                    <div className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 ${darkMode ? 'bg-stone-700' : 'bg-stone-200'}`}>
                                        <img src={item.images?.[0] || item.imageUrl} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-stone-900'}`}>{item.name}</h4>
                                            {item.commentCount > 0 && <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 rounded-full">{item.commentCount}</span>}
                                        </div>
                                        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mt-1">{KIT_CONFIG.collections.find(c => c.id === item._collection)?.label || item._collection}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* --- ZONE CONVERSATION --- */}
            <div className={`flex-1 flex flex-col ${!selectedItemId ? 'hidden md:flex' : 'flex'} ${darkMode ? 'bg-stone-900/20' : 'bg-[#FAF9F6]'}`}>
                {!selectedItemId ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 px-6 text-center">
                        <CornerDownRight size={48} strokeWidth={1} className={darkMode ? 'text-stone-600' : 'text-stone-300'} />
                        <p className={`mt-4 font-serif text-xl ${darkMode ? 'text-stone-500' : 'text-stone-300'}`}>Sélectionnez un article pour voir la conversation</p>
                    </div>
                ) : (
                    <>
                        {/* HEADER CONVERSATION */}
                        <div className={`p-6 border-b flex items-center justify-between shadow-sm z-10 ${darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-100'}`}>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedItemId(null)} className="md:hidden p-2 -ml-2 text-stone-400"><ArrowRight className="rotate-180" size={20} /></button>
                                <div className="flex items-center gap-3">
                                    <img src={selectedItem?.images?.[0] || selectedItem?.imageUrl} className={`w-10 h-10 rounded-full object-cover border ${darkMode ? 'border-stone-700' : 'border-stone-200'}`} alt="" />
                                    <div>
                                        <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-stone-900'}`}>{selectedItem?.name}</h3>
                                        <p className="text-[10px] text-stone-400 uppercase tracking-widest">{selectedItem?._collection}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MESSAGES LIST */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {activeComments.length === 0 ? (
                                <p className="text-center text-xs text-stone-400 italic py-10">Chargement des messages...</p>
                            ) : (
                                activeComments.map((msg) => (
                                    <div key={msg.id} className={`flex flex-col gap-1 ${msg.isAdmin ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2`}>
                                        <div className={`max-w-[80%] rounded-2xl p-4 text-sm relative group shadow-sm ${msg.isAdmin ? (darkMode ? 'bg-white text-stone-900 rounded-tr-none' : 'bg-stone-900 text-white rounded-tr-none') : (darkMode ? 'bg-stone-800 border border-stone-700 text-stone-200 rounded-tl-none' : 'bg-white border border-stone-200 text-stone-800 rounded-tl-none')}`}>
                                            <p>{msg.text}</p>
                                            <button
                                                onClick={() => handleDeleteComment(msg.id)}
                                                className={`absolute -top-2 -right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm ${darkMode ? 'bg-red-900 text-red-100 hover:bg-red-500 hover:text-white' : 'bg-red-100 text-red-500 hover:bg-red-500 hover:text-white'}`}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <span className="text-[9px] text-stone-400 font-medium px-2 flex items-center gap-1">
                                            {msg.userName} {msg.isAdmin && '(Admin)'} • {msg.createdAt ? new Date(getMillis(msg.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                        </span>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* INPUT REPLY */}
                        <form onSubmit={handleReply} className={`p-4 border-t flex gap-3 ${darkMode ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'}`}>
                            <input
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                placeholder="Répondre en tant qu'administrateur..."
                                className={`flex-1 rounded-full px-5 py-3 text-sm outline-none transition-all ${darkMode ? 'bg-stone-900 text-white ring-white/10 focus:ring-2' : 'bg-stone-100 text-stone-900 ring-stone-900/10 focus:ring-2'}`}
                            />
                            <button type="submit" disabled={!replyText.trim()} className={`p-3 rounded-full hover:scale-105 disabled:opacity-50 disabled:scale-100 transition-all shadow-md ${darkMode ? 'bg-white text-stone-900 shadow-white/5' : 'bg-stone-900 text-white shadow-stone-900/10'}`}>
                                <Send size={18} />
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminComments;
