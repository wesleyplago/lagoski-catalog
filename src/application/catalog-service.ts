import type { Db } from '../chassis/db.js';
import { DomainError, NotFoundError } from '../chassis/errors.js';
import { enqueue } from '../chassis/outbox.js';
import { productDiscontinued, productPublished, TOPIC, variantPriceChanged } from '../contracts/events.js';
import { changePrice, createProduct, discontinue, type NewProduct, type Product } from '../domain/product.js';
import { SEED } from '../domain/seed.js';
import * as repo from '../infrastructure/product-repository.js';

const toPublished = (p: Product) =>
  productPublished({
    productId: p.id,
    slug: p.slug,
    name: p.name,
    currency: 'BRL',
    variants: p.variants.map(({ sku, size, color, priceCents }) => ({ sku, size, color, priceCents })),
  });

/** Casos de uso. Cada um grava o agregado e o evento na mesma transação. */
export function createCatalogService(db: Db) {
  return {
    list: () => repo.listPublished(db),

    async get(slug: string) {
      const product = await repo.findBy(db, 'slug', slug);
      if (!product || product.status !== 'PUBLISHED') throw new NotFoundError('produto');
      return product;
    },

    publish(input: NewProduct) {
      const product = createProduct(input);
      return db.tx(async (tx) => {
        if (await repo.findBy(tx, 'slug', product.slug)) throw new DomainError('SLUG_TAKEN', `slug ${product.slug} já existe`, 409);
        await repo.insert(tx, product);
        await enqueue(tx, TOPIC, toPublished(product));
        return product;
      });
    },

    changePrice(sku: string, priceCents: number) {
      return db.tx(async (tx) => {
        const product = await repo.findBySku(tx, sku);
        if (!product) throw new NotFoundError('SKU');
        const { product: updated, oldPriceCents } = changePrice(product, sku, priceCents);
        if (oldPriceCents === priceCents) return updated;
        await repo.update(tx, updated);
        await enqueue(tx, TOPIC, variantPriceChanged({ productId: product.id, sku, oldPriceCents, newPriceCents: priceCents }));
        return updated;
      });
    },

    discontinue(productId: string) {
      return db.tx(async (tx) => {
        const product = await repo.findBy(tx, 'id', productId);
        if (!product) throw new NotFoundError('produto');
        const updated = discontinue(product);
        await repo.update(tx, updated);
        await enqueue(tx, TOPIC, productDiscontinued({ productId, skus: product.variants.map((v) => v.sku) }));
        return updated;
      });
    },

    /** Coleção inicial na primeira subida; os outros contextos recebem por evento. */
    async seed() {
      if ((await repo.count(db)) > 0) return 0;
      for (const item of SEED) await this.publish(item);
      return SEED.length;
    },
  };
}
