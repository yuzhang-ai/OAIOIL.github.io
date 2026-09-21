const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const errors = [];
for (const match of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const ref = match[1].split(/[?#]/)[0];
  if (!ref || /^(?:https?:|mailto:|tel:|data:)/.test(ref)) continue;
  if (!fs.existsSync(path.resolve(root, ref))) errors.push(`Missing local reference: ${ref}`);
}
for (const name of fs.readdirSync(path.join(root, 'js')).filter(n => n.endsWith('.js'))) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, 'js', name)], {encoding:'utf8'});
  if (result.status !== 0) errors.push(`${name}: ${result.stderr}`);
}
const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(m => m[1]);
for (const id of new Set(ids)) if (ids.filter(v => v === id).length > 1) errors.push(`Duplicate id: ${id}`);
for (const match of html.matchAll(/aria-controls=["']([^"']+)["']/g)) {
  for (const id of match[1].split(/\s+/)) if (!ids.includes(id)) errors.push(`Missing controlled element: ${id}`);
}
const sections = [...html.matchAll(/<section\b[^>]*\bid=["']([^"']+)["']/g)].map(m => m[1]);
if (sections.indexOf('portfolio') !== sections.indexOf('about') + 1) errors.push('Portfolio must directly follow About');
const tools = html.match(/<section id="tools"[\s\S]*?<\/section>/)?.[0] || '';
const toolCount = (tools.match(/class="tool-card\b/g) || []).length;
if (toolCount !== 8) errors.push(`Expected eight tools, found ${toolCount}`);
const portfolio = html.match(/<section id="portfolio"[\s\S]*?<\/section>/)?.[0] || '';
const portfolioSelectors = [...portfolio.matchAll(/data-portfolio-select="([^"]+)"/g)].map(match => match[1]);
if (portfolioSelectors.length !== 3) errors.push(`Expected three portfolio accordion selectors, found ${portfolioSelectors.length}`);
for (const id of portfolioSelectors) {
  const selectorPattern = new RegExp(`data-portfolio-select="${id}"[^>]*aria-expanded|aria-expanded[^>]*data-portfolio-select="${id}"`);
  if (!selectorPattern.test(portfolio)) errors.push(`Portfolio selector ${id} lacks aria-expanded`);
  if (!new RegExp(`data-portfolio-note="${id}"`).test(portfolio)) errors.push(`Portfolio selector ${id} lacks an associated note`);
}
console.log(JSON.stringify({level:'static only',sections,toolCount,portfolioSelectors,errors}, null, 2));
process.exitCode = errors.length ? 1 : 0;
