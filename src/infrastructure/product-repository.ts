import type { Tx } from '../chassis/db.js';
import type { Product, Size } from '../domain/product.js';

type ProductRow = { id: string; slug: string; name: string; description: string; artwork: string; status: Product['status'] };
type VariantRow = { sku: string; product_id: string; size: Size; color: string; color_hex: string; price_cents: number };

function assemble(products: ProductRow[], variants: VariantRow[]): Product[] {
  return products.map((p) => ({
    ...p,
    variants: variants
      .filter((v) => v.product_id === p.id)
      .map((v) => ({ sku: v.sku, size: v.size, color: v.color, colorHex: v.color_hex, priceCents: v.price_cents })),
  }));
}

const SIZE_ORDER = `array_position(array['P','M','G','GG'], v.size)`;

export async function listPublished(db: Tx): Promise<Product[]> {
  const products = await db.query<ProductRow>(`select id, slug, name, description, artwork, status from products where status = 'PUBLISHED' order by created_at, slug`);
  const variants = await db.query<VariantRow>(
    `select v.* from variants v join products p on p.id = v.product_id where p.status = 'PUBLISHED' order by v.color, ${SIZE_ORDER}`,
  );
  return assemble(products.rows, variants.rows);
}

export async function findBy(db: Tx, field: 'id' | 'slug', value: string): Promise<Product | null> {
  const products = await db.query<ProductRow>(`select id, slug, name, description, artwork, status from products where ${field} = $1`, [value]);
  const row = products.rows[0];
  if (!row) return null;
  const variants = await db.query<VariantRow>(`select v.* from variants v where v.product_id = $1 order by v.color, ${SIZE_ORDER}`, [row.id]);
  return assemble([row], variants.rows)[0] ?? null;
}

export async function findBySku(db: Tx, sku: string): Promise<Product | null> {
  const { rows } = await db.query<{ product_id: string }>('select product_id from variants where sku = $1', [sku]);
  return rows[0] ? findBy(db, 'id', rows[0].product_id) : null;
}

export async function insert(tx: Tx, product: Product): Promise<void> {
  await tx.query('insert into products (id, slug, name, description, artwork, status) values ($1, $2, $3, $4, $5, $6)', [
    product.id,
    product.slug,
    product.name,
    product.description,
    product.artwork,
    product.status,
  ]);
  for (const v of product.variants) {
    await tx.query('insert into variants (sku, product_id, size, color, color_hex, price_cents) values ($1, $2, $3, $4, $5, $6)', [
      v.sku,
      product.id,
      v.size,
      v.color,
      v.colorHex,
      v.priceCents,
    ]);
  }
}

export async function update(tx: Tx, product: Product): Promise<void> {
  await tx.query('update products set status = $2 where id = $1', [product.id, product.status]);
  for (const v of product.variants) await tx.query('update variants set price_cents = $2 where sku = $1', [v.sku, v.priceCents]);
}

export async function count(db: Tx): Promise<number> {
  const { rows } = await db.query<{ n: string }>('select count(*) as n from products');
  return Number(rows[0]?.n ?? 0);
}
