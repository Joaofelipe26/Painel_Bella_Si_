/**
 * Gera os ícones da tela de início a partir do logo da Bella Si.
 * Uso: coloque o logo em public/logo-original.png (ou .jpg) e rode
 *   npm run icones
 * Saída: public/icone-192.png, public/icone-512.png, public/icone-maskable-512.png
 *        e src/app/apple-icon.png (iPhone) e src/app/icon.png (aba do navegador).
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const raiz = process.cwd();
const origem = ['png', 'jpg', 'jpeg', 'webp']
  .map((ext) => path.join(raiz, 'public', `logo-original.${ext}`))
  .find((p) => existsSync(p));

if (!origem) {
  console.error('Logo não encontrado. Salve o arquivo como public/logo-original.png (ou .jpg).');
  process.exit(1);
}

const CREME = '#F7F3E8';

/** Logo centralizado em um quadrado creme. `margem` é a fração livre em cada lado. */
async function gerar(destino, tamanho, margem) {
  const interno = Math.round(tamanho * (1 - 2 * margem));
  const logo = await sharp(origem).resize(interno, interno, { fit: 'contain', background: CREME }).toBuffer();
  await sharp({ create: { width: tamanho, height: tamanho, channels: 4, background: CREME } })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(raiz, destino));
  console.log(`ok ${destino}`);
}

await gerar('public/icone-192.png', 192, 0.04);
await gerar('public/icone-512.png', 512, 0.04);
// "maskable": o Android corta as bordas; o logo fica dentro da área segura (80% do centro).
await gerar('public/icone-maskable-512.png', 512, 0.12);
await gerar('src/app/apple-icon.png', 180, 0.06);
await gerar('src/app/icon.png', 64, 0.02);
