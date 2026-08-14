import { toPng } from 'html-to-image';

export interface CardExportOptions {
  fileName?: string;
  pixelRatio?: number;
}

export async function exportCardAsImage(
  element: HTMLElement,
  options: CardExportOptions = {}
): Promise<string> {
  const { fileName = 'birthday-card.png', pixelRatio = 2.5 } = options;

  try {
    const dataUrl = await toPng(element, {
      quality: 0.98,
      pixelRatio,
      cacheBust: true,
      skipFonts: false,
      style: {
        transform: 'none',
        borderRadius: '24px',
      },
    });

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } catch (error) {
    console.error('Failed to export birthday card:', error);
    throw new Error('Failed to generate birthday card image');
  }
}
