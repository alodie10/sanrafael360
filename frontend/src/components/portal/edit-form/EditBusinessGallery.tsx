"use client";

import { Image as ImageIcon, Video, X, Upload } from "lucide-react";
import { getStrapiMedia } from "@/lib/strapi";

interface EditBusinessGalleryProps {
  existingGallery: any[];
  newGalleryFiles: File[];
  removeExistingPhoto: (id: number) => void;
  removeNewPhoto: (index: number) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover' | 'gallery') => void;
}

export default function EditBusinessGallery({
  existingGallery,
  newGalleryFiles,
  removeExistingPhoto,
  removeNewPhoto,
  handleFileChange
}: EditBusinessGalleryProps) {
  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8">
      <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-3">
         <ImageIcon className="w-6 h-6 text-blue-400" />
         Galería de Multimedia
      </h2>
      <p className="text-sm text-slate-400 mb-6 font-medium">Sube hasta <strong className="text-white">20 fotos o videos</strong> para destacar tu comercio en la plataforma.</p>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        {/* Existing Photos */}
        {existingGallery.map((photo: any) => {
          const isVideo = photo.mime?.startsWith('video/') || photo.ext?.match(/\.(mp4|mov|webm)$/i);
          return (
            <div key={`existing-${photo.id}`} className="relative group aspect-square rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl">
              {isVideo ? (
                <video src={getStrapiMedia(photo.url) || undefined} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" muted />
              ) : (
                <img src={getStrapiMedia(photo.url) || undefined} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
              )}
              {isVideo && (
                <div className="absolute top-2 left-2 p-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                  <Video className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <button 
                onClick={() => removeExistingPhoto(photo.id)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {/* New Files */}
        {newGalleryFiles.map((file, i) => {
          const isVideo = file.type.startsWith('video/');
          return (
            <div key={`new-${i}`} className="relative group aspect-square rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden shadow-xl">
              {isVideo ? (
                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" muted />
              ) : (
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
              )}
              {isVideo && (
                <div className="absolute top-2 left-2 p-1.5 bg-blue-600/60 backdrop-blur-md rounded-lg border border-white/10">
                  <Video className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <button 
                onClick={() => removeNewPhoto(i)}
                className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {/* Empty Slots */}
        {Array.from({ length: Math.max(0, 5 - (existingGallery.length + newGalleryFiles.length) % 5) }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden">
            <Upload className="w-6 h-6 text-white/5" />
          </div>
        ))}
      </div>

      <div className="relative">
        <input 
          type="file" 
          multiple 
          accept="image/*,video/*"
          onChange={(e) => handleFileChange(e, 'gallery')}
          className="hidden" 
          id="gallery-upload"
        />
        <label 
          htmlFor="gallery-upload"
          className="flex items-center justify-center gap-2 w-full py-4 px-6 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border-2 border-blue-600/30 rounded-2xl font-bold cursor-pointer transition-all border-dashed"
        >
          <Upload className="w-5 h-5" />
          {(existingGallery.length + newGalleryFiles.length) > 0 ? "Añadir más multimedia" : "Subir fotos o videos"}
        </label>
      </div>
      <p className="text-[10px] text-slate-500 mt-3 text-center uppercase tracking-widest font-black">Máximo 20 elementos | Límite 50MB recomendado</p>
    </div>
  );
}
