# CSS Architecture

This folder keeps the same visual language as the original `styles.css`, but separates it by responsibility.

- `00-tokens.css`: color, radius, width, and motion tokens.
- `01-base.css`: reset, body typography, links, and buttons.
- `02-atmosphere.css`: ambient canvas, line texture, and grain layer.
- `03-loader.css`: opening loader scene.
- `04-header.css`: fixed header and optional theme dock styles.
- `05-hero.css`: sticky hero scene, portrait frame, marquee, role, and promise copy.
- `06-layout.css`: shared section spacing and title treatment.
- `07-about.css`: About section and OAIOIL keyword interaction layout.
- `08-capabilities.css`: capability carousel and orbit cards.
- `09-work.css`: sticky work stack.
- `10-tools.css`: collaborator/tool grid cards.
- `11-contact.css`: contact scene, QR panel, and footer.
- `12-motion.css`: reveal states, keyframes, and shared motion utilities.
- `13-responsive.css`: tablet/mobile adaptation and reduced-motion fallback.

Use `main.css` as the only stylesheet entry in HTML.
