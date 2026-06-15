#!/usr/bin/env node
// @ts-nocheck
/**
 * build-api-md.mjs — compile the official Screeps World API reference into ONE
 * self-contained markdown file (`screeps-api.md`) for the Cache agents to read.
 *
 * Source of truth: the open-source documentation repo github.com/screeps/docs,
 * whose `api/source/*.md` files author the page at https://docs.screeps.com/api/
 * using a handful of Hexo template macros. This script clones that repo (shallow)
 * and resolves those macros into plain markdown:
 *
 *   {% api_method name 'sig' cpu [opts] %}     -> "#### `name(sig)`" + CPU note
 *   {% api_property name type [opts] %}        -> "#### `name` : type"
 *   {% api_method_params %}...{% end... %}      -> a parameter table
 *   {% api_return_codes %}...{% end... %}       -> a return-code table (value resolved)
 *   {% page inherited/X.md %}                   -> inlines X (so inherited members appear)
 *   {% constants %}                            -> the @screeps/common constants source
 *
 * Inherited members use the "Class:name" colon form; we render them tagged
 * "(inherited from Class)".
 *
 * Usage:
 *   node reference/build-api-md.mjs [--docs <path-to-cloned-screeps-docs>] [--out <file>]
 * With no --docs it clones screeps/docs into a temp dir. Output defaults to
 * reference/screeps-api.md next to this script.
 *
 * This file is committed so the reference is reproducible; the generated
 * screeps-api.md is committed too so it ships to every box via `git pull`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ────────────────────────────────────────────────────────────────
function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const OUT = arg('--out') || path.join(HERE, 'screeps-api.md');

// ── docs repo (clone if not supplied) ─────────────────────────────────────────
function getDocsDir() {
  const supplied = arg('--docs');
  if (supplied) return supplied;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'screeps-docs-'));
  console.error(`cloning screeps/docs into ${dir} ...`);
  execFileSync('git', ['clone', '--depth', '1', 'https://github.com/screeps/docs.git', dir], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  return dir;
}

// ── tiny YAML list parser (GlobalObjects / Prototypes sequences) ──────────────
function configList(yaml, key) {
  const lines = yaml.split(/\r?\n/);
  const out = [];
  let inSection = false;
  for (const line of lines) {
    if (new RegExp(`^${key}:\\s*$`).test(line)) { inSection = true; continue; }
    if (inSection) {
      const m = line.match(/^\s*-\s*(\S+)\s*$/);
      if (m) { out.push(m[1]); continue; }
      if (/^\S/.test(line)) break; // next top-level key ends the section
    }
  }
  return out;
}

// ── macro-argument tokenizer (respects '...', "...", and {...} JSON) ──────────
function parseArgs(s) {
  const tokens = [];
  let i = 0;
  const n = s.length;
  while (i < n) {
    while (i < n && /\s/.test(s[i])) i++;
    if (i >= n) break;
    const c = s[i];
    if (c === "'" || c === '"') {
      const q = c; i++;
      let v = '';
      while (i < n && s[i] !== q) { v += s[i]; i++; }
      i++;
      tokens.push(v);
    } else if (c === '{') {
      let depth = 0, v = '';
      while (i < n) {
        if (s[i] === '{') depth++;
        else if (s[i] === '}') depth--;
        v += s[i]; i++;
        if (depth === 0) break;
      }
      tokens.push(v);
    } else {
      let v = '';
      while (i < n && !/\s/.test(s[i])) { v += s[i]; i++; }
      tokens.push(v);
    }
  }
  return tokens;
}

// ── inline HTML/entity -> plain markdown (for headings & table cells) ─────────
function inlineText(s) {
  if (s == null) return '';
  return String(s)
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, '`$1`')
    .replace(/<\/?(?:em|strong|i|b|p|span|div|ul|li|ol)\b[^>]*>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '...')
    .replace(/\s+/g, ' ')
    .trim();
}
const cell = (s) => inlineText(s).replace(/\|/g, '\\|');

// CPU cost descriptions (from api/scripts/tag-api_method.js).
const CPU = {
  '0': 'CPU cost: insignificant.',
  '1': 'CPU cost: low.',
  '2': 'CPU cost: medium.',
  '3': 'CPU cost: high.',
  A: 'Action: changes game state; +0.2 CPU added to its natural cost when it returns OK.',
};

// Return-code constant -> value (from api/scripts/tag-api_return_codes.js).
const RET = {
  OK: 0, ERR_NOT_OWNER: -1, ERR_NO_PATH: -2, ERR_NAME_EXISTS: -3, ERR_BUSY: -4,
  ERR_NOT_FOUND: -5, ERR_NOT_ENOUGH_ENERGY: -6, ERR_NOT_ENOUGH_RESOURCES: -6,
  ERR_INVALID_TARGET: -7, ERR_FULL: -8, ERR_NOT_IN_RANGE: -9, ERR_INVALID_ARGS: -10,
  ERR_TIRED: -11, ERR_NO_BODYPART: -12, ERR_NOT_ENOUGH_EXTENSIONS: -6,
  ERR_RCL_NOT_ENOUGH: -14, ERR_GCL_NOT_ENOUGH: -15, ERR_ACCESS_DENIED: -16,
};

function parseOpts(raw) {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
function colonSplit(name) {
  const m = name.match(/^(.*?):(.*)$/);
  return m ? { inherited: m[1], name: m[2] } : { inherited: '', name };
}
function deprecatedNote(opts, kind) {
  if (!opts.deprecated) return '';
  const extra = typeof opts.deprecated === 'string' ? ' ' + inlineText(opts.deprecated) : '';
  return `\n> **Deprecated ${kind} — will be removed.**${extra}\n`;
}

function renderMethod(argstr) {
  const a = parseArgs(argstr);
  let name = a[0], sig, cpu, optsRaw;
  if (a[2] === undefined) { sig = ''; cpu = a[1]; optsRaw = undefined; }
  else { sig = a[1]; cpu = a[2]; optsRaw = a[3]; }
  const c = colonSplit(name); name = c.name;
  const opts = parseOpts(optsRaw);
  const sigs = (sig || '').split('|').map((x) => inlineText(x.trim())).filter(Boolean);
  const head = sigs.length ? sigs.map((x) => `${name}(${x})`).join(' / ') : `${name}()`;
  let out = `\n#### \`${head}\`${c.inherited ? `  _(inherited from ${c.inherited})_` : ''}\n`;
  if (CPU[cpu]) out += `\n_${CPU[cpu]}_\n`;
  out += deprecatedNote(opts, 'method');
  return out;
}

function renderProperty(argstr) {
  const a = parseArgs(argstr);
  const c = colonSplit(a[0]);
  const type = inlineText(a[1] || '');
  const opts = parseOpts(a[2]);
  let out = `\n#### \`${c.name}\`${type ? ` : ${type}` : ''}${c.inherited ? `  _(inherited from ${c.inherited})_` : ''}\n`;
  out += deprecatedNote(opts, 'property');
  return out;
}

function renderParams(content) {
  const items = content.split('\n===\n');
  let out = '\n| parameter | type | description |\n|---|---|---|\n';
  let rows = 0;
  for (const it of items) {
    const t = it.trim();
    if (!t) continue;
    const m = t.match(/^(.*?)\s*:\s*([^\n]*)\n([\s\S]*)$/) || t.match(/^(.*?)\s*:\s*([^\n]*)$/);
    if (!m) continue;
    let pname = m[1].trim();
    const ptype = m[2].trim();
    const pdesc = (m[3] || '').trim();
    let opt = '';
    if (/\(optional\)/.test(pname)) { pname = pname.replace(/\s*\(optional\)/, ''); opt = ' _(optional)_'; }
    out += `| \`${cell(pname)}\`${opt} | ${cell(ptype)} | ${cell(pdesc)} |\n`;
    rows++;
  }
  return rows ? out + '\n' : '\n';
}

function renderReturnCodes(content) {
  let out = '\n| code | value | description |\n|---|---|---|\n';
  let rows = 0;
  for (const raw of content.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf('|');
    if (idx < 0) continue;
    const code = line.slice(0, idx).trim();
    const desc = line.slice(idx + 1).trim();
    const val = RET[code];
    out += `| \`${code}\` | ${val === undefined ? '' : val} | ${cell(desc)} |\n`;
    rows++;
  }
  return rows ? out + '\n' : '\n';
}

// ── per-file transform (recurses for {% page %}) ──────────────────────────────
function transformFile(rel, sourceDir, constantsJs, chain) {
  if (chain.has(rel)) return ''; // cycle guard
  const nextChain = new Set(chain); nextChain.add(rel);
  const abs = path.join(sourceDir, rel);
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
  const out = [];
  let titleSeen = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const t = line.trim();
    let m;

    if (/^\{%\s*api_method_params\s*%\}/.test(t)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^\{%\s*endapi_method_params\s*%\}/.test(lines[i].trim())) buf.push(lines[i++]);
      out.push(renderParams(buf.join('\n')));
      continue;
    }
    if (/^\{%\s*api_return_codes\s*%\}/.test(t)) {
      const buf = [];
      i++;
      while (i < lines.length && !/^\{%\s*endapi_return_codes\s*%\}/.test(lines[i].trim())) buf.push(lines[i++]);
      out.push(renderReturnCodes(buf.join('\n')));
      continue;
    }
    if ((m = t.match(/^\{%\s*page\s+(\S+)\s*%\}/))) {
      out.push(transformFile(m[1], sourceDir, constantsJs, nextChain));
      continue;
    }
    if (/^\{%\s*constants\s*%\}/.test(t)) {
      out.push('\n```javascript\n' + constantsJs.trim() + '\n```\n');
      continue;
    }
    if ((m = t.match(/^\{%\s*api_method\s+([\s\S]*?)\s*%\}$/))) { out.push(renderMethod(m[1])); continue; }
    if ((m = t.match(/^\{%\s*api_property\s+([\s\S]*?)\s*%\}$/))) { out.push(renderProperty(m[1])); continue; }

    // pass-through prose. Demote the file's first "# Title" to an object heading;
    // turn any other in-body heading (e.g. "### Return value") into bold so it
    // never competes with the object/member heading levels.
    if (/^#\s+/.test(t) && !titleSeen) { titleSeen = true; out.push('### ' + t.replace(/^#\s+/, '')); continue; }
    if (/^#{1,6}\s+/.test(t)) { out.push('**' + t.replace(/^#{1,6}\s+/, '').trim() + '**'); continue; }
    out.push(line);
  }
  return out.join('\n');
}

// ── main ──────────────────────────────────────────────────────────────────────
async function fetchConstants() {
  const urls = [
    'https://unpkg.com/@screeps/common/lib/constants.js',
    'https://raw.githubusercontent.com/screeps/common/master/lib/constants.js',
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const text = await r.text();
        if (text && text.length > 500) { console.error(`constants from ${url} (${text.length} bytes)`); return text; }
      }
    } catch { /* try next */ }
  }
  console.error('WARNING: could not fetch @screeps/common constants; emitting a pointer.');
  return '// Could not fetch constants at build time.\n// See https://docs.screeps.com/api/#Constants and reference/engine/src/game/constants.js';
}

