# lagoski-catalog

Catálogo de camisetas: produtos, variantes (tamanho e cor) e preço de lista.

Parte do **Lagoski**, uma loja de camisetas que demonstra bounded contexts (DDD) em
microsserviços integrados só por eventos, rodando na AWS (SNS + SQS) e no GCP (Pub/Sub)
com o mesmo código. Bounded context: **Catalog** (Supporting).

| Repositório | Papel |
| --- | --- |
| [lagoski-platform](https://github.com/wesleyplago/lagoski-platform) | base compartilhada (rede, cluster, banco, tópicos), spec, ADRs e compose do sistema inteiro |
| [lagoski-contracts](https://github.com/wesleyplago/lagoski-contracts) | Published Language: JSON Schemas e AsyncAPI dos eventos |
| [portfolio](https://github.com/wesleyplago/portfolio) | SPA em microfrontends que mostra o fluxo funcionando |

## Linguagem ubíqua

| Termo | Significado neste contexto |
| --- | --- |
| Produto | a camiseta como é vendida: nome, descrição, estampa |
| Variante | combinação de tamanho e cor, identificada por um SKU |
| Preço de lista | preço atual da variante; o pedido congela o seu próprio |
| Publicar / descontinuar | tornar o produto vendável ou retirá-lo |

## Eventos

Publica (via outbox):

| Evento | Tópico |
| --- | --- |
| `lagoski.catalog.product.published.v1` | `catalog.events` |
| `lagoski.catalog.variant.price-changed.v1` | `catalog.events` |
| `lagoski.catalog.product.discontinued.v1` | `catalog.events` |

Não consome eventos.

A topologia está em [`messaging.json`](messaging.json), lido pelo código e pelo Terraform.

## API

| Método | Rota | O quê |
| --- | --- | --- |
| GET | `/products` | produtos publicados |
| GET | `/products/:slug` | detalhe com variantes |
| POST | `/admin/products` | cria e publica um produto |
| PATCH | `/admin/variants/:sku/price` | muda o preço de uma variante |
| POST | `/admin/products/:id/discontinue` | descontinua |

Também: `GET /healthz`, `GET /readyz` (banco).

## Estrutura

```text
src/
├── chassis/          HTTP, config, banco, migrações, outbox relay, inbox, CloudEvents e barramento
│   └── messaging/    portas + adapters aws (SNS/SQS, pull), gcp (Pub/Sub, push) e memory
├── domain/           agregados e regras, sem I/O
├── application/      casos de uso e handlers de eventos
├── infrastructure/   repositórios SQL e migrações
├── contracts/        eventos que publica e o que lê dos que consome (tolerant reader)
├── module.ts         o que o chassis precisa saber deste serviço
└── main.ts
infrastructure/       Terraform (ver infrastructure/README.md)
```

Garantias do chassis: o agregado e o evento entram no banco na mesma transação (outbox);
um relay publica e marca; cada evento consumido é registrado no inbox na mesma transação do
efeito, então uma entrega duplicada não tem efeito. Entrega é at-least-once nas duas nuvens.

## Rodando

```bash
pnpm install
docker compose up -d postgres localstack
cp .env.example .env
pnpm dev
```

Ou tudo em container: `docker compose up --build`. Para subir o sistema inteiro (todos os
serviços, um LocalStack e um Postgres), use o compose do `lagoski-platform`.

```bash
pnpm typecheck && pnpm test
```

`pnpm test:contracts` valida os eventos contra os JSON Schemas do `lagoski-contracts`
(`CONTRACTS_DIR` aponta para um checkout dele; o CI faz isso na tag fixada em `CONTRACTS_REF`).

## Deploy

Workflow **deploy** (manual): escolhe `aws` ou `gcp`, autentica por OIDC, builda a imagem com o
SHA do commit e aplica `infrastructure/environments/<nuvem>/dev`. Detalhes em
[infrastructure/README.md](infrastructure/README.md).
