import React, { useState, useRef, useEffect } from 'react';
import partnerApi from '../../services/partnerApi';

export interface PartnerPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string | null;
  onSuccess: (newAvatarUrl: string | null) => void;
  onShowToast?: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const PartnerPhotoModal: React.FC<PartnerPhotoModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSuccess,
  onShowToast,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError(null);
      setLoading(false);
      setRemoving(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setError('Please select a JPG, JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5 MB.');
      return;
    }

    setError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    try {
      const uploadedUrl = await partnerApi.uploadAvatar(selectedFile);
      onSuccess(uploadedUrl);
      if (onShowToast) {
        onShowToast('success', 'Your restaurant partner profile photo has been updated!', 'Photo Saved');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo. Please try again.');
      if (onShowToast) {
        onShowToast('error', err.message || 'Failed to upload photo.', 'Upload Error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);

    try {
      await partnerApi.removeAvatar();
      onSuccess(null);
      if (onShowToast) {
        onShowToast('success', 'Profile photo removed. Restored standard SaveBite green silhouette avatar.', 'Photo Removed');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to remove photo.');
      if (onShowToast) {
        onShowToast('error', err.message || 'Failed to remove photo.', 'Error');
      }
    } finally {
      setRemoving(false);
    }
  };

  const activeDisplayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-change-photo-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
            </div>
            <div>
              <h2 id="modal-change-photo-title" className="text-base font-bold text-slate-900">
                Partner Profile Photo
              </h2>
              <p className="text-xs text-slate-500">
                Upload custom picture or reset to default silhouette
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
              <div className="flex-1 font-medium">{error}</div>
            </div>
          )}

          {/* Avatar Preview Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-lg bg-emerald-50 flex items-center justify-center ring-2 ring-emerald-500/20">
                {activeDisplayUrl ? (
                  <img
                    src={activeDisplayUrl}
                    alt="Partner Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-700">
                    <span className="material-symbols-outlined text-[54px]">person</span>
                  </div>
                )}
              </div>

              {previewUrl && (
                <span className="absolute -top-1 -right-1 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold shadow">
                  Preview
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-3 text-center">
              {previewUrl
                ? `Selected: ${selectedFile?.name}`
                : currentAvatarUrl
                ? 'Active custom profile photo'
                : 'Using standard SaveBite green silhouette avatar'}
            </p>
          </div>

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />

          {/* Upload & Select Trigger */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              {selectedFile ? 'Choose Different Photo' : 'Select Photo from Computer'}
            </button>
            <div className="text-[11px] text-slate-400 text-center">
              Supports JPG, JPEG, PNG, WebP (Max 5 MB)
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
            <div>
              {currentAvatarUrl && !selectedFile && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={removing || loading}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {removing ? (
                    <>
                      <span className="w-3 h-3 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Remove Photo
                    </>
                  )}
                </button>
              )}
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setError(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Cancel Preview
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || removing}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Close
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={loading || removing}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                      Save Photo
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerPhotoModal;
