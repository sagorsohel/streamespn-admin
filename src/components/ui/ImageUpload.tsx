import React, { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { UploadCloud, Link as LinkIcon, X, CheckCircle2, Loader2 } from 'lucide-react';
import { uploadImageFile } from '../../lib/imageUpload';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = 'Image / Logo',
  placeholder = 'https://example.com/image.png',
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Process File Upload
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WEBP, GIF, SVG).');
      return;
    }

    // Limit size to 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be less than 10MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const uploadedUrl = await uploadImageFile(file, (percent) => {
        setProgress(percent);
      });
      onChange(uploadedUrl);
      toast.success('Image uploaded successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Image upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Drag Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // File Input Change
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300">{label}</label>
        {/* Toggle Mode: Upload vs Direct URL */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="h-3 w-3" /> Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1 rounded-md px-2 py-0.5 font-medium transition-all ${
              activeTab === 'url'
                ? 'bg-rose-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="h-3 w-3" /> Image URL
          </button>
        </div>
      </div>

      {/* Image Preview Box (If Value Present) */}
      {value ? (
        <div className="relative flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
              <img
                src={value}
                alt="Preview"
                className="h-full w-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Error';
                }}
              />
            </div>
            <div className="overflow-hidden text-xs space-y-0.5">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="truncate max-w-[220px]">Image Ready</span>
              </div>
              <p className="font-mono text-[11px] text-slate-400 truncate max-w-[220px]">{value}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:border-rose-500 hover:bg-rose-900/60 hover:text-rose-300 transition-all"
            title="Remove Image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : activeTab === 'upload' ? (
        /* DRAG & DROP ZONE */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-rose-500 bg-rose-500/10 shadow-lg shadow-rose-500/10 scale-[1.01]'
              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept="image/*"
            className="hidden"
          />

          {uploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <Loader2 className="h-7 w-7 animate-spin text-rose-500" />
              <p className="text-xs font-semibold text-slate-200">
                Uploading to Image CDN... {progress}%
              </p>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-rose-600 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-rose-400 hover:underline">Click to upload</span> or drag and drop image file
              </div>
              <p className="text-[10px] text-slate-500">PNG, JPG, WEBP, GIF, SVG up to 10MB (Saved to image.streamespn.org)</p>
            </div>
          )}
        </div>
      ) : (
        /* DIRECT URL INPUT ZONE */
        <div className="relative">
          <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-600 focus:border-rose-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};
