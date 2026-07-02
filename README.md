# Rent or Buy? 🏠🇨🇭

A pastel, animation-heavy rent-vs-buy calculator — Swiss edition. Tune the
assumptions, pick your methodology camp, and watch the verdict dance (in
francs).

## Run it

```sh
pnpm install
pnpm dev      # http://localhost:5173
pnpm test     # engine unit tests (vitest)
pnpm build    # typecheck + production build
```

## Canton, autosave & sharing

Pick your canton to load rough estimates for transfer costs, Liegenschaftssteuer
and the Grundstückgewinnsteuer rate (communes vary — check yours; editing any of
those sliders flips you back to "Custom"). Your setup autosaves to localStorage,
and the Share button copies a link that reproduces your exact scenario anywhere.

## The model

A monthly simulation (`src/lib/calc.ts`) built around how Swiss mortgages
actually work: the first mortgage (up to 65% of the purchase price) is
interest-only and never amortized; only the second mortgage (the 65%→80%
slice) is paid down, straight-line, within your chosen payoff window. Home
value appreciates continuously, rent/insurance/condo fees step up annually,
and Liegenschaftssteuer & maintenance track current home value. The "net cost"
of each path at year *t* is what you've committed minus what you'd get back if
you sold / walked away then — so the chart answers "who's ahead if I leave in
year N".

## Why the toggles exist

Honest people disagree about what counts — and in Switzerland, so do the
voters — so the answer-changing assumptions are switches, not opinions baked
into the math:

- **Opportunity cost** — invest-the-difference accounting: the down payment a
  renter *doesn't* make (and any monthly savings on either side) compounds at
  your investment return. Symmetric: whichever side pays less that month
  invests the difference.
- **Home appreciation** — home value growth on/off.
- **Eigenmietwert & deductions** — the current Swiss system: owners pay income
  tax on an imputed rental value but deduct mortgage interest + maintenance at
  their marginal rate. The September 2025 referendum abolished it (effective
  ~2028) — flip off to preview that world.
- **Selling costs** — agent commission when you eventually sell.
- **Property gains tax** — Grundstückgewinnsteuer: the canton taxes your
  nominal sale gain at a rate that shrinks the longer you hold; set it to
  match your canton and holding period.
- **Today's francs** — discount everything by inflation.

Made with 💜, compound interest and framer-motion — not financial advice, and
definitely not your Steueramt.
