import { describe, expect, it } from 'vitest';
import { changePrice, createProduct, discontinue } from '../src/domain/product.js';
import { SEED } from '../src/domain/seed.js';

describe('Product', () => {
  const ondas = createProduct(SEED[0]!);

  it('gera uma variante por cor e tamanho, com SKU legível', () => {
    expect(ondas.variants).toHaveLength(3 * 4);
    expect(ondas.variants[0]?.sku).toBe('TEE-ONDASDOLAG-PRETO-P');
    expect(new Set(ondas.variants.map((v) => v.sku)).size).toBe(ondas.variants.length);
  });

  it('remove acentos do SKU', () => {
    const p = createProduct({ ...SEED[0]!, slug: 'teste', colors: [{ name: 'Céu', hex: '#aabbcc' }], sizes: ['M'] });
    expect(p.variants[0]?.sku).toBe('TEE-TESTE-CEU-M');
  });

  it('muda preço só da variante pedida e devolve o anterior', () => {
    const sku = ondas.variants[1]!.sku;
    const { product, oldPriceCents } = changePrice(ondas, sku, 7990);
    expect(oldPriceCents).toBe(8990);
    expect(product.variants.find((v) => v.sku === sku)?.priceCents).toBe(7990);
    expect(product.variants[0]?.priceCents).toBe(8990);
  });

  it('rejeita preço inválido e produto descontinuado', () => {
    expect(() => changePrice(ondas, ondas.variants[0]!.sku, 0)).toThrow('preço');
    expect(() => changePrice(discontinue(ondas), ondas.variants[0]!.sku, 100)).toThrow('descontinuado');
    expect(() => discontinue(discontinue(ondas))).toThrow('já descontinuado');
  });
});
