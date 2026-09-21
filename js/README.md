# JS Architecture

The original page behavior is preserved, but interaction code is split by responsibility.

- `core.js`: shared namespace, motion preference, clamp helper, scroll restoration, and loading state.
- `scroll-effects.js`: hero scroll mask, section title progress, and work stack progress.
- `reveal.js`: reveal-on-view behavior and hero reveal helper.
- `smooth-scroll.js`: Lenis setup and anchor navigation.
- `loader.js`: opening loader dismissal and first render handoff.
- `canvas-fields.js`: background atmosphere canvas and About section particle field.
- `about-keywords.js`: OAIOIL keyword hover/focus interaction.
- `capability-carousel.js`: 3D capability carousel.
- `theme-dock.js`: optional theme switch behavior if the theme dock is restored.
- `contact-actions.js`: copy buttons and WeChat QR panel.
- `card-effects.js`: magnetic and tilt effects.

Scripts are loaded as classic browser scripts in `index.html`, so the page still works without a build step.
