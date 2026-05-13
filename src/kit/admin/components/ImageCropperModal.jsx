import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, RotateCw, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImg } from '../../../utils/imageUtils';

const ImageCropperModal = ({ isOpen, image, onClose, onCropComplete, aspect = 3 / 4, darkMode = false }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropChange = (crop) => setCrop(crop);
    const onZoomChange = (zoom) => setZoom(zoom);
    const onRotationChange = (rotation) => setRotation(rotation);

    const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleGenerateCroppedImage = async () => {
        try {
            if (!image || !croppedAreaPixels) return;
            const croppedBlob = await getCroppedImg(image, croppedAreaPixels, rotation);
            onCropComplete(croppedBlob);
            onClose();
        } catch (e) {
            console.error(e);
            alert("Erreur lors du recadrage");
        }
    };

    if (!isOpen || !image) return null;

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-300">
            <div className={`relative w-full max-w-4xl h-[80vh] flex flex-col rounded-[2.5rem] overflow-hidden shadow-2xl border ${darkMode ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}`}>

                {/* Header */}
                <div className={`flex justify-between items-center p-6 border-b ${darkMode ? 'border-stone-800' : 'border-stone-50'}`}>
                    <div className="flex flex-col">
                        <h3 className={`text-xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-stone-900'}`}>Recadrage</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">Ajustez l'image pour le cadre</p>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${darkMode ? 'hover:bg-stone-800 text-stone-400' : 'hover:bg-stone-50 text-stone-500'}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Cropper Area */}
                <div className="relative flex-1 bg-stone-950 overflow-hidden">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        aspect={aspect}
                        onCropChange={onCropChange}
                        onCropComplete={onCropCompleteInternal}
                        onZoomChange={onZoomChange}
                        onRotationChange={onRotationChange}
                        classes={{
                            containerClassName: "bg-stone-950",
                            mediaClassName: "opacity-100",
                            cropAreaClassName: "border-2 border-amber-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]"
                        }}
                    />
                </div>

                {/* Controls */}
                <div className={`p-8 space-y-8 ${darkMode ? 'bg-stone-900' : 'bg-stone-50/50'}`}>

                    <div className="flex flex-col gap-6">
                        {/* Zoom Control */}
                        <div className="flex items-center gap-4">
                            <ZoomOut size={16} className="text-stone-400" />
                            <input
                                type="range"
                                value={zoom}
                                min={1}
                                max={3}
                                step={0.1}
                                aria-labelledby="Zoom"
                                onChange={(e) => setZoom(e.target.value)}
                                className="flex-1 accent-amber-500 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full appearance-none cursor-pointer"
                            />
                            <ZoomIn size={16} className="text-stone-400" />
                        </div>

                        {/* Rotation Control */}
                        <div className="flex justify-center gap-6">
                            <button
                                onClick={() => setRotation((r) => r - 90)}
                                className={`p-3 rounded-full border transition-all ${darkMode ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-stone-200 text-stone-500 hover:bg-white'}`}
                                title="Pivoter à gauche"
                            >
                                <RotateCcw size={20} />
                            </button>
                            <button
                                onClick={() => setRotation((r) => r + 90)}
                                className={`p-3 rounded-full border transition-all ${darkMode ? 'border-stone-700 text-stone-300 hover:bg-stone-800' : 'border-stone-200 text-stone-500 hover:bg-white'}`}
                                title="Pivoter à droite"
                            >
                                <RotateCw size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center gap-4 pt-4 border-t border-stone-200 dark:border-stone-800">
                        <button
                            onClick={onClose}
                            className={`flex-1 py-4 font-black uppercase text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] rounded-2xl transition-all border ${darkMode ? 'border-stone-700 text-stone-400 hover:bg-stone-800' : 'border-stone-200 text-stone-500 hover:bg-white shadow-sm'}`}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleGenerateCroppedImage}
                            className="flex-[2] py-4 bg-amber-500 text-white font-black uppercase text-[9px] sm:text-[10px] tracking-[0.1em] sm:tracking-[0.2em] rounded-2xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                        >
                            <Check size={16} className="hidden sm:block" />
                            Valider le recadrage
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ImageCropperModal;
