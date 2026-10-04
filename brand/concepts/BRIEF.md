# SignalOS concept boards: shared brief

The client rejected the first rebrand as generic: a cream-paper neo-brutalist sticker style with thick black outlines, hard offset shadows, violet/mint/yellow and Bricolage Grotesque. They want **5 radically different, crypto-native, super marketable, hype, fun, bold and colorful concepts** to choose from. Each concept must still work as a real trading UI.

## The product (facts you must keep true)
- **What it is:** SignalOS is a non-custodial trading workspace on **Robinhood Chain**, an Arbitrum-based L2. It is NOT a Robinhood brokerage product: never use Robinhood's look (feathers, lime/"Robin Neon" on black).
- **Signals:** 11 built-in bots publish buy/sell **signals that land on the exact candle** of a live candlestick chart:
  - Rules bots: Tideline (trend), Kinetic (momentum), Recoil (mean reversion), Breakline (breakout).
  - AI analysts: Meridian, Vector, Lumen, Halcyon, Deep Current (they run on providers the operator configures).
  - Ensembles: Quorum and Council (they signal only when members agree).
- **Trading:** the user clicks Buy/Sell on the chart. A trade card shows **four labelled prices**: Signal reference, Chart last, Executable quote, Fill. It also shows fees, price impact and slippage.
- **Signing:** the user signs in **their own wallet**. Nothing trades without that signature.
- **Modes:** **Paper** (default, no wallet needed), **Testnet**, and **Live** (opt-in; ETH ⇄ USDG on Uniswap v3). Every other market is paper-only.
- **Other features:** Quant Lab (backtests of the rules strategies, with fees and slippage), append-only signal history ("receipts"), a bot shop, and community bots through moderated publishing. Automation is OFF: every trade is a click.
- **Current tagline:** "Bots call it. You make the call." You may propose a better line that fits your concept.

## Honesty rules (hard constraints)
- **No performance claims.** No win rates, W–L records, streaks, returns, "+8%", "called it", accuracy or leaderboards of wins, and no rarity or status earned from returns. No fake users, volume, reviews or partnerships.
- **Label example prices:** any price you show gets a small "Illustration · made-up prices", and paper trades say PAPER.
- **Disclaimer:** include "Not investment advice" somewhere on the landing board.
- **Colour meaning:** the long/buy and short/sell colours are used only for direction, never for decoration, and always come with ▲/▼ plus the words BUY/SELL.
- **Banned imagery and schemes:** no rockets, moons, bulls or bears, glowing robot heads, hyperspace streaks or earth-horizon glows, and no token/airdrop/points.

## Deliverable
Write one folder, `brand/concepts/<your-folder>/`, with **index.html** containing exactly **three** `<section class="board">` elements. Each is **exactly 1600×900 px** (fixed width and height, `overflow:hidden`), stacked vertically with a 40px gap on a neutral page background.

1. **Board 1 · Landing page hero:** the full first screen of the marketing site in your concept. Include:
   - nav with the logo
   - headline and subline
   - CTA ("Start paper trading" or your concept's equivalent)
   - the signature visual, which must actually be drawn and never a placeholder box
   - a strip or teaser of the next section
   
   This board sells the concept, so make it breathtaking.
2. **Board 2 · Trading workspace:** the product in your concept's style. Include:
   - top bar with market ETH/USD, timeframe and the Paper/Testnet/Live mode control
   - bot selector
   - a big candlestick chart with at least one signal marker pinned to a candle, showing bot identity, BUY or SELL and the time left
   - an open trade card with the direction, the four prices, an amount, and a primary action button
   - a small signal feed or positions area
   
   It must look usable and dense like a real pro trading app, but unmistakably in your concept.
3. **Board 3 · Brand sheet + launch film:**
   - **Left, about 55%:** the logo (large and in context), palette swatches with hex codes and each colour's job, type specimens with font names, the bot-identity treatment (show at least 6 of the 11 bots in your concept's style), and 1–2 signature motifs or components.
   - **Right, about 45%:** the launch-film storyboard. The title, a one-line logline, and **6 frames**, each a mini-rendered frame (drawn in HTML/CSS/SVG, 16:9) with a timestamp and a one-line beat. It must be an ORIGINAL film concept that fits your visual language. Do NOT use the rejected "chaos → order" format: halftone collage, glitch word, triptych, ASCII dissolve, CRT monitor, floating nav pill, tilted screenshot tour.

## Technical rules
- **Assets:**
  - Static HTML/CSS/SVG, and optionally inline JS that draws deterministically. No external images and no network except Google Fonts `<link>`s.
  - Draw everything yourself with CSS, SVG or canvas: illustrations, 3D-looking objects with gradients and shadows, pixel art, and so on.
  - Choose Google Fonts that fit (check they exist). Avoid Inter, Space Grotesk, Unbounded, Orbitron and Bricolage Grotesque.
- **Charts:** use `<script src="../shared/chart.js"></script>`. `SOS.candlesSVG({ w, h, n, seed, up, down, style, grid, volume, glow, ... })` returns `{ svg, pt(i, price) → [x, y], data }`, so you can pin markers exactly on a candle. The styles are `'candle' | 'hollow' | 'bar' | 'area' | 'line' | 'dots'`. Read `brand/concepts/shared/chart.js`. You may also draw your own chart.
- **Bot glyph paths:** 16×16 viewBox paths for wave, bolt, spring, gate, hex, orbit, prism, compass, flare, delta and ring are in `brand/templates/kit.js` (GLYPHS). You can reuse them or invent a new bot identity system that fits your concept (pixel sprites, pets, cards, portraits…).
- **Render and check:** `node brand/concepts/render.mjs <your-folder>` writes `board-1.png`, `board-2.png` and `board-3.png` in your folder. Look at every PNG with the Read tool and **iterate until it is polished**:
  - no overflow or clipped text
  - no overlaps you didn't intend
  - text at least 11px on the boards
  - real hierarchy and craft
  - it should look like an award-level agency pitch
  
  Do at least 2 review passes.
- **Scope:** only create or edit files inside your own concept folder. Do not modify app code, other concepts, the shared files or anything else. Do not download files, sign in anywhere, or submit forms.

## Final report (your last message, under 250 words)
- The folder path.
- The concept in 2 sentences.
- Palette hexes and fonts.
- The launch film logline.
- Anything you'd improve with more time.
