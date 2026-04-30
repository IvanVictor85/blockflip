'use client';

import { useCallback, useRef, useState } from 'react';
import { ImagePlus, X, Upload, AlertCircle } from 'lucide-react';
import { validateImageFile } from '@/lib/cloudinary';

interface ImageUploaderProps {
  onChange: (files: File[]) => void;
  uploading?: boolean;
  uploadProgress?: { done: number; total: number } | null;
  maxFiles?: number;
  disabled?: boolean;
}

export function ImageUploader({
  onChange,
  uploading = false,
  uploadProgress = null,
  maxFiles = 8,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const newFiles: File[] = [];
    const newErrors: string[] = [];

    Array.from(incoming).forEach((f) => {
      if (files.length + newFiles.length >= maxFiles) {
        newErrors.push(`Máximo de ${maxFiles} fotos atingido.`);
        return;
      }
      const err = validateImageFile(f);
      if (err) { newErrors.push(err); return; }
      // Deduplicate by name + size
      if (files.some((ex) => ex.name === f.name && ex.size === f.size)) return;
      newFiles.push(f);
    });

    if (newFiles.length === 0) {
      setErrors(newErrors);
      return;
    }

    const nextFiles = [...files, ...newFiles];
    const nextPreviews = [
      ...previews,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ];

    setFiles(nextFiles);
    setPreviews(nextPreviews);
    setErrors(newErrors);
    onChange(nextFiles);
  }, [files, previews, maxFiles, onChange]);

  const remove = useCallback((index: number) => {
    URL.revokeObjectURL(previews[index]);
    const nextFiles    = files.filter((_, i) => i !== index);
    const nextPreviews = previews.filter((_, i) => i !== index);
    setFiles(nextFiles);
    setPreviews(nextPreviews);
    onChange(nextFiles);
  }, [files, previews, onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const isDisabled = disabled || uploading;

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onClick={() => !isDisabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!isDisabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`
          relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
          px-4 py-8 text-center transition-colors
          ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${dragging
            ? 'border-[#14F195] bg-[#14F195]/10'
            : 'border-border hover:border-[#14F195]/50 hover:bg-[#14F195]/5'}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          disabled={isDisabled}
          onChange={(e) => addFiles(e.target.files)}
        />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14F195]/10">
          <ImagePlus className="h-6 w-6 text-[#14F195]" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Arraste fotos aqui ou <span className="text-[#14F195]">clique para selecionar</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            JPG, PNG, WebP, GIF · Máx. 10 MB por foto · Até {maxFiles} fotos
          </p>
        </div>
        {files.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {files.length} foto{files.length > 1 ? 's' : ''} selecionada{files.length > 1 ? 's' : ''}
            {maxFiles - files.length > 0 ? ` · você pode adicionar mais ${maxFiles - files.length}` : ' · limite atingido'}
          </p>
        )}
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="flex items-center gap-1.5 text-xs text-red-500">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {err}
            </p>
          ))}
        </div>
      )}

      {/* Previews grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Foto ${i + 1}`}
                className="w-full h-full object-cover"
              />
              {/* Order badge */}
              <div className="absolute top-1 left-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center text-[10px] font-bold text-white">
                {i + 1}
              </div>
              {/* Remove button */}
              {!isDisabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/90"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              )}
              {/* Upload overlay */}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-white animate-bounce" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploading && uploadProgress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Upload className="h-3.5 w-3.5 animate-bounce text-[#14F195]" />
              Enviando fotos para a nuvem…
            </span>
            <span>{uploadProgress.done}/{uploadProgress.total}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-[#14F195] transition-all duration-300"
              style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
