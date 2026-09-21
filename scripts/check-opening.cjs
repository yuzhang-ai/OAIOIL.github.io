const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, '../js/loader.js'), 'utf8');
function scenario({ pending = true, reduced = false, brokenStorage = false } = {}) {
  const timers = new Map(); let id = 0;
  function element() {
    const classes = new Set(); const events = new Map();
    return { dataset: {}, style: { setProperty() {} }, events,
      classList: { add: (...v) => v.forEach(x => classes.add(x)), remove: (...v) => v.forEach(x => classes.delete(x)), contains: v => classes.has(v) },
      addEventListener: (k, fn) => events.set(k, fn), removeEventListener: k => events.delete(k),
      setAttribute() {}, getBoundingClientRect: () => ({ width: 56, height: 56, left: 0, top: 0 }), querySelector: () => null };
  }
  const root = element(), body = element(), loader = element(), mark = element(), o = element(), skip = element(), replay = element(), win = element();
  loader.querySelector = s => ({ '.loader__mark': mark, '.loader__o': o, '.loader__skip': skip }[s]);
  if (pending) root.classList.add('opening-pending');
  win.ResumeSite = { prefersReducedMotion: reduced };
  win.setTimeout = (fn, ms) => { timers.set(++id, {fn, ms}); return id; };
  win.clearTimeout = n => timers.delete(n);
  win.cancelAnimationFrame = win.clearTimeout;
  win.matchMedia = () => ({matches: reduced});
  let writes = 0;
  vm.runInNewContext(code, { window: win, document: { documentElement: root, body, querySelector: s => ({'.loader': loader, '.opening-replay': replay}[s]) },
    sessionStorage: { setItem() { if (brokenStorage) throw Error('disabled'); writes++; } },
    requestAnimationFrame: fn => win.setTimeout(fn, 0), Image: class {set src(_) {this.onload();}} });
  return {root,body,loader,skip,replay,win,timers,get writes(){return writes;}, run(ms){for(const [key, value] of [...timers]) if(value.ms===ms){timers.delete(key);value.fn();}}};
}
(async () => {
  const natural = scenario(); await Promise.resolve(); natural.run(0); natural.run(2100);
  assert.equal(natural.root.dataset.opening, 'complete'); assert.equal(natural.timers.size, 0);
  assert.equal(natural.win.events.size, 0); assert.equal(natural.writes, 1);
  const escape = scenario(); await Promise.resolve(); escape.run(0);
  escape.win.events.get('keydown')({key:'Tab'}); escape.win.events.get('keydown')({key:'Escape'});
  assert.equal(escape.root.dataset.opening, 'complete'); assert.equal(escape.timers.size,0);
  const early = scenario(); early.skip.events.get('click')({type:'click'}); await Promise.resolve();
  assert.equal(early.root.dataset.opening, 'complete'); assert.equal(early.timers.size,0);
  const storage = scenario({brokenStorage:true}); await Promise.resolve(); storage.run(2100);
  assert.equal(storage.root.dataset.opening, 'complete');
  for (const options of [{pending:false}, {reduced:true}]) {
    const s = scenario(options); assert.equal(s.root.dataset.opening,'complete'); assert.equal(s.timers.size,0);
  }
  console.log('PASS: simulated lifecycle — natural, Escape after Tab, early skip, blocked storage, repeat/hash decision, reduced motion. Not browser evidence.');
})().catch(e => {console.error(e);process.exitCode=1;});
