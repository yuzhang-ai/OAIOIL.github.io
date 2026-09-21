# Local vendor provenance

- Package: `three` 0.184.0, MIT license.
- Source: existing local installation of the `three` npm package, version 0.184.0.
- Scope: browser module runtime only. No npm installation or package migration was performed for this candidate.

| File | SHA-256 |
| --- | --- |
| `three.module.min.js` | `36A60B0120335F89A80A0DAB70292292B0EC414B3D05E83CD09A3EA428C6712A` |
| `three.core.min.js` | `6486AA0D719CFA87EC88DC47223B59B1FB8417A1A407FC0E52467C943E2F8CC9` |
| `LICENSE` | `8B378EBE60E2FE500158CB0AC71CB5E8B7D92953C2ABCC63A0EB90499653B5BC` |

`three.module.min.js` imports the sibling `three.core.min.js`; both are retained together with the upstream license text.