async function main() {
  const docsDir = getDocsDir();
  const sourceDir = path.join(docsDir, 'api', 'source');
  const cfg = fs.readFileSync(path.join(docsDir, 'api', '_config.yml'), 'utf8');
  const globals = configList(cfg, 'GlobalObjects');
  const protos = configList(cfg, 'Prototypes');
  if (!globals.length || !protos.length) throw new Error('failed to parse _config.yml page lists');

  const constantsJs = await fetchConstants();

  const parts = [];
  parts.push(
    '# Screeps World — Official API Reference\n\n' +
    '> Auto-compiled from the official documentation at <https://docs.screeps.com/api/> ' +
    '(source: github.com/screeps/docs, `api/source`). REFERENCE material for the Cache agents — ' +
    'consult it whenever you are unsure about an API call\'s signature, behavior, CPU cost, or return ' +
    'codes. **Do not edit, import into Cache, or deploy this file.**\n>\n' +
    '> Method headings show the signature and a CPU-cost note. "Action" methods change game state and ' +
    'cost an extra 0.2 CPU when they return `OK`. Most in-room objects inherit from **RoomObject** ' +
    '(`pos`, `room`, `effects`); structures also inherit from **Structure** (`hits`, `hitsMax`, `id`, ' +
    '`structureType`, `destroy`, `isActive`, `notifyWhenAttacked`); owned structures from ' +
    '**OwnedStructure** (`my`, `owner`). Inherited members are repeated inline and tagged ' +
    '"(inherited from …)".\n>\n' +
    '> When the docs are ambiguous, read the ground-truth engine source under `reference/engine/src` ' +
    '(see `reference/README.md`).\n\n' +
    '_Regenerate with `node reference/build-api-md.mjs`._\n'
  );

  parts.push('\n---\n\n## Global objects\n');
  for (const f of globals) {
    parts.push(transformFile(f, sourceDir, constantsJs, new Set()));
    parts.push('\n---\n');
  }
  parts.push('\n## Prototypes\n');
  for (const f of protos) {
    parts.push(transformFile(f, sourceDir, constantsJs, new Set()));
    parts.push('\n---\n');
  }

  // collapse 3+ blank lines to 2 for tidiness
  const doc = parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
  fs.writeFileSync(OUT, doc, 'utf8');
  const kb = (Buffer.byteLength(doc) / 1024).toFixed(0);
  const methods = (doc.match(/^#### /gm) || []).length;
  const objects = globals.length + protos.length;
  console.error(`wrote ${OUT} — ${kb} KB, ${objects} objects, ${methods} members.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
