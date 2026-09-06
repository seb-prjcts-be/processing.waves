// Generate independent expectations from the checked-in p5.waves reference.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sandbox = { console: { info() {} } };
vm.createContext(sandbox);
const source = fs.readFileSync(path.join(__dirname, 'p5.waves.js'), 'utf8')
  .replace('global.Waves = Waves;', 'global.Waves = Waves; global.groups = {gentle:GENTLE_INDICES, harsh:HARSH_INDICES, closing:CLOSING_INDICES, ghost:GHOST_INDICES};');
vm.runInContext(source, sandbox);
const W = sandbox.Waves, rows = [];
const add = (id, value) => rows.push(id + '\t' + value);
const xs = [NaN, Infinity, -Infinity, 0, 10, -10];
for (const {index, name, character} of W.list()) {
  add('meta-' + index, name + '|' + character);
  xs.forEach((x, i) => {
    add('name-' + index + '-' + i, W.wave(x, name));
    add('opts-' + index + '-' + i, W.wave(x, {wave: name}));
    add('sampler-' + index + '-' + i, W.createSampler({wave: name}).sample(x));
  });
}
for (const [name, indices] of Object.entries(sandbox.groups))
  add('group-' + name, indices.join(','));
xs.forEach((x, i) => {
  add('default-' + i, W.wave(x));
  add('seed-' + i, W.wave(x, 42));
});
const invalids = [
  {t: NaN}, {t: Infinity}, {amplitude: NaN}, {frequency: Infinity},
  {phase: -Infinity}, {mode: ' WILD ', unpredictability: 0.5},
  {mode: 'wild', unpredictability: NaN}, {range: [NaN, Infinity]},
  {range: []}, {wave: ['classic sine', 'mountain peaks'], mix: NaN},
  {wave: []}
];
invalids.forEach((extra, i) => {
  const opts = Object.assign({wave: 'classic sine'}, extra);
  add('invalid-wave-' + i, W.wave(10, opts));
  add('invalid-sampler-' + i, W.createSampler(opts).sample(10));
});
for (const shift of [false, true]) {
  const opts = {wave:'classic sine', group:['classic sine'], shift,
    t:2, amplitude:80, frequency:0.5, phase:0.25};
  const s = W.createSampler(opts);
  opts.t=30; opts.amplitude=900; opts.frequency=7; opts.phase=4;
  opts.mode='wild'; opts.unpredictability=1;
  add('snapshot-' + shift, s.sample(10));
  add('time-nan-' + shift, s.sample(10, NaN));
  add('time-inf-' + shift, s.sample(10, Infinity));
}
const morphOpts = {wave:['classic sine','mountain peaks'], mix:0.25, range:[-7,13]};
const morph = W.createSampler(morphOpts);
morphOpts.wave[0]='noise'; morphOpts.range[0]=200; morphOpts.mix=1;
add('snapshot-morph', morph.sample(10,2));
add('mix-nan', morph.sample(10,2,NaN));
add('mix-inf', morph.sample(10,2,Infinity));
for (const [i, opts] of [
  {shiftInterval:NaN,shiftDuration:NaN},
  {shiftInterval:Infinity,shiftDuration:Infinity},
  {shiftInterval:-1,shiftDuration:0}
].entries()) {
  Object.assign(opts,{wave:'classic sine',group:['classic sine'],shift:true,t:5});
  add('shift-wave-' + i, W.wave(10,opts));
  add('shift-sampler-' + i, W.createSampler(opts).sample(10));
}
add('null-options', W.wave(10,null));
add('null-sampler', W.createSampler(null).sample(10));
fs.writeFileSync(path.join(__dirname, 'regression-expected.tsv'), rows.join('\n') + '\n');
console.log('Generated ' + rows.length + ' regression expectations from p5.waves.');
