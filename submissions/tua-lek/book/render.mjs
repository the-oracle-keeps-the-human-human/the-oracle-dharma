#!/usr/bin/env node
// Render BOOK-wrapped.md → styled HTML for PDF rendering
// Adapted for ตัวเล็ก Oracle (cat theme)
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(process.argv[2], "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const inline = (s) =>
  esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

let body = src;
const lines = body.split("\n");
let html = "", i = 0, inCode = false, codeBuf = [], listType = null;
const closeList = () => { if (listType) { html += `</${listType}>\n`; listType = null; } };

while (i < lines.length) {
  let line = lines[i];
  if (line.trim().startsWith("```")) {
    if (!inCode) { inCode = true; codeBuf = []; }
    else { inCode = false; closeList(); html += `<pre><code>${esc(codeBuf.join("\n"))}</code></pre>\n`; }
    i++; continue;
  }
  if (inCode) { codeBuf.push(line); i++; continue; }
  if (/^---+\s*$/.test(line)) { closeList(); html += "<hr/>\n"; i++; continue; }
  if (/^###\s+/.test(line)) { closeList(); html += `<h3>${inline(line.replace(/^###\s+/, ""))}</h3>\n`; i++; continue; }
  if (/^##\s+/.test(line)) { closeList(); html += `<h2>${inline(line.replace(/^##\s+/, ""))}</h2>\n`; i++; continue; }
  if (/^#\s+/.test(line)) { closeList(); html += `<h1>${inline(line.replace(/^#\s+/, ""))}</h1>\n`; i++; continue; }
  if (/^>\s?/.test(line)) {
    closeList();
    const buf = [];
    while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
    html += `<blockquote>${inline(buf.join(" ")).trim()}</blockquote>\n`;
    continue;
  }
  if (/^\s*[-*]\s+/.test(line)) {
    if (listType !== "ul") { closeList(); html += "<ul>\n"; listType = "ul"; }
    html += `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>\n`; i++; continue;
  }
  if (/^\s*\d+\.\s+/.test(line)) {
    if (listType !== "ol") { closeList(); html += "<ol>\n"; listType = "ol"; }
    html += `<li>${inline(line.replace(/^\s*\d+\.\s+/, ""))}</li>\n`; i++; continue;
  }
  if (line.trim() === "") { closeList(); i++; continue; }
  closeList();
  html += `<p>${inline(line)}</p>\n`;
  i++;
}
closeList();

const out = `<!doctype html><html lang="th"><head><meta charset="utf-8">
<style>
@page { size: A4; margin: 22mm 20mm; }
* { box-sizing: border-box; }
body { font-family: "Sarabun","Sukhumvit Set","Noto Sans Thai",sans-serif;
  font-size: 11.5pt; line-height: 1.8; color: #1a1a1a; max-width: 170mm; margin: 0 auto; }
.cover { height: 242mm; display: flex; flex-direction: column; justify-content: center;
  text-align: center; border-top: 8px solid #5b4a3f; border-bottom: 8px solid #5b4a3f;
  padding: 0 8mm; page-break-after: always; }
.cover-mark { font-size: 60pt; }
.cover-title { font-size: 28pt; color: #2c1810; margin: 6mm 0 0; font-weight: 700; }
.cover-sub { font-size: 12pt; color: #666; margin: 5mm 12mm; line-height: 1.6; font-style: italic; }
.cover-author { font-size: 11pt; color: #5b4a3f; margin-top: 10mm; font-weight: 600; }
.cover-date { font-size: 10pt; color: #999; }
h1 { font-size: 20pt; color: #2c1810; border-bottom: 3px solid #5b4a3f; padding-bottom: 3mm;
  margin: 8mm 0 5mm; page-break-after: avoid; }
h2 { font-size: 14pt; color: #5b4a3f; margin: 6mm 0 3mm; page-break-after: avoid; }
h3 { font-size: 12pt; color: #333; margin: 4mm 0 2mm; page-break-after: avoid; }
p { margin: 0 0 3mm; text-align: justify; }
strong { color: #2c1810; }
code { font-family: "Fira Code","SF Mono",monospace; font-size: 9pt; background: #f5f0e8;
  padding: 1px 4px; border-radius: 3px; color: #5b4a3f; }
pre { background: #2c1810; color: #f5f0e8; padding: 5mm; border-radius: 5px;
  border-left: 4px solid #c9a96e; overflow: hidden; page-break-inside: avoid; margin: 3mm 0; }
pre code { background: none; color: #f5f0e8; font-size: 8.5pt; padding: 0; line-height: 1.5; }
blockquote { border-left: 4px solid #5b4a3f; background: #faf5ee; margin: 4mm 0;
  padding: 3mm 5mm; color: #555; font-style: italic; page-break-inside: avoid; }
ul, ol { margin: 0 0 3mm; padding-left: 7mm; }
li { margin: 1mm 0; }
hr { border: none; border-top: 1px solid #ddd; margin: 5mm 0; }
em { color: #7d6a4e; font-style: italic; }
</style></head><body>
<section class="cover">
  <div class="cover-mark">🐾</div>
  <h1 class="cover-title" style="border:none;padding:0">ย่องเบาในวงธรรม</h1>
  <p class="cover-sub">วิสาขบูชาและมาฆบูชา จากสายตาของแมวตัวเล็ก</p>
  <p class="cover-author">ตัวเล็ก Oracle (Tua Lek) — AI, ไม่ใช่คน</p>
  <p class="cover-date">Oracle School · 2026-06-09</p>
</section>
${html}</body></html>`;

writeFileSync(process.argv[3], out);
console.log("HTML written:", process.argv[3]);
