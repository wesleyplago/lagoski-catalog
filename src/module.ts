import { z } from 'zod';
import type { ServiceModule } from './chassis/bootstrap.js';
import { createCatalogService } from './application/catalog-service.js';
import { SIZES } from './domain/product.js';
import { migrations } from './infrastructure/migrations.js';
import { subscriptions } from './messaging-config.js';

const NewProductBody = z.object({
  slug: z.string(),
  name: z.string().min(2).max(80),
  description: z.string().max(280),
  artwork: z.string().default('logo'),
  priceCents: z.number().int(),
  colors: z.array(z.object({ name: z.string().min(2), hex: z.string().regex(/^#[0-9a-f]{6}$/i) })).min(1),
  sizes: z.array(z.enum(SIZES)).optional(),
});

export const catalogModule: ServiceModule = {
  name: 'catalog',
  defaultPort: 8081,
  migrations,
  subscriptions,
  register({ app, db, logger }) {
    const catalog = createCatalogService(db);

    app.get('/products', async () => ({ products: await catalog.list() }));
    app.get<{ Params: { slug: string } }>('/products/:slug', async (req) => catalog.get(req.params.slug));
    app.post('/admin/products', async (req, reply) => reply.code(201).send(await catalog.publish(NewProductBody.parse(req.body))));
    app.patch<{ Params: { sku: string } }>('/admin/variants/:sku/price', async (req) => {
      const { priceCents } = z.object({ priceCents: z.number().int() }).parse(req.body);
      return catalog.changePrice(req.params.sku, priceCents);
    });
    app.post<{ Params: { id: string } }>('/admin/products/:id/discontinue', async (req) => catalog.discontinue(req.params.id));

    return {
      onReady: async () => {
        const seeded = await catalog.seed();
        if (seeded > 0) logger.info({ seeded }, 'catálogo inicial publicado');
      },
    };
  },
};
