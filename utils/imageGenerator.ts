// utils/imageGenerator.ts
import React from 'react';
import ReactDOM from 'react-dom/client';

// A biblioteca html2canvas é carregada através de uma tag de script no index.html, então a declaramos aqui.
declare const html2canvas: any;

/**
 * Renderiza um componente React fora da tela e o retorna como um Blob de imagem.
 * @param component O componente React a ser renderizado.
 * @returns Uma Promise que resolve com o Blob da imagem.
 */
export const renderComponentToBlob = (component: React.ReactElement): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    // Cria um contêiner temporário fora da tela
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    
    // Renderiza o componente
    root.render(component);

    // Atraso para garantir que tudo (incluindo QR codes) seja renderizado antes de capturar
    setTimeout(async () => {
      try {
        const elementToCapture = container.firstChild as HTMLElement;
        if (!elementToCapture) {
          throw new Error('O componente não foi renderizado corretamente.');
        }

        const canvas = await html2canvas(elementToCapture, {
            backgroundColor: null, // Mantém o fundo transparente
            scale: 3,              // Aumenta a resolução para melhor qualidade
        });

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('A conversão de canvas para Blob falhou.'));
          }
        }, 'image/png');

      } catch (error) {
        reject(error);
      } finally {
        // Limpeza: desmonta o componente e remove o contêiner
        root.unmount();
        document.body.removeChild(container);
      }
    }, 200);
  });
};


/**
 * Renderiza um componente React, o captura como um PNG e aciona o download.
 * @param component O componente React a ser renderizado.
 * @param filename O nome do arquivo desejado para o PNG baixado.
 */
export const downloadComponentAsPng = async (component: React.ReactElement, filename: string): Promise<void> => {
  try {
    const blob = await renderComponentToBlob(component);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = url;
    document.body.appendChild(link); // Necessário para o Firefox
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erro ao baixar componente como PNG:', error);
    throw error;
  }
};