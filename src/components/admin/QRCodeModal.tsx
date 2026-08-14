import React, { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Copy, Check, X, Printer, Share2, Sparkles } from 'lucide-react';
import { copyToClipboard } from '../../utils/share';
import { useToast } from '../common/Toast';
import { sound } from '../../utils/audio';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  publicUrl: string;
  birthdayName: string;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  publicUrl,
  birthdayName,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    const ok = await copyToClipboard(publicUrl);
    if (ok) {
      sound.playPop();
      setCopied(true);
      showToast('Birthday link copied to clipboard! 📋', 'success');
      setTimeout(() => setCopied(false), 3000);
    } else {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleDownloadQrPng = () => {
    try {
      sound.playSparkle();
      const svgElement = qrContainerRef.current?.querySelector('svg');
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      // High-res QR code (1200 x 1200)
      const size = 1200;
      canvas.width = size;
      canvas.height = size;

      img.onload = () => {
        if (!ctx) return;
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 100, 100, size - 200, size - 200);

        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-code-${birthdayName.toLowerCase().replace(/\s+/g, '-')}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
        showToast('High-Res QR Code downloaded! 🖼️', 'success');
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error(err);
      showToast('Failed to download QR code', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-dark-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-xs font-semibold text-gold-300">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>High-Resolution QR Code</span>
          </div>
          <h3 className="text-xl font-bold text-white">Scan to Send a Wish 🎂</h3>
          <p className="text-xs text-slate-400">
            Print or display this QR code at parties, classrooms, or gatherings so guests can instantly send wishes to{' '}
            <span className="text-gold-300 font-semibold">{birthdayName}</span>!
          </p>
        </div>

        {/* QR Code Graphic Box */}
        <div
          ref={qrContainerRef}
          className="mx-auto w-64 h-64 p-5 bg-white rounded-3xl shadow-xl border-4 border-gold-400/30 flex items-center justify-center relative group"
        >
          <QRCodeSVG
            value={publicUrl}
            size={216}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><circle cx=%2250%22 cy=%2250%22 r=%2248%22 fill=%22%23ff2e93%22/><text x=%2250%%22 y=%2255%%22 font-size=%2250%22 text-anchor=%22middle%22 dominant-baseline=%22central%22>🎂</text></svg>',
              x: undefined,
              y: undefined,
              height: 48,
              width: 48,
              excavate: true,
            }}
          />
        </div>

        {/* Link Input & Copy */}
        <div className="flex items-center gap-2 p-1.5 pl-3 rounded-2xl bg-dark-950 border border-white/10 text-xs">
          <input
            type="text"
            readOnly
            value={publicUrl}
            className="flex-1 bg-transparent text-slate-300 focus:outline-none truncate"
          />
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownloadQrPng}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs bg-gradient-to-r from-gold-500 to-amber-600 text-dark-950 shadow-md shadow-gold-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-xs bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-celebration-cyan" />
            <span>Print Flyer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
