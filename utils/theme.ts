// utils/theme.ts
export type AppThemeColors = {
  primary: string;
  accent: string;
};

export const defaultColors: AppThemeColors = {
  primary: '#84cc16', // lime-500
  accent: '#06b6d4',  // cyan-600
};

// Function to generate shades for hover effects. A simple darken effect.
const darkenColor = (hex: string, amount: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  // Convert 3-digit hex to 6-digit
  if (color.length === 3) {
    color = color.split('').map(c => c + c).join('');
  }
  const num = parseInt(color, 16);
  
  let r = (num >> 16) - amount;
  if (r < 0) r = 0;
  if (r > 255) r = 255;

  let g = ((num >> 8) & 0x00FF) - amount;
  if (g < 0) g = 0;
  if (g > 255) g = 255;
  
  let b = (num & 0x0000FF) - amount;
  if (b < 0) b = 0;
  if (b > 255) b = 255;
  
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

// Simple function to determine if a color is light or dark to set contrasting text
const isColorLight = (hex: string): boolean => {
    let color = hex.startsWith('#') ? hex.slice(1) : hex;
    if (color.length === 3) {
      color = color.split('').map(c => c + c).join('');
    }
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    // Formula for perceived brightness (YIQ)
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return yiq >= 128;
};


export const applyThemeColors = (colors: AppThemeColors): void => {
  const root = document.documentElement;
  if (!root) return;

  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', darkenColor(colors.primary, 20));
  root.style.setProperty('--color-primary-text', isColorLight(colors.primary) ? '#0f172a' : '#ffffff');

  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-hover', darkenColor(colors.accent, 20));
  root.style.setProperty('--color-accent-text', isColorLight(colors.accent) ? '#0f172a' : '#ffffff');
};
