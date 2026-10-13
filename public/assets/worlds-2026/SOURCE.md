# Worlds 2026 visual source record

## Riot Data Dragon map asset

The Worlds 2026 banner uses the official League of Legends Data Dragon Summoner's Rift minimap as a low-contrast background visual.

- Local file: `summoners-rift-map.png`
- Riot Data Dragon version: `16.19.1`
- Upstream: https://ddragon.leagueoflegends.com/cdn/16.19.1/img/map/map11.png
- Riot Data Dragon documentation: https://developer.riotgames.com/docs/lol
- Riot Developer Policy: https://developer.riotgames.com/policies/general
- Retrieved: 2026-10-03
- Upstream response: HTTP 200, `image/png`, 70,985 bytes, last-modified 2026-09-23.

Riot's Developer Policy explicitly lists Data Dragon among the assets that may be used in the development and marketing of a product. The page keeps the required Riot third-party-product disclaimer visible.

This asset is used only as subdued in-game visual context. It is not a Riot Games, League of Legends or Worlds logo, and the page does not imply Riot endorsement.

## Riot client color reference

During visual research, the League client champion-select position icons were reviewed from CommunityDragon's extracted Riot client assets:
https://raw.communitydragon.org/16.1/plugins/rcp-fe-lol-champ-select/global/default/svg/

Those SVGs directly encode the client gold pair `#785a28` (secondary/inactive geometry) and `#c8aa6e` (active geometry). The values are kept only as an observed League client UI color reference, not as a Worlds 2026 brand palette.

The five position SVG files were initially vendored for the Hero, but were removed from the repository after the Banner was simplified on 2026-10-03. They are no longer runtime assets and are not rendered by the Event Hub.

## League / Worlds trademark review

A downloaded third-party SVG labeled `League of Legends World Championship logo` was inspected earlier and intentionally not copied into this repository. A downloadable logo file does not itself grant trademark rights.

The page therefore does not embed Riot / League / Worlds logos or the Worlds trophy emblem. It uses descriptive event text (`Worlds 2026`, `S16`) plus subdued Data Dragon game context under the applicable Riot third-party/fan-project policies.

## Design-reference notes

Tencent's public LOL frontend reconstruction documentation was reviewed at:
- https://lol.qq.com/doc/frontend/dist/
- https://lol.qq.com/doc/frontend/dist/lolpc/template/
- https://lol.qq.com/doc/frontend/dist/lolpc/sell/
- https://lol.qq.com/doc/frontend/dist/lolpc/special/

The material confirms the long-standing black event-page baseline and Tencent's official League web templates. Its sell/template examples were used only as design reference; they are not treated as a current Worlds 2026 brand guide.

The user also supplied:
- https://codepen.io/davidsonaguiar/pen/zYEOZXe
- https://codepen.io/kqt/pen/zYdMovy

Both CodePen pages and their raw `.css/.html` endpoints were blocked by CodePen/Cloudflare in the available automated environment. No source code or assets from those Pens were copied or inferred.

## Palette

The page does not claim an official Worlds 2026 brand palette.

Two gold values were observed directly in the League client position-icon SVGs reviewed during design research:

- secondary / inactive gold: `#785a28`
- active gold: `#c8aa6e`

The surrounding dark/cream surface colors remain site-authored League-style UI choices:

- ink: `#010a13`
- panel ink: `#101621`
- cream: `#f0e6d2`

Only the two gold values above are described as directly observed Riot client-asset colors; the reviewed position icons are no longer shipped by this project, and none of these values are presented as a Worlds 2026 brand guide.
