import type { CloudEvent } from '../chassis/cloudevent.js';
import { productDiscontinued, productPublished, variantPriceChanged } from './events.js';

/** Um exemplo real de cada evento publicado, validado contra os schemas no CI. */
export function contractSamples(): CloudEvent[] {
  return [
    productPublished({
      productId: 'prd_ondas',
      slug: 'ondas-do-lago',
      name: 'Ondas do Lago',
      currency: 'BRL',
      variants: [{ sku: 'TEE-ONDAS-PRETO-M', size: 'M', color: 'Preto', priceCents: 8990 }],
    }),
    variantPriceChanged({ productId: 'prd_ondas', sku: 'TEE-ONDAS-PRETO-M', oldPriceCents: 8990, newPriceCents: 7990 }),
    productDiscontinued({ productId: 'prd_ondas', skus: ['TEE-ONDAS-PRETO-M'] }),
  ];
}
