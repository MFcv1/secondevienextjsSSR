import { useState, useRef } from 'react';
import { X, Save, Type } from 'lucide-react';
import useModalFocus from '../../ui/useModalFocus';

const TextEditorSession = ({ onClose, onSave, itemKey, initialData, fields, darkMode }) => {
    const [formData, setFormData] = useState(() => Object.fromEntries(fields.map(field => [
        field.key, initialData?.[field.key] ?? (field.type === 'toggle' ? false : ''),
    ])));
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const runningRef = useRef(false);
    const dialogRef = useModalFocus(true, onClose, busy);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (runningRef.current) return;
        runningRef.current = true;
        setBusy(true);
        setError('');
        try {
            await onSave(itemKey, formData);
        } catch (failure) {
            setError(failure?.message || 'Enregistrement impossible.');
        } finally {
            runningRef.current = false;
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={() => { if (!runningRef.current) onClose(); }}
            ></div>

            {/* Modal */}
            <fieldset ref={dialogRef} disabled={busy} role="dialog" aria-modal="true" aria-label="Éditer le texte" aria-busy={busy} tabIndex={-1} className={`relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all ${darkMode ? 'bg-stone-900 border border-stone-700' : 'bg-[#FAF9F6] border border-white'}`}>

                {/* Header */}
                <div className={`px-6 py-4 md:px-8 md:py-6 border-b flex justify-between items-center ${darkMode ? 'border-stone-800' : 'border-black/5 bg-white'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-stone-800 text-stone-200' : 'bg-stone-100 text-stone-600'}`}>
                            <Type size={18} className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                        </div>
                        <div>
                            <h3 className={`text-base md:text-lg font-black uppercase tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Éditer le texte</h3>
                            <p className="text-[10px] md:text-xs text-stone-400 font-bold uppercase tracking-wider">{itemKey}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        aria-label="Fermer l’éditeur"
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-100 text-stone-500'}`}
                    >
                        <X size={20} className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 md:space-y-6 max-h-[70vh] overflow-y-auto">
                    {fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <label htmlFor={`text-editor-${field.key}`} className={`block text-[10px] md:text-xs font-black uppercase tracking-widest ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>
                                {field.label}
                            </label>

                            {field.type === 'toggle' ? (
                                <button
                                    type="button"
                                    id={`text-editor-${field.key}`}
                                    role="switch"
                                    aria-checked={Boolean(formData[field.key])}
                                    onClick={() => setFormData(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                                    className={`relative w-12 h-7 md:w-14 md:h-8 rounded-full cursor-pointer transition-all duration-300 p-1 ${formData[field.key] !== false ? 'bg-emerald-500' : 'bg-stone-300'}`}
                                >
                                    <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${formData[field.key] !== false ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            ) : field.type === 'textarea' ? (
                                <textarea
                                    id={`text-editor-${field.key}`}
                                    name={field.key}
                                    value={formData[field.key] || ''}
                                    onChange={handleChange}
                                    rows={4}
                                    placeholder={field.placeholder}
                                    className={`w-full p-3 md:p-4 text-sm rounded-xl border-2 bg-transparent transition-all outline-none focus:ring-4 ${darkMode ? 'border-stone-700 focus:border-stone-500 focus:ring-stone-500/20 text-white placeholder-stone-700' : 'border-stone-200 focus:border-stone-900 focus:ring-stone-900/10 text-stone-900 placeholder-stone-300'}`}
                                />
                            ) : (
                                <input
                                    id={`text-editor-${field.key}`}
                                    type="text"
                                    name={field.key}
                                    value={formData[field.key] || ''}
                                    onChange={handleChange}
                                    placeholder={field.placeholder}
                                    className={`w-full p-3 md:p-4 text-sm rounded-xl border-2 bg-transparent transition-all outline-none focus:ring-4 ${darkMode ? 'border-stone-700 focus:border-stone-500 focus:ring-stone-500/20 text-white placeholder-stone-700' : 'border-stone-200 focus:border-stone-900 focus:ring-stone-900/10 text-stone-900 placeholder-stone-300'}`}
                                />
                            )}
                            <p className="text-[9px] md:text-[10px] text-stone-400 italic">{field.help}</p>
                        </div>
                    ))}
                </form>
                {error && <p role="alert" className="px-6 text-sm text-red-600">{error}</p>}

                {/* Footer */}
                <div className={`px-6 py-4 md:px-8 md:py-6 border-t flex justify-end gap-3 md:gap-4 ${darkMode ? 'border-stone-800 bg-stone-900' : 'border-black/5 bg-stone-50'}`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-2.5 md:px-6 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors ${darkMode ? 'text-stone-400 hover:text-white' : 'text-stone-500 hover:text-stone-900'}`}
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={`px-6 py-2.5 md:px-8 md:py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all ${darkMode ? 'bg-white text-stone-900 hover:bg-stone-200' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                    >
                        <Save size={14} />
                        {busy ? 'Enregistrement…' : 'Enregistrer'}
                    </button>
                </div>
            </fieldset>
        </div>
    );
};

export default function TextEditorModal(props) {
    return props.isOpen ? <TextEditorSession key={props.itemKey} {...props} /> : null;
}
