import { DomainError } from '../chassis/errors.js';

export const SIZES = ['P', 'M', 'G', 'GG'] as const;
export type Size = (typeof SIZES)[number];

export type Color = { name: string; hex: string };

export type Variant = {
  sku: string;
  size: Size;
  color: string;
  colorHex: string;
  priceCents: number;
};

export type ProductStatus = 'PUBLISHED' | 'DISCONTINUED';

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  artwork: string;
  status: ProductStatus;
  variants: Variant[];
};

export type NewProduct = {
  slug: string;
  name: string;
  description: string;
  artwork: string;
  priceCents: number;
  colors: Color[];
  sizes?: Size[];
};

const MAX_PRICE_CENTS = 100_000;

const slugToSku = (slug: string) => slug.replace(/[^a-z0-9]+/gi, '').toUpperCase().slice(0, 10);
const colorToSku = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '')
    .toUpperCase();

export function assertPrice(priceCents: number): void {
  if (!Number.isInteger(priceCents) || priceCents <= 0 || priceCents > MAX_PRICE_CENTS) {
    throw new DomainError('INVALID_PRICE', 'preço deve ser inteiro em centavos, entre 1 e 100000');
  }
}

/** Cria o produto já publicado, com uma variante por cor × tamanho. */
export function createProduct(input: NewProduct): Product {
  assertPrice(input.priceCents);
  if (!/^[a-z0-9-]{3,60}$/.test(input.slug)) throw new DomainError('INVALID_SLUG', 'slug: minúsculas, números e hífen');
  if (input.colors.length === 0) throw new DomainError('NO_VARIANTS', 'informe ao menos uma cor');
  const sizes = input.sizes ?? [...SIZES];
  const variants = input.colors.flatMap((color) =>
    sizes.map((size) => ({
      sku: `TEE-${slugToSku(input.slug)}-${colorToSku(color.name)}-${size}`,
      size,
      color: color.name,
      colorHex: color.hex,
      priceCents: input.priceCents,
    })),
  );
  return {
    id: `prd_${input.slug.replace(/-/g, '_')}`,
    slug: input.slug,
    name: input.name,
    description: input.description,
    artwork: input.artwork,
    status: 'PUBLISHED',
    variants,
  };
}

export function changePrice(product: Product, sku: string, priceCents: number): { product: Product; oldPriceCents: number } {
  assertPrice(priceCents);
  if (product.status !== 'PUBLISHED') throw new DomainError('PRODUCT_DISCONTINUED', 'produto descontinuado');
  const variant = product.variants.find((v) => v.sku === sku);
  if (!variant) throw new DomainError('UNKNOWN_SKU', `SKU ${sku} não pertence ao produto`, 404);
  return {
    oldPriceCents: variant.priceCents,
    product: { ...product, variants: product.variants.map((v) => (v.sku === sku ? { ...v, priceCents } : v)) },
  };
}

export function discontinue(product: Product): Product {
  if (product.status === 'DISCONTINUED') throw new DomainError('ALREADY_DISCONTINUED', 'produto já descontinuado', 409);
  return { ...product, status: 'DISCONTINUED' };
}
