// utils/imageGenerator.ts
import React from 'react';
import ReactDOM from 'react-dom/client';

// A biblioteca html2canvas é carregada através de uma tag de script no index.html, então a declaramos aqui.
declare const html2canvas: any;

/**
 * Renderiza um componente React fora da tela, o captura como um PNG usando html2canvas,
 * e aciona um download.
 * @param component O componente React a ser renderizado.
 * @param filename O nome do arquivo desejado para o PNG baixado.
 */
export const downloadComponentAsPng = async (component: React.ReactElement, filename: string): Promise<void> => {
  // Cria um contêiner temporário
  const container = document.createElement('div');
  // Estiliza o contêiner para ser renderizado, mas não visível
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.zIndex = '-1'; // Coloca atrás de tudo
  container.style.opacity = '0'; // Torna invisível
  document.body.appendChild(container);

  // Usa ReactDOM.createRoot para React 18+
  const root = ReactDOM.createRoot(container);
  
  // Envolve em uma promessa para lidar com a renderização assíncrona e a limpeza
  return new Promise<void>((resolve, reject) => {
    // Renderiza o componente no contêiner fora da tela
    root.render(component);

    // Dá ao React um momento para renderizar, especialmente para imagens/QR codes gerados por bibliotecas.
    setTimeout(async () => {
      try {
        if (!container.firstChild) {
          throw new Error('O componente não foi renderizado no contêiner.');
        }
        
        // Usa o primeiro filho do contêiner para um ajuste mais preciso do canvas.
        const elementToCapture = container.firstChild as HTMLElement;

        const canvas = await html2canvas(elementToCapture, {
            backgroundColor: null, // Fundo transparente
            scale: 3, // Aumenta a escala para maior resolução, melhor para impressão
        });
    
        // Cria um link para acionar o download
        const link = document.createElement('a');
        link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        resolve();
      } catch (error) {
        console.error('Erro ao gerar PNG para download:', error);
        reject(error);
      } finally {
        // Limpeza: desmonta o componente e remove o contêiner do DOM
        root.unmount();
        document.body.removeChild(container);
      }
    }, 200); // Atraso de 200ms parece seguro para a geração de QR code
  });
};