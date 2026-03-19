import { useState, useEffect } from 'react';
import {
    Camera,
    LayoutGrid,
    MinusCircle,
    Plus,
    Maximize2,
    History,
    Image as ImageIcon,
    Tag,
    Trash2
} from 'lucide-react';
import { supabase } from '../../supabase';
import { useToast } from '../Toast';
import { Modal } from '../Modal';

interface PhotoGalleryProps {
    patientId: string;
    theme?: 'light' | 'dark';
}

export function PhotoGallery({ patientId, theme }: PhotoGalleryProps) {
    const { showToast } = useToast();
    const isDark = theme === 'dark';
    const [photos, setPhotos] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
    const [tag, setTag] = useState('Pre-Op');

    useEffect(() => {
        if (patientId) fetchPhotos();
    }, [patientId]);

    const fetchPhotos = async () => {
        // We'll store photos in a specific 'clinical_photos' bucket or table
        // For simplicity, we'll use a table metadata entry
        const { data } = await supabase
            .from('clinical_photos')
            .select('*')
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false });
        if (data) setPhotos(data);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        let file = e.target.files?.[0];
        if (!file || !patientId) return;

        setIsUploading(true);
        
        try {
            // ── [NEW] Compression inside handler ──
            try {
                const { default: imageCompression } = await import('browser-image-compression');
                const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                const compressedFile = await imageCompression(file, options);
                file = new File([compressedFile], file.name, { type: file.type });
            } catch (compErr) {
                console.error("Compression failed, using original:", compErr);
            }

            const fileName = `${patientId}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

            // 1. Upload to storage
            const { data: storageData, error: storageError } = await supabase.storage
                .from('clinical-assets')
                .upload(fileName, file);

            if (storageError) throw storageError;

            // 2. Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('clinical-assets')
                .getPublicUrl(fileName);

            // 3. Save to database table
            const { error: dbError } = await supabase.from('clinical_photos').insert({
                patient_id: patientId,
                url: publicUrl,
                tag: tag,
                note: ''
            });

            if (dbError) throw dbError;

            showToast('Photo uploaded successfully', 'success');
            fetchPhotos();
        } catch (error: any) {
            showToast(error.message || 'Error uploading photo', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const deletePhoto = async (photo: any) => {
        if (!window.confirm('Are you sure you want to delete this photo?')) return;

        const path = photo.url.split('clinical-assets/')[1];
        await supabase.storage.from('clinical-assets').remove([path]);
        await supabase.from('clinical_photos').delete().eq('id', photo.id);

        showToast('Photo deleted', 'success');
        fetchPhotos();
    };

    return (
        <div className="space-y-6">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-white/5' : 'bg-white border-slate-100 shadow-sm'}`}>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <Camera size={16} className="text-primary" />
                            Clinical Resource Vault
                        </h3>
                        <p className={`text-[10px] font-medium mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Captured comparisons and snapshots</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={tag}
                            onChange={(e) => setTag(e.target.value)}
                            className={`rounded-xl px-4 py-3 text-xs font-bold border outline-none ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}`}
                        >
                            <option>Pre-Op</option>
                            <option>Intra-Op</option>
                            <option>Post-Op</option>
                            <option>X-Ray</option>
                        </select>
                        <label className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all cursor-pointer active:scale-95">
                            <Plus size={18} />
                            <span>Capture New</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={isUploading} />
                        </label>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {photos.length > 0 ? photos.map((photo) => (
                        <div key={photo.id} className="group relative aspect-square rounded-[2rem] overflow-hidden border border-transparent hover:border-primary/50 transition-all shadow-sm bg-slate-950">
                            <img src={photo.url} className="w-full h-full object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" alt="Clinical" />

                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[9px] font-extrabold text-white uppercase tracking-widest border border-white/10">
                                    {photo.tag}
                                </span>
                            </div>

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end justify-between">
                                <button onClick={() => setSelectedPhoto(photo)} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all">
                                    <Maximize2 size={18} />
                                </button>
                                <button onClick={() => deletePhoto(photo)} className="w-10 h-10 rounded-xl bg-rose-500/20 backdrop-blur-md text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-4 py-20 text-center border-2 border-dashed rounded-[3rem] border-slate-800/10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/5 flex items-center justify-center text-primary/30 mb-4">
                                <ImageIcon size={32} />
                            </div>
                            <p className="font-medium text-slate-500">The clinical vault is empty. Upload diagnostic images above.</p>
                        </div>
                    )}
                </div>
            </div>

            {selectedPhoto && (
                <Modal isOpen={true} onClose={() => setSelectedPhoto(null)} title={`Imaging Viewer - ${selectedPhoto.tag}`}>
                    <div className="flex flex-col items-center">
                        <img src={selectedPhoto.url} className="max-w-full max-h-[70vh] rounded-3xl object-contain shadow-2xl" alt="Full" />
                        <div className="mt-8 flex items-center gap-4 text-sm font-medium text-slate-500">
                            <History size={16} />
                            {new Date(selectedPhoto.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
