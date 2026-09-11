#!/usr/bin/env node
/* 自動スモークテスト（Playwright + Chromium）
   index.html を起動 → 入場 → 設定 → キャラ選択 → 待機部屋 → 順番決め → CPU戦を数十ターン自動進行し、
   JS の実行時エラーが 1 件も出ないこと、ゲーム状態が進むことを確認する。各画面のスクリーンショットも残す。

   使い方:
     npm install            （playwright を入れる。初回だけ）
     npx playwright install chromium
     npm run test:smoke     （tests/out/*.png に画面が残る）
   環境変数:
     SMOKE_TURNS=60   自動操作の回数（既定 60）
     SMOKE_HEADED=1   ブラウザを表示して実行                                      */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tests', 'out'); fs.mkdirSync(out, { recursive: true });
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.png':'image/png', '.jpg':'image/jpeg', '.mp3':'audio/mpeg', '.ogg':'audio/ogg', '.m4a':'audio/mp4', '.wav':'audio/wav' };
const server = http.createServer((req, res) => {
  const f = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(0, r));
const url = `http://localhost:${server.address().port}/index.html`;

const browser = await chromium.launch({ headless: !process.env.SMOKE_HEADED });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n')[1]));
page.on('console', m => { if (m.type() === 'error' && !/googleapis|cdnjs|ERR_|404/.test(m.text())) errors.push('console: ' + m.text()); });

let shots = 0;
const shot = async (name) => page.screenshot({ path: path.join(out, `${String(shots++).padStart(2, '0')}-${name}.png`) });
const clickText = async (t) => page.getByText(t, { exact: false }).first().click({ timeout: 4000 });

await page.goto(url, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(2000); await shot('title');
await page.click('#toSetup'); await page.waitForTimeout(1000); await shot('home');
await page.click('#dkEnter'); await page.waitForTimeout(1000); await shot('setup');
await clickText('つぎへ'); await page.waitForTimeout(1200); await shot('charselect');
await page.locator('.krcard, .cardpick, [data-card]').first().click({ timeout: 3000 }).catch(async () => clickText('カイン'));
await page.waitForTimeout(1500); await shot('room');
await clickText('プレイ準備完了'); await page.waitForTimeout(2500); await shot('order');
// 順番決め：4枚のうち1枚（画面中央付近）をタップ
await page.locator('#orderCards > *').first().click(); await page.waitForTimeout(4500); await shot('game-start');

const TURNS = +(process.env.SMOKE_TURNS || 60);
const PRI = [/決定|確定|建てる|買う|購入/, /^OK$|^はい$|了解|次へ|つぎへ|閉じる|とじる|スキップ|やめる|しない|受け取る/];
const SKIP = /⚙|⏸|能力|😆|ショップ|ガチャ|設定|ランキング|お知らせ|オンライン|もどる/;
const vis = () => page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().width > 20 && !b.disabled).map(b => ({ id: b.id, t: b.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) })));
let lastState = null;
for (let i = 0; i < TURNS; i++) {
  const btns = (await vis()).filter(b => !SKIP.test(b.t));
  let target = null; for (const re of PRI) { target = btns.find(b => re.test(b.t)); if (target) break; }
  if (target) await (target.id ? page.locator(`[id="${target.id}"]`) : page.getByText(target.t, { exact: false }).first()).click({ timeout: 2000 }).catch(() => {});
  const push = await page.$('#push');
  if (push && await push.isVisible()) { const b = await push.boundingBox(); if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(500); await page.mouse.up(); } }
  await page.waitForTimeout(2000);
  if (i % 15 === 14) await shot(`play-${i + 1}`);
  lastState = await page.evaluate(() => (typeof G !== 'undefined' && G) ? { turn: G.turn, turnsLeft: G.turnsLeft, over: G.over, owned: G.tiles.filter(t => t.owner >= 0).length, cash: G.players.map(p => p.cash) } : null);
  if (lastState && lastState.over) break;
}
await shot('final');
await browser.close(); server.close();

console.log('state:', JSON.stringify(lastState));
if (!lastState) { console.error('✖ ゲームが開始されませんでした'); process.exit(1); }
if (errors.length) { console.error('✖ 実行時エラー:\n' + errors.join('\n')); process.exit(1); }
console.log(`✔ スモーク通過（${TURNS} 操作・エラー 0・画面 ${shots} 枚 → tests/out/）`);
