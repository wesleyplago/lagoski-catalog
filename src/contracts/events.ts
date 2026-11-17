import { newEvent, type CloudEvent } from '../chassis/cloudevent.js';

/** Published Language do Catalog (ver lagoski-contracts/schemas/catalog). */
export const TOPIC = 'catalog.events';
const SOURCE = 'lagoski/catalog';

export const EventTypes = {
  productPublished: 'lagoski.catalog.product.published.v1',
  variantPriceChanged: 'lagoski.catalog.variant.price-changed.v1',
  productDiscontinued: 'lagoski.catalog.product.discontinued.v1',
} as const;

export type ProductPublishedV1 = {
  productId: string;
  slug: string;
  name: string;
  currency: 'BRL';
  variants: Array<{ sku: string; size: string; color: string; priceCents: number }>;
};

export type VariantPriceChangedV1 = {
  productId: string;
  sku: string;
  oldPriceCents: number;
  newPriceCents: number;
};

export type ProductDiscontinuedV1 = {
  productId: string;
  skus: string[];
};

// Eventos do catálogo não pertencem a um pedido: a correlação é o próprio produto.
export const productPublished = (data: ProductPublishedV1): CloudEvent<ProductPublishedV1> =>
  newEvent({ source: SOURCE, type: EventTypes.productPublished, subject: `product/${data.productId}`, correlationId: data.productId, data });

export const variantPriceChanged = (data: VariantPriceChangedV1): CloudEvent<VariantPriceChangedV1> =>
  newEvent({ source: SOURCE, type: EventTypes.variantPriceChanged, subject: `variant/${data.sku}`, correlationId: data.productId, data });

export const productDiscontinued = (data: ProductDiscontinuedV1): CloudEvent<ProductDiscontinuedV1> =>
  newEvent({ source: SOURCE, type: EventTypes.productDiscontinued, subject: `product/${data.productId}`, correlationId: data.productId, data });
