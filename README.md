# Vormvast Bouw

Nederlandstalige website voor een fictief aannemersbedrijf. De projectbeelden zijn gegenereerde concepten. De aanvraagfunctie bereidt een tekstbestand voor dat de bezoeker zelf kan delen.

## Lokaal starten

De statische build staat in `docs/`.

```sh
npm ci
npm run build
python3 -m http.server 8000 --bind 127.0.0.1 --directory docs
```

Open http://127.0.0.1:8000/. De algemene interacties staan in `src/main.ts`. De GSAP-animaties staan in `src/motion.ts` en de fotorealistische Three.js-woningtour in `src/room.ts`. De tour begint met de bestaande gevelfoto. Drie gegenereerde perspectieven reconstrueren de entree, woonruimte en binnentuin van het woningconcept. De tour laadt wanneer de bezoeker de sectie nadert. Met verminderde beweging of zonder WebGL verschijnt een statisch projectbeeld.

## GitHub Pages

Push deze projectmap naar een GitHub-repository. Kies bij **Settings → Pages** voor **Deploy from a branch**, met **main** en **/docs**. Publiceer na TypeScript-wijzigingen ook de opnieuw opgebouwde bestanden in `docs/`.

[GitHub Pages-documentatie](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
