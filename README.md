# CrossWay for Business (client portal)

Self-serve portal for CrossWay's business clients (restaurants, retail, warehouses). Built with React 19, Vite and
Motion for animations. It is a **static site**: no backend, all data is demo data in the browser, and changes reset on reload.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # static output in dist/
npm run preview  # serve dist/ locally
```

Deploy `dist/` to any static host. Paths are relative and screens use hash URLs (`#/book`), so no rewrites are needed.

## Motion

Confident Material 3 Expressive motion from the shared `design-tokens/`, through the TypeScript library in `src/motion/`:

- **Product tour** (`#/welcome`, or "Product tour" in the top bar): a GSAP ScrollTrigger story in which candidates
  flow from the talent pool through your pipeline as you scroll
- **Kanban:** drag cards between stages with a spring, lift, tilt from velocity, and neighbours that reflow; dropping
  on Hired sends out a burst
- **Candidate → profile:** shared-element avatar and name
- **Post a job:** three steps with shared axis X and a springing progress bar
- Skeleton shimmer that crossfades into content; morphing pay and post buttons
- Light and dark themes from the brand seed colour, with a circular reveal
- `prefers-reduced-motion` turns movement into fades and shows the tour as a static board

`npm run typecheck` checks the motion library. Spec, accessibility and performance docs: [`docs/motion/`](docs/motion/README.md).

## Screens

| Code | Screen | Highlights |
| --- | --- | --- |
| C1 | Home | Setup checklist, animated tiles, upcoming bookings, one-tap crew rebook |
| C2 | Book | "Describe it" form filler, live pricing (same-day/peak surcharges, GST, recurring), labour-rule checks, approval limits |
| C6 | Live | On-site board: replacements, standby swap, early release, late-cancel fee |
| C7 | Timesheets | Bulk approve clean sheets, OT handling, dispute with hours validation |
| C3–C5 | Hiring | Candidate pipeline with animated stage moves, post-a-job with salary benchmark and AI-written JD |
| C8 | Workers | Star ratings, favourites, block with reason |
| C9 | Invoices | Credit usage, GST invoice download, payment flow (first attempt fails, retry succeeds) |
| C10 | Payroll | Inputs → compute → approve → payslips |
| C11 | Vault | Compliance documents |
| C15 | Support | Tickets and a live chat with the account manager |
| C13 | Team | Approval limits, last-owner protection, pending approvals |

Switch **Signed in as** to try role limits (Site Manager ₹15,000 limit, Finance can't book, Interviewer sees only
Hiring). **Edge cases** in the header loads each edge-case scenario directly.
