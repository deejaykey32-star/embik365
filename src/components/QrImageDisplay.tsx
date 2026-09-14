import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { generateQrSvgDataUrl } from '../utils/qrCodeService';

interface QrImageDisplayProps {
  text: string;
  title?: string;
  size?: number;
  className?: string;
}

export const QrImageDisplay: React.FC<QrImageDisplayProps> = ({
  text,
  title = 'Kod QR',
  size = 220,
  className = 'w-full h-full object-contain pointer-events-auto'
}) => {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const target = (text || 'https://widokinaraj.pl').trim();

    QRCode.toDataURL(target, {
      width: size,
      margin: 1,
      color: { dark: '#111827', light: '#ffffff' },
      errorCorrectionLevel: 'M'
    })
      .then(url => {
        if (isMounted) setSrc(url);
      })
      .catch(() => {
        generateQrSvgDataUrl(target, size).then(svgUrl => {
          if (isMounted) setSrc(svgUrl);
        });
      });

    return () => {
      isMounted = false;
    };
  }, [text, size]);

  if (!src) {
    return (
      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse flex items-center justify-center text-[10px] text-stone-400 p-2">
        Ładowanie QR...
      </div>
    );
  }

  return <img src={src} alt={title} className={className} />;
};
