import React from 'react';
import { Upload, X, Loader, Image as ImageIcon, Download, Type } from 'lucide-react';

const AdminImageCard = ({
    item,
    currentImage,
    isUpdating,
    darkMode,
    onFileSelect,
    onDownload,
    onReset,
    hasCustomImage,
    hasTextSchema,
    onEditText
}) => {

    const isTextOnly = item.isTextOnly === true;

    const handleDrop = (e) => {
        if (isTextOnly) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        if (isTextOnly) return;
        e.preventDefault();
        e.stopPropagation();
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    return (
        <div
            className={`p-4 rounded-3xl ring-1 shadow-sm hover:shadow-md transition-all group relative flex flex-col will-change-transform ${darkMode ? 'bg-stone-800 ring-stone-700/50' : 'bg-white ring-stone-100'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {/* HEADER INFO */}
            <div className="mb-4">
                <p className={`font-bold text-sm truncate ${darkMode ? 'text-stone-200' : 'text-stone-800'}`} title={item.label}>{item.label}</p>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md inline-block mt-1 ${darkMode ? 'text-stone-400 bg-stone-700' : 'text-stone-400 bg-stone-50'}`}>
                    {item.format}
                </span>
            </div>

            {/* PREVIEW AREA (Image or Text Placeholder) */}
            <div className={`aspect-square w-full rounded-2xl overflow-hidden relative mb-4 ring-1 ring-stone-100/50 flex items-center justify-center ${darkMode ? 'bg-stone-900 ring-stone-700' : 'bg-stone-100 ring-stone-100'}`}>
                {isTextOnly ? (
                    <div className="flex flex-col items-center justify-center opacity-30">
                        <Type size={48} className={darkMode ? 'text-stone-500' : 'text-stone-400'} />
                        <span className="text-[10px] uppercase font-black tracking-widest mt-2 text-current">Texte Uniquement</span>
                    </div>
                ) : !currentImage ? (
                    <div className="flex flex-col items-center justify-center opacity-50">
                        <ImageIcon size={42} className={darkMode ? 'text-stone-500' : 'text-stone-400'} />
                        <span className="mt-3 px-3 text-center text-[10px] font-black uppercase tracking-widest text-current">Fallback code actif</span>
                    </div>
                ) : (
                    <>
                        <img
                            src={currentImage}
                            alt={item.label}
                            className={`w-full h-full object-cover transition-all duration-500 ${isUpdating ? 'opacity-50 blur-sm' : 'group-hover:scale-105'}`}
                        />

                        {/* LOADING OVERLAY */}
                        {isUpdating && (
                            <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                                <Loader size={24} className={`animate-spin ${darkMode ? 'text-stone-200' : 'text-stone-900'}`} />
                                <span className={`text-[9px] font-black uppercase ${darkMode ? 'text-stone-200' : 'text-stone-900'}`}>Upload...</span>
                            </div>
                        )}

                        {/* HOVER OVERLAY (Drag Hint) */}
                        {!isUpdating && (
                            <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <div className="text-center text-white p-4">
                                    <ImageIcon size={24} className="mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Glisser une image</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-auto">
                {isTextOnly ? (
                    <button
                        onClick={onEditText}
                        className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-colors font-bold uppercase text-xs tracking-wider ${darkMode ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                    >
                        <Type size={14} />
                        Modifier le contenu
                    </button>
                ) : (
                    <>
                        <label className={`flex-1 py-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all group/btn ${isUpdating ? 'opacity-50 pointer-events-none' : ''} ${darkMode ? 'border-stone-700 hover:border-stone-500 hover:bg-stone-700' : 'border-stone-200 hover:border-stone-900 hover:bg-stone-50'} cursor-pointer`}>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={isUpdating}
                            />
                            <Upload size={14} className={`text-stone-400 ${darkMode ? 'group-hover/btn:text-stone-200' : 'group-hover/btn:text-stone-900'}`} />
                            <span className={`text-[10px] font-black uppercase text-stone-400 ${darkMode ? 'group-hover/btn:text-stone-200' : 'group-hover/btn:text-stone-900'}`}>Changer</span>
                        </label>

                        <button
                            onClick={onDownload}
                            className={`w-10 flex items-center justify-center rounded-xl transition-colors ${darkMode ? 'bg-stone-700 text-stone-300 hover:bg-stone-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                            title="Télécharger l'image"
                            type="button"
                        >
                            <Download size={14} />
                        </button>

                        {hasTextSchema && (
                            <button
                                onClick={onEditText}
                                className={`w-10 flex items-center justify-center rounded-xl transition-colors ${darkMode ? 'bg-stone-700 text-stone-300 hover:bg-stone-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                                title="Éditer le texte associé"
                                type="button"
                            >
                                <Type size={14} />
                            </button>
                        )}

                        {/* RESET BUTTON (If changed) */}
                        {hasCustomImage && (
                            <button
                                onClick={onReset}
                                className={`w-10 flex items-center justify-center rounded-xl transition-colors ${darkMode ? 'bg-stone-700 text-stone-400 hover:bg-red-900/30 hover:text-red-400' : 'bg-stone-100 text-stone-600 hover:bg-red-50 hover:text-red-500'}`}
                                title="Rétablir défaut"
                                type="button"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminImageCard;
