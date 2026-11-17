import type { NewProduct } from './product.js';

const preto = { name: 'Preto', hex: '#1d1d1f' };
const branco = { name: 'Branco', hex: '#f3f2ee' };
const marinho = { name: 'Azul-marinho', hex: '#1f2a44' };
const mostarda = { name: 'Mostarda', hex: '#c99a2e' };
const musgo = { name: 'Verde-musgo', hex: '#4b5d3a' };
const mescla = { name: 'Cinza mescla', hex: '#9a9ca0' };

/** Coleção inicial. O mesmo catálogo existe no mock do portfólio. */
export const SEED: NewProduct[] = [
  { slug: 'ondas-do-lago', name: 'Ondas do Lago', description: 'Linhas de onda em serigrafia de uma cor.', artwork: 'waves', priceCents: 8990, colors: [preto, marinho, branco] },
  { slug: 'pinhao', name: 'Pinhão', description: 'Pinha e pinhões em traço fino, estampa frontal.', artwork: 'pine', priceCents: 7990, colors: [musgo, branco] },
  { slug: 'serra-geral', name: 'Serra Geral', description: 'Silhueta de serra em degradê de três tons.', artwork: 'ridge', priceCents: 8490, colors: [marinho, mescla] },
  { slug: 'farol', name: 'Farol', description: 'Farol e feixe de luz, estampa nas costas.', artwork: 'lighthouse', priceCents: 7490, colors: [mostarda, preto] },
  { slug: 'curvas-de-nivel', name: 'Curvas de Nível', description: 'Mapa topográfico em linha contínua.', artwork: 'contour', priceCents: 9490, colors: [branco, preto] },
  { slug: 'basica', name: 'Básica Lagoski', description: 'Algodão penteado, logo bordado no peito.', artwork: 'logo', priceCents: 5990, colors: [preto, branco, mescla, musgo] },
];
