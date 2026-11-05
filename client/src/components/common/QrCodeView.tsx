import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface QrCodeViewProps {
  value: string;
  size?: number;
  showValue?: boolean;
  className?: string;
}

/**
 * High-precision ISO-18004 compliant QR Code Component.
 * Generates valid standard QR code bitmap with Reed-Solomon error correction
 * recognizable by native camera barcode detectors and jsQR engines.
 */
export const QrCodeView: React.FC<QrCodeViewProps> = ({
  value,
  size = 180,
  showValue = true,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    let isCancelled = false;

    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 256),
      margin: 1,
      color: {
        dark: '#111827',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (!isCancelled) {
          setDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('[QrCodeView] Error generating QR code data URL:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [value, size]);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div
        className="p-3 bg-white rounded-2xl shadow-xs border border-outline-variant/30 flex items-center justify-center overflow-hidden"
        style={{ width: size + 24, height: size + 24 }}
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR Code: ${value}`}
            width={size}
            height={size}
            className="block rounded-lg object-contain"
          />
        ) : (
          <div
            className="animate-pulse bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface-variant text-xs"
            style={{ width: size, height: size }}
          >
            Generating QR...
          </div>
        )}
      </div>
      {showValue && (
        <span className="font-mono text-xs text-on-surface-variant font-medium select-all">
          {value}
        </span>
      )}
    </div>
  );
};

export default QrCodeView;
