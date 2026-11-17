import type { Migration } from '../chassis/db.js';

export const migrations: Migration[] = [
  {
    id: '001_products',
    sql: `
      create table products (
        id text primary key,
        slug text not null unique,
        name text not null,
        description text not null,
        artwork text not null,
        status text not null,
        created_at timestamptz not null default now()
      );
      create table variants (
        sku text primary key,
        product_id text not null references products(id),
        size text not null,
        color text not null,
        color_hex text not null,
        price_cents integer not null check (price_cents > 0)
      );
      create index variants_product on variants (product_id);
    `,
  },
];
