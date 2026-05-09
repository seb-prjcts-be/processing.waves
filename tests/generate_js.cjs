// Run: node generate_js.cjs
// Reads cases.tsv, runs each through p5.waves.js, writes expected.tsv.

const fs = require('fs');
const path = require('path');

// Load p5.waves.js — IIFE attaches `Waves` to its global arg.
// In CJS, `this` at top level is module.exports, so we capture it via require.
const wavesModule = {};
const wavesScript = fs.readFileSync(path.join(__dirname, 'p5.waves.js'), 'utf8');
// Strip the IIFE wrapper so we can run it in our own scope and grab `Waves`.
const inner = wavesScript
  .replace(/^\(function \(global\) \{/m, '')
  .replace(/\}\)\(typeof window[^)]+\);[\s]*$/m, '');
const fn = new Function('global', inner + '\nreturn global.Waves;');
const Waves = fn(wavesModule);
if (!Waves) throw new Error('Failed to load Waves from p5.waves.js');

const tsv = fs.readFileSync(path.join(__dirname, 'cases.tsv'), 'utf8');
const lines = tsv.trim().split(/\r?\n/);
const header = lines[0].split('\t');

function parseRow(line) {
  const parts = line.split('\t');
  const o = {};
  for (let i = 0; i < header.length; i++) o[header[i]] = parts[i];
  return o;
}

function buildOpts(c) {
  const o = {};
  if (c.wave !== '-') o.wave = c.wave;
  if (c.waveB !== '-') o.wave = [c.wave, c.waveB];
  o.seed       = parseInt(c.seed,      10);
  o.t          = parseFloat(c.t);
  o.amplitude  = parseFloat(c.amplitude);
  o.frequency  = parseFloat(c.frequency);
  o.phase      = parseFloat(c.phase);
  if (c.mode === 'wild') {
    o.mode = 'wild';
    o.unpredictability = parseFloat(c.u);
  }
  if (c.mix !== '-') o.mix = parseFloat(c.mix);
  if (c.rlo !== '-' && c.rhi !== '-') {
    o.range = [parseFloat(c.rlo), parseFloat(c.rhi)];
  }
  if (c.group !== '-' && c.group !== 'all') o.group = c.group;
  return o;
}

const out = ['id\texpected'];
for (let i = 1; i < lines.length; i++) {
  const c = parseRow(lines[i]);
  const y = parseFloat(c.y);
  const opts = buildOpts(c);
  const v = Waves.wave(y, opts);
  out.push(c.id + '\t' + v);
}

fs.writeFileSync(path.join(__dirname, 'expected.tsv'), out.join('\n') + '\n');
console.log('Wrote expected.tsv (' + (lines.length - 1) + ' cases)');
