# LoL Event Series Hero artwork provenance

This directory contains site-authored fan-project artwork for the League of Legends Event Series shell.

## Legacy original provenance

- Original artwork: generated with ChatGPT image generation and selected by the site owner for the LoL Event Series Hero.
- Generation ID: `de6c4eac-6b33-4517-a215-b56b2f920de6`.
- Original generated dimensions: 1942 × 809.
- Original generated file size: 2,314,437 bytes.
- The stored generation metadata does not contain the original prompt text, so no prompt wording is reconstructed or invented here.
- The artwork is not Riot Games, Worlds, LPL, LCK, MSI, or Demacia Cup official artwork.
- This legacy artwork embeds no Riot / League / Worlds / LPL official logo and does not reproduce a specific champion, skin, or official event key visual.

## Runtime derivatives

The original ~2.31 MB PNG is deliberately excluded from the runtime bundle.

- `lol-series-hero-1024.webp`
  - 1024 × 427
  - 45,494 bytes
  - SHA-256: `0ca8b5bb210e8e119d96f06d61264ef4de6fc5ef7ad0aa9a6bf485027a46ae72`
  - desktop / tablet Hero source
- `lol-series-hero-640.webp`
  - 640 × 267
  - 20,802 bytes
  - SHA-256: `9a39aafbec9378765cdf533f9be2be03732a06170d3550dfcbb58138e253e25f`
  - mobile Hero source
  - derived from the verified 1024 WebP with ffmpeg/libwebp

## Usage boundary

The image is a site-authored fantasy MOBA / Hextech-inspired fan-project background. It is intentionally used behind a strong navy/cyan UI wash so the Event Hub keeps its own visual identity instead of imitating a specific Riot event page.

Riot-owned Data Dragon and client position-icon assets remain separately documented under `public/assets/worlds-2026/SOURCE.md`. The LoL Event Series continues to display the existing non-official Riot fan-project disclaimer in the page UI.

## Champion ensemble runtime artwork (2026-10-06)

The current Hero uses separately generated champion-inspired fan artwork featuring Ahri,Lux,Yasuo,Jinx,Garen,Kai'Sa. These new resources supersede the legacy runtime choices above. They are not official Riot/event posters and do not embed lettering/logos. The official DCGI emblem is a separate image supplied by the existing event configuration.

Built-in image_gen produced two compositions; source prompts/provenance are recorded in docs/engineering/lol-series-hero-art-v2.md. Desktop image2 (original2172×724) is exported to lol-champions-hero-v2-1920.webp (1920×480,129042bytes). Compact image1 (original1986×792) retains its proportions in lol-champions-compact-v1-1280.webp (1280×511,78112bytes) and -640.webp (640×256,27416bytes), q80 WebP. At most1024px the browser uses compact srcset; wider uses desktop. CSS cover and focal positions perform viewport cropping without modifying source subjects. Legacy derivatives are retained for provenance; no PNG or external generation path is a runtime dependency.


## Worlds与LPL官方标识（2026-10-06）
- worlds-official.png：腾讯LPL官方世界赛浮动导航Logo，https://game.gtimg.cn/images/lpl/web202301/nav-float-logo-worlds.png 。Tab使用20px，Banner正文无Logo，右下角淡化水印。
- lpl-official.png：腾讯2025官方专区实际加载的LPL标识，https://game.gtimg.cn/images/lpl/act/a20250822s15/team-logo/lpl-def.png 。用于LPL官网回放入口，不使用腾讯聚合平台标识。
- 队徽恢复为官方TeamList随归档捕获的彩色标识，T1使用当届官网红色t1_2.png。实页确认2025专区的-def白色/-hov黑色都属单色，均不作为默认。TeamList为共享公共队伍字典，部分图片更新时间在2026，不宣称所有图片都是2025冻结品牌文件；当届全称/赛区/赛果仍由2025官方资料固定。原赛果快照不变。TSW官方TeamList为黑色标识，仅深色背景选择当届官网白色tsw-def.png；其余保留原彩色标识，不做统一滤镜染色。
- B站41场官方逐场映射及来源/核验方法见src/data/events/worlds-2025-bilibili.json；标题日期+双队集合与官方matchId逐场对应，无全量播放验收声明。


## 2026-10-06 手机原生竖版插画
内置 imagegen：使用本仓库 compact-v1 插画为风格/角色参考生成新 1024×1536 图（非横图裁剪）。生成源保持在 Codex generated_images，不是官方赛事海报。导出 640×960 与 960×1440 WebP，质量78，供 ≤600px 的 picture source 使用。来源同前述非官方 fan illustration，未嵌入官方标识/文字。

提示词（原文）：
> Use the supplied landscape fan-art image as a STYLE AND CHARACTER REFERENCE, create a NEW original portrait illustration, NOT a crop. Vertical 2:3 composition for a mobile League of Legends event banner. Six recognizable heroic fantasy game champions Ahri (fox ears and luminous pale tails, red/white clothing, blue orb), Lux (gold mage armor), Yasuo (blue scarf, katana), Jinx (blue braids), Garen (gold blue warrior armor) and Kai'Sa (purple armor). Polished cinematic painterly splash-art, dark navy/cyan atmosphere, gold and violet rim lighting. Group in lower two-thirds, faces at about 45-65% height; show distinct whole heads, shoulders and upper bodies without cutting faces at the frame edge. Upper 30% is quiet deep navy mist/fortress silhouettes, no bright objects, to support white title overlay. Keep the central-upper-left relatively calm. Lower 12% fades into dark navy for service links. Enough edge breathing room for narrow phone crop. A lively layered heroic group portrait with clear faces, subtle atmospheric depth. No words, letters, numbers, emblems, logos, watermarks, UI or frames. Nonofficial fan illustration, match reference palette and quality.

验收关注：肖像完整头部、移动端人物窗口、独立纵向遮罩，避免水印进入冠军结果区。桌面继续 hero-v2，平板 compact-v1。
