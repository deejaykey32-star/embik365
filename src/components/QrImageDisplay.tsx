import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

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
  className = 'w-full h-full flex items-center justify-center pointer-events-auto'
}) => {
  const [svgHtml, setSvgHtml] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let target = (text || 'https://widokinaraj.pl').trim();

    // If target is huge base64 data URI or blob, fallback to default URL to prevent QR spec overflow
    if (target.startsWith('data:') || target.startsWith('blob:')) {
      target = 'https://widokinaraj.pl';
    }

    try {
      QRCode.toString(
        target,
        {
          type: 'svg',
          width: size,
          margin: 1,
          color: { dark: '#111827', light: '#ffffff' },
          errorCorrectionLevel: 'M'
        },
        (err, svg) => {
          if (!err && svg && isMounted) {
            setSvgHtml(svg);
          } else {
            // Promise fallback
            QRCode.toDataURL(target, { width: size, margin: 1 })
              .then(dataUrl => {
                if (isMounted) {
                  setSvgHtml(`<img src="${dataUrl}" alt="${title}" style="width:100%;height:100%;object-fit:contain;" />`);
                }
              })
              .catch(() => {});
          }
        }
      );
    } catch {
      QRCode.toDataURL(target, { width: size, margin: 1 })
        .then(dataUrl => {
          if (isMounted) {
            setSvgHtml(`<img src="${dataUrl}" alt="${title}" style="width:100%;height:100%;object-fit:contain;" />`);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [text, size, title]);

  if (!svgHtml) {
    return (
      <div className="w-full h-full bg-stone-100 dark:bg-stone-800 rounded-lg animate-pulse flex items-center justify-center text-[10px] text-stone-400 p-2">
        Ładowanie QR...
      </div>
    );
  }

  if (svgHtml.startsWith('<img')) {
    return <div className={className} dangerouslySetInnerHTML={{ __html: svgHtml }} />;
  }

  return (
    <div
      className={`${className} [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:rounded-lg`}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      title={title}
    />
  );
};
