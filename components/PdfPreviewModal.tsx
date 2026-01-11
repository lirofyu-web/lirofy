// components/PdfPreviewModal.tsx
import React from 'react';
import { XIcon } from './icons/XIcon';
import { ShareIcon } from './icons/ShareIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface PdfPreviewModalProps {
  pdfDataUri: string;
  fileName: string;
  onClose: () => void;
  showNotification: (message: string, type?: 'success' | 'error') => void;
}

const dataUriToBlob = (dataURI: string): Blob => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ pdfDataUri, fileName, onClose, showNotification }) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfDataUri;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    try {
      const blob = dataUriToBlob(pdfDataUri);
      const file = new File([blob], fileName, { type: 'application/pdf' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Recibo',
          text: `Recibo: ${fileName}`,
        });
      } else {
        showNotification('Compartilhamento de arquivos não suportado.', 'error');
        handleDownload(); // Fallback to download
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        console.error('Share API error:', error);
        showNotification('Falha ao compartilhar o PDF.', 'error');
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-[70] flex flex-col p-4 animate-fade-in no-print"
      role="dialog"
      aria-modal="true"
    >
      <header className="w-full flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-bold text-white truncate pr-4">{fileName}</h2>
        <button onClick={onClose} className="p-2 text-slate-300 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-700/50">
          <XIcon className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-grow w-full h-full bg-slate-800 rounded-lg overflow-hidden">
        <embed src={pdfDataUri} type="application/pdf" className="w-full h-full" />
      </main>

      <footer className="w-full flex justify-end gap-4 mt-4 flex-shrink-0">
        <button onClick={handleDownload} className="inline-flex items-center gap-2 bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500">
          <DownloadIcon className="w-5 h-5" />
          <span>Baixar</span>
        </button>
        <button onClick={handleShare} className="inline-flex items-center gap-2 bg-cyan-600 text-white font-bold py-2 px-6 rounded-md hover:bg-cyan-500">
          <ShareIcon className="w-5 h-5" />
          <span>Compartilhar</span>
        </button>
      </footer>
       <style>{`
        @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default PdfPreviewModal;
