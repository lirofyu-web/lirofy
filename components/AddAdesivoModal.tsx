// components/AddAdesivoModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from './icons/ImageIcon';

interface AddAdesivoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (numero: string, file: File) => void;
  isSaving: boolean;
}

const AddAdesivoModal: React.FC<AddAdesivoModalProps> = ({ isOpen, onClose, onConfirm, isSaving }) => {
  const [numero, setNumero] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal is closed
      setNumero('');
      setFile(null);
      setPreview(null);
      setError('');
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem.');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim()) {
      setError('O número do adesivo é obrigatório.');
      return;
    }
    if (!file) {
      setError('A imagem do adesivo é obrigatória.');
      return;
    }
    onConfirm(numero, file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in-up">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Adicionar Novo Adesivo</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="adesivo-numero" className="block text-sm font-medium text-slate-300 mb-1">Número do Adesivo</label>
            <input
              type="text"
              id="adesivo-numero"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
              className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-lime-500"
              placeholder="Ex: 101, A-05"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Imagem do Adesivo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md cursor-pointer hover:border-lime-500"
            >
              <div className="space-y-1 text-center">
                {preview ? (
                  <img src={preview} alt="Pré-visualização do adesivo" className="mx-auto h-24 w-24 object-contain rounded-md" />
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-slate-500" />
                )}
                <div className="flex text-sm text-slate-400">
                  <p className="pl-1">
                    {file ? 'Clique para trocar a imagem' : 'Clique para selecionar uma imagem'}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{file ? file.name : 'PNG, JPG, GIF até 10MB'}</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="bg-slate-600 text-white font-bold py-2 px-6 rounded-md hover:bg-slate-500 disabled:bg-slate-500/50">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !numero || !file} className="bg-lime-600 text-white font-bold py-2 px-6 rounded-md hover:bg-lime-500 disabled:bg-slate-500/50 disabled:cursor-not-allowed">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
       <style>{`
        @keyframes fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default AddAdesivoModal;
