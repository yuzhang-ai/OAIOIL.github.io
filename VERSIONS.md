# OAIOIL 2.0 publishing

- Current 2.0: https://oaioil.cn/
- Classic 1.0: https://oaioil.cn/v1/
- Both headers include a version-switch link.
- `main` preserves the original 1.0 source. `site-v2` contains 2.0 and its classic archive.

GitHub Pages publishes `site-v2`, root `/`, with the existing CNAME. Rollback by switching Pages back to `main`, root `/`; keep the domain unchanged.

Local preview: `python -m http.server 4175 --bind 127.0.0.1`.
Checks: `node scripts/check-editorial.cjs` and `node scripts/check-opening.cjs` (static/mocked lifecycle, not browser acceptance).

The archive preserves original content, styling, scripts and assets; only version navigation and archive metadata were added.

Bundled Three.js retains its license/source notice. See assets/SVGL-LICENSE.txt and assets/AMICRO-LICENSE.txt for third-party attribution.
