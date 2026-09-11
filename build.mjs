#!/usr/bin/env node
/* ダイスキングダム ビルド（Node 版）
   build.ps1 と同じ手順を Windows 以外（Mac / Linux / GitHub Actions）でも動かすためのもの。
   src/ を結合して game.html（Artifact用・素材を data URI で埋め込み）と index.html（単体版・相対パス）を作る。
   使い方:  node build.mjs            */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const d = path.dirname(fileURLToPath(import.meta.url));
const parts = ["1-style.html","1b-ui.html","1c-meta.html","1d-polish.html","1e-dk.html","1f-dk2.html","1g-room.html","1h-board.html","1i-title.html","1j-fast.html","2-body.html",
               "3-core.js","3b-art.js","3e-style.js",
               "6-audio.js","6b-bgm.js","6c-bgm2.js","6d-jingle.js","4-game.js","7-online.js","5-meta.js","8-dk.js"];
let body = '';
for (const p of parts) {
  const f = path.join(d, 'src', p);
  if (!fs.existsSync(f)) { console.error('missing: ' + p); process.exit(1); }
  body += fs.readFileSync(f, 'utf8') + '\n';
}
const MIME = { mp3:'audio/mpeg', ogg:'audio/ogg', m4a:'audio/mp4', wav:'audio/wav', png:'image/png', webp:'image/webp', jpg:'image/jpeg', jpeg:'image/jpeg' };
const dataUri = (f) => `data:${MIME[path.extname(f).slice(1).toLowerCase()]};base64,` + fs.readFileSync(f).toString('base64');
const block = (name, map) => Object.keys(map).length ? `<script>window.${name}=${JSON.stringify(map)};</script>\n` : '';
const MB = (n) => (n / 1048576).toFixed(2);

// BGM
const bgmRel = {}, bgmDat = {}; let bgmTotal = 0;
for (const n of ["lobby","game","tense","win","room","gacha","boss","result"]) {
  for (const e of ["mp3","ogg","m4a","wav"]) {
    const f = path.join(d, 'assets/bgm', `${n}.${e}`);
    if (fs.existsSync(f)) { bgmRel[n] = `assets/bgm/${n}.${e}`; bgmDat[n] = dataUri(f); bgmTotal += fs.statSync(f).size; break; }
  }
}
console.log(Object.keys(bgmRel).length ? `BGM: ${Object.keys(bgmRel).join(', ')}  (合計 ${MB(bgmTotal)} MB)` : 'BGM: ファイル無し → 合成音で動きます');

// キャラ画像 c01..c24 / t01..t24
const cRel = {}, cDat = {}; let cTotal = 0;
const cnames = []; for (let i = 1; i <= 24; i++) cnames.push('c' + String(i).padStart(2, '0')); for (let i = 1; i <= 24; i++) cnames.push('t' + String(i).padStart(2, '0'));
for (const n of cnames) for (const e of ["png","webp","jpg","jpeg"]) {
  const f = path.join(d, 'assets/chars', `${n}.${e}`);
  if (fs.existsSync(f)) { cRel[n] = `assets/chars/${n}.${e}`; cDat[n] = dataUri(f); cTotal += fs.statSync(f).size; break; }
}
let cDatUse = cDat;
if (Object.keys(cRel).length) {
  console.log(`キャラ画像: ${Object.keys(cRel).length} 点 (合計 ${MB(cTotal)} MB)`);
  if (cTotal > 10 * 1048576) { cDatUse = {}; console.warn('キャラ画像が 10MB 超。game.html への埋め込みをやめました'); }
} else console.log('キャラ画像: ファイル無し → 手続き描画で動きます');

// 画面素材 assets/ui/*
const uRel = {}, uDat = {}; let uTotal = 0;
const udir = path.join(d, 'assets/ui');
if (fs.existsSync(udir)) for (const fn of fs.readdirSync(udir)) {
  if (!/\.(png|webp|jpe?g)$/i.test(fn)) continue;
  const f = path.join(udir, fn), n = fn.replace(/\.[^.]+$/, '');
  uRel[n] = 'assets/ui/' + fn; uDat[n] = dataUri(f); uTotal += fs.statSync(f).size;
}
if (Object.keys(uRel).length) console.log(`画面素材: ${Object.keys(uRel).length} 点 (合計 ${MB(uTotal)} MB)`);

fs.writeFileSync(path.join(d, 'game.html'), block('DV_BGM', bgmDat) + block('DV_CHARIMG', cDatUse) + block('DV_UI', uDat) + body);
const head = '<!doctype html>\n<html lang="ja">\n<head>\n<meta charset="utf-8">\n'
  + '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
  + '<meta name="description" content="ダイスボヤージュ — 横画面で遊ぶボードゲーム">\n';
let full = head + block('DV_BGM', bgmRel) + block('DV_CHARIMG', cRel) + block('DV_UI', uRel) + body + '\n</html>';
full = full.replace(/^([\s\S]*?)(<div id="viewport">)/, '$1</head><body>$2');
fs.writeFileSync(path.join(d, 'index.html'), full);
const kb = (f) => Math.round(fs.statSync(path.join(d, f)).size / 1024);
console.log(`game.html  = ${kb('game.html')} KB\nindex.html = ${kb('index.html')} KB`);
if (fs.statSync(path.join(d, 'game.html')).size > 15 * 1048576) console.warn('game.html が 15MB 超。Artifact の上限は 16MB です');
