import React, { useRef, useEffect, useState } from 'react';

interface SignaturePadProps {
  onSignatureEnd: (signature: string) => void;
  label: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSignatureEnd, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  const getCanvasContext = () => {
    const canvas = canvasRef.current;
    return canvas ? canvas.getContext('2d') : null;
  };

  useEffect(() => {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in event) {
        return { x: event.touches[0].clientX - rect.left, y: event.touches[0].clientY - rect.top };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoords(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCoords(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      onSignatureEnd(canvas.toDataURL());
    }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSignatureEnd('');
      setHasSigned(false);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <canvas
        ref={canvasRef}
        width={300}
        height={100}
        className="bg-slate-700 border border-slate-600 rounded-md w-full cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
       {hasSigned && (
        <button
            type="button"
            onClick={clearCanvas}
            className="text-sm text-cyan-400 hover:text-cyan-300 mt-2 transition-colors"
        >
            Limpar
        </button>
      )}
    </div>
  );
};

export default SignaturePad;
