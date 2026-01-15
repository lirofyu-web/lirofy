// utils/sunmiPrinter.ts

// Declara a interface global para a API da impressora Sunmi,
// já que ela é injetada no WebView e não possui tipos TypeScript nativos.
declare global {
  interface Window {
    sunmiInnerPrinter: any;
  }
}

class SunmiPrinterService {
  private isAvailable: boolean;

  constructor() {
    // Verifica se o objeto da API da impressora Sunmi está presente na janela global.
    this.isAvailable = typeof window.sunmiInnerPrinter !== 'undefined';
    if (this.isAvailable) {
      console.log("Sunmi Inner Printer API detectada.");
    }
  }

  public isPrinterAvailable(): boolean {
    return this.isAvailable;
  }

  /**
   * Analisa um texto formatado com dicas simples (como asteriscos para negrito)
   * e o imprime linha por linha usando os comandos da API Sunmi.
   * @param text O texto completo do recibo.
   */
  private async printFormattedText(text: string) {
    const lines = text.split('\n');

    for (const line of lines) {
      let align = 0; // 0 para esquerda (padrão)
      let isBold = false;
      let printText = line.trim();

      // Heurística para centralizar os títulos principais
      if (printText.includes('MONTANHA BILHAR') || printText === 'ACERTO DE CONTAS' || printText === 'DEMONSTRATIVO DE COBRANÇA' || printText === 'COMPROVANTE DE PAGAMENTO DE DIVIDA') {
        align = 1; // 1 para centro
        isBold = true;
      }

      // Heurística para negrito em linhas marcadas com asteriscos
      if (printText.startsWith('*') && printText.endsWith('*')) {
        isBold = true;
        printText = printText.substring(1, printText.length - 1);
      }
      
      // Define o alinhamento antes de imprimir
      await window.sunmiInnerPrinter.setAlignment(align);

      // Define o negrito, se necessário
      if (isBold) {
        await window.sunmiInnerPrinter.setFontWeight(1); // 1 para negrito
      }
      
      // Imprime o texto da linha
      await window.sunmiInnerPrinter.printText(printText + '\n');
      
      // Reseta o negrito para a próxima linha
      if (isBold) {
        await window.sunmiInnerPrinter.setFontWeight(0); // 0 para normal
      }
    }
  }

  /**
   * Orquestra o processo completo de impressão de um recibo.
   * @param text O texto completo do recibo a ser impresso.
   */
  public async printReceipt(text: string): Promise<void> {
    if (!this.isAvailable) {
      throw new Error("A impressora Sunmi não está disponível.");
    }

    try {
      await window.sunmiInnerPrinter.initPrinter();
      await this.printFormattedText(text);
      await window.sunmiInnerPrinter.lineWrap(4); // Avança 4 linhas
      await window.sunmiInnerPrinter.cutPaper();
    } catch (e) {
      console.error("Falha ao imprimir com a API Sunmi:", e);
      throw new Error("Falha na impressão. A impressora está pronta?");
    }
  }

  /**
   * Imprime uma página de teste para verificar a funcionalidade da impressora.
   */
  public async printTestPage(): Promise<void> {
    const testText = `
*Teste de Impressora Interna*

Se voce pode ler isto, a
impressora interna (Sunmi)
esta funcionando corretamente.

MONTANHA BILHAR & JUKEBOX
    `.trim();
    await this.printReceipt(testText);
  }
}

// Exporta uma única instância do serviço para ser usada em todo o aplicativo.
export const sunmiPrinterService = new SunmiPrinterService();
