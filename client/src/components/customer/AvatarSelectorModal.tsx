import React, { useState, useEffect } from 'react';
import { DEFAULT_CARTOON_AVATARS, AvatarOption } from '../../services/authApi';

export interface AvatarSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl?: string;
  onSelectAvatar: (avatarUrl: string) => Promise<void> | void;
}

export const AvatarSelectorModal: React.FC<AvatarSelectorModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSelectAvatar,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(
    currentAvatarUrl || DEFAULT_CARTOON_AVATARS[0].url
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUrl(currentAvatarUrl || DEFAULT_CARTOON_AVATARS[0].url);
      setIsSaving(false);
    }
  }, [isOpen, currentAvatarUrl]);

  if (!isOpen) return null;

  const currentOption = DEFAULT_CARTOON_AVATARS.find((a) => a.url === selectedUrl);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSelectAvatar(selectedUrl);
      onClose();
    } catch {
      // Error handled by caller toast
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006030] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">face</span>
            </div>
            <div>
              <h3 id="avatar-modal-title" className="font-bold text-lg text-slate-900">
                Choose Your Avatar
              </h3>
              <p className="text-xs text-slate-500">
                Pick a cute cartoon character for your SaveBite profile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Selected Avatar Preview Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-50/80 via-white to-orange-50/60 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-[#006030] shadow-md bg-white shrink-0 p-0.5">
              <img
                src={selectedUrl}
                alt="Selected avatar"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Selected Character
              </span>
              <span className="text-base font-extrabold text-slate-900">
                {currentOption?.label || 'Custom Avatar'}
              </span>
              <span className="text-xs text-slate-500">
                Visible across your customer dashboard & orders
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 bg-[#006030] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
            <span className="material-symbols-outlined text-[14px]">check</span>
            <span>Active</span>
          </span>
        </div>

        {/* Avatar Grid Selection */}
        <div className="p-6 overflow-y-auto flex-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">
            Cartoon Characters ({DEFAULT_CARTOON_AVATARS.length})
          </span>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {DEFAULT_CARTOON_AVATARS.map((avatar: AvatarOption) => {
              const isSelected = selectedUrl === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedUrl(avatar.url)}
                  className={`group relative flex flex-col items-center p-2.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#006030] bg-emerald-50/70 shadow-sm scale-[1.02]'
                      : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-200 hover:scale-[1.02]'
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`Select ${avatar.label} avatar`}
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border border-white shadow-xs bg-white mb-1.5 transition-transform">
                    <img
                      src={avatar.url}
                      alt={avatar.label}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#006030]/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-[20px] font-bold drop-shadow-md">
                          check_circle
                        </span>
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-[11px] text-center font-bold truncate max-w-full ${
                      isSelected ? 'text-[#006030]' : 'text-slate-700'
                    }`}
                  >
                    {avatar.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-[#006030] hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Avatar...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>Save Avatar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelectorModal;
