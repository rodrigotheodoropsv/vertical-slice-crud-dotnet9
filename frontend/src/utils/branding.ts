import type { BrandingConfig } from '../types';

export const BRANDING: BrandingConfig = {
  companyName: 'Lubefer Industria e Comércio LTDA',
  logoPath: '/branding/company-logo.png',
  logoAlt: 'Logo da empresa',
};

export function getAbsoluteAssetUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${window.location.origin}${path.startsWith('/') ? path : `/${path}`}`;
}
