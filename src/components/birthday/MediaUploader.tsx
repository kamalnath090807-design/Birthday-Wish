import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Video, X, Loader2, UploadCloud, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';
import { sound } from '../../utils/audio';

interface MediaUploaderProps {
  onImageUploaded: (url: string | null) => void;
  onVideoUploaded: (url: string | null) => void;
  imageUrl: string | null;
  videoUrl: string | null;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  onImageUploaded,
  onVideoUploaded,
  imageUrl,
  videoUrl,
}) => {
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<'image' | 'video' | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      showToast('Photo is too large. Please select an image under 5MB.', 'error', 'File Size Limit');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload a JPG, PNG, or WEBP image.', 'error', 'Invalid File Type');
      return;
    }

    try {
      setIsUploading(true);
      setUploadType('image');
      sound.playPop();

      const res = await api.uploadMedia(file);
      onImageUploaded(res.url);
      showToast('Photo attached successfully! ✨', 'success', 'Photo Uploaded');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error', 'Upload Error');
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size: 25MB
    if (file.size > 25 * 1024 * 1024) {
      showToast('Video is too large. Please select a clip under 25MB.', 'error', 'File Size Limit');
      return;
    }

    // Validate type
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      showToast('Please upload an MP4 or WebM video.', 'error', 'Invalid Video Type');
      return;
    }

    try {
      setIsUploading(true);
      setUploadType('video');
      sound.playPop();

      const res = await api.uploadMedia(file);
      onVideoUploaded(res.url);
      showToast('Video greeting attached successfully! 🎥', 'success', 'Video Uploaded');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload video', 'error', 'Upload Error');
    } finally {
      setIsUploading(false);
      setUploadType(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <UploadCloud className="w-3.5 h-3.5 text-celebration-pink" />
          <span>Attach Photo or Video (Optional)</span>
        </label>
        <span className="text-[11px] text-slate-500">JPG/PNG ≤5MB, MP4 ≤25MB</span>
      </div>

      {/* Hidden Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageSelect}
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoSelect}
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
      />

      {/* Upload Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          disabled={isUploading || !!imageUrl}
          onClick={() => imageInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition ${
            imageUrl
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 opacity-60 cursor-not-allowed'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white active:scale-95'
          }`}
        >
          {isUploading && uploadType === 'image' ? (
            <Loader2 className="w-4 h-4 animate-spin text-celebration-pink" />
          ) : (
            <Camera className="w-4 h-4 text-celebration-pink" />
          )}
          <span>{imageUrl ? 'Photo Added' : 'Add Photo / Selfie'}</span>
        </button>

        <button
          type="button"
          disabled={isUploading || !!videoUrl}
          onClick={() => videoInputRef.current?.click()}
          className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-semibold transition ${
            videoUrl
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 opacity-60 cursor-not-allowed'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200 hover:text-white active:scale-95'
          }`}
        >
          {isUploading && uploadType === 'video' ? (
            <Loader2 className="w-4 h-4 animate-spin text-celebration-cyan" />
          ) : (
            <Video className="w-4 h-4 text-celebration-cyan" />
          )}
          <span>{videoUrl ? 'Video Added' : 'Add Video Wish'}</span>
        </button>
      </div>

      {/* Upload Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {imageUrl && (
          <div className="relative group rounded-2xl overflow-hidden border border-emerald-500/40 bg-dark-900 shadow-md">
            <img src={imageUrl} alt="Attached wish photo" className="w-full h-40 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-2.5">
              <span className="text-[11px] font-medium text-emerald-300 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" /> Photo Attached
              </span>
              <button
                type="button"
                onClick={() => {
                  onImageUploaded(null);
                  sound.playPop();
                }}
                className="p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition shadow-lg"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {videoUrl && (
          <div className="relative group rounded-2xl overflow-hidden border border-celebration-cyan/40 bg-dark-900 shadow-md">
            <video src={videoUrl} controls className="w-full h-40 object-cover bg-black" />
            <div className="absolute top-2 right-2">
              <button
                type="button"
                onClick={() => {
                  onVideoUploaded(null);
                  sound.playPop();
                }}
                className="p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-500 text-white transition shadow-lg"
                title="Remove video"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
