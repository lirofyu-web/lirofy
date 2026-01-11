// components/SignaturePad.tsx
import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface SignaturePadRef {
  clear: () => void;
  getSignature: () => string | null;
}

const SignaturePad = forwardRef<SignaturePadRef>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getCanvas = () => {
    if (!canvasRef.current) throw new Error('Canvas not found');
    return canvasRef.current;
  };
  
  const getContext = () => {
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');
    return ctx;
  };

  const getEventPos = (e: MouseEvent | TouchEvent) => {
    const canvas = getCanvas();
    const rect = canvas.getBoundingClientRect();
    if (e instanceof MouseEvent) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    if (e.touches && e.touches[0]) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return null;
  };
  
  const startDrawing = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    if (!pos) return;
    isDrawing.current = true;
    lastPos.current = pos;
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const pos = getEventPos(e);
    if (!pos || !lastPos.current) return;

    const ctx = getContext();
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    lastPos.current = null;
  };

  useEffect(() => {
    const canvas = getCanvas();
    const ctx = getContext();

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseleave', stopDrawing);

      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = getCanvas();
      const ctx = getContext();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    getSignature: () => {
      const canvas = getCanvas();
      const blank = document.createElement('canvas');
      blank.width = canvas.width;
      blank.height = canvas.height;
      if (canvas.toDataURL() === blank.toDataURL()) {
        return null;
      }
      return canvas.toDataURL('image/png');
    },
  }));

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full bg-slate-200 rounded-md border border-slate-400 touch-none" 
    />
  );
});

export default SignaturePad;