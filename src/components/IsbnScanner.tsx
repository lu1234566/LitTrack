import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { X, Camera, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface IsbnScannerProps {
  onScan: (isbn: string) => void;
  onClose: () => void;
}

export const IsbnScanner: React.FC<IsbnScannerProps> = ({ onScan, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      aspectRatio: 1.0,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true,
    };

    try {
      scannerRef.current = new Html5QrcodeScanner('reader', config, false);
      scannerRef.current.render(
        (decodedText) => {
          // Validate ISBN (basic check for 10 or 13 digits)
          const cleanIsbn = decodedText.replace(/[- ]/g, '');
          if (/^(?:\d{9}[\dXx]|\d{13})$/.test(cleanIsbn)) {
            if (scannerRef.current) {
              scannerRef.current.clear();
            }
            onScan(cleanIsbn);
          }
        },
        (errorMessage) => {
          // Ignore frequent scan errors, only show permission errors
          if (errorMessage.includes('NotAllowedError') || errorMessage.includes('Permission denied')) {
            setError('Não foi possível acessar a câmera. Você pode digitar o ISBN manualmente.');
          }
        }
      );
    } catch (err) {
      console.error('Error initializing scanner:', err);
      setError('Erro ao inicializar a câmera.');
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Camera className="text-amber-500" size={24} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-neutral-100">Escanear Código de Barras</h2>
          <p className="text-neutral-400 text-sm mt-1">Aponte a câmera para o código de barras (ISBN) do livro.</p>
        </div>

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
            <AlertCircle className="text-rose-500 mx-auto mb-2" size={32} />
            <p className="text-rose-400 text-sm">{error}</p>
            <button 
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-neutral-800 text-neutral-200 rounded-xl text-sm font-medium hover:bg-neutral-700 transition-colors"
            >
              Fechar e digitar manualmente
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-black">
            <div id="reader" className="w-full"></div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
