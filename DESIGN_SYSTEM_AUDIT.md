# Design System Audit

## Color Palette
| Role | Value(s) | Sources / Notes |
| --- | --- | --- |
| Primary | #ff6b00 | Declared as `spicy` in Tailwind configs on storefront pages: [public-site/index.html](public-site/index.html), [public-site/category.html](public-site/category.html), [public-site/product.html](public-site/product.html), [public-site/checkout.html](public-site/checkout.html), [public-site/thank-you.html](public-site/thank-you.html); also admin config: [admin-site/index.html](admin-site/index.html) |
| Primary Dark | #e55d00 / #e55a00 / #e55f00 | Variants per page configs (`spicy-dark`, `orange.600`) — inconsistent across storefront pages |
| Primary Gradient Stop | #ff8533 | Used only for checkout `.btn-primary` gradient hover/active in [public-site/checkout.html](public-site/checkout.html) |
| Accent Red | #ff4444 (fire/flame), #ef4444, #dc2626 | Used for hearts, alerts, hover states across storefront pages (e.g., favorites, stock warnings, close buttons) |
| Amber / Cashback | #fbbf24, #f59e0b, #fef3c7 | Cashback tooltip/badges in [public-site/checkout.html](public-site/checkout.html) |
| Blues | #3b82f6 focus outline (styles.css), #blue-50/100/600 via Tailwind utilities | Focus ring + info badges; defined in [public-site/css/styles.css](public-site/css/styles.css) and used in checkout/thank-you |
| Background | #ffffff | Base surface across pages |
| Surfaces / Neutrals | #f3f4f6, #e5e7eb, #fef2f2, #fff3e8 / #fff3eb | Skeleton loaders, light cards, input backgrounds |

**Color inconsistencies:** multiple primary-dark values; gradient stop only on checkout; red accents vary (#ff4444 vs #ef4444 vs #dc2626); amber set exists only on checkout; blue focus color defined in CSS but not in Tailwind config.

## Typography
| Element | Size / Weight | Sources / Notes |
| --- | --- | --- |
| Base font | Inter (400–900) | Imported on all key pages and admin: [public-site/index.html](public-site/index.html), [public-site/category.html](public-site/category.html), [public-site/product.html](public-site/product.html), [public-site/checkout.html](public-site/checkout.html), [public-site/thank-you.html](public-site/thank-you.html), [admin-site/index.html](admin-site/index.html) |
| Logo (SVG) | Poppins/Inter/Manrope fallback | Within SVG logo on checkout header |
| H1 storefront | 3xl–6xl, bold/black | Category hero `text-4xl md:text-6xl`, product title `text-4xl md:text-5xl`, thank-you `text-3xl sm:text-5xl`, checkout `text-2xl md:text-4xl` |
| H2/H3 storefront | lg–2xl, bold | Section titles and cards use `text-lg`–`text-2xl` with `font-bold` |
| Body | text-base / text-lg | Default copy and descriptions across storefront; admin uses text-sm/base |
| Small / Meta | text-xs / text-sm | Helper labels, tooltips, breadcrumbs |

## Components Consistency
- **Buttons**
  - Product “Add to cart” (desktop) in [public-site/product.html](public-site/product.html) is large (`py-4 px-8`, `rounded-2xl`, shadow) but lacks an explicit background class; mobile sticky CTA uses a gradient `from-spicy to-flame` with strong shadow and rounded-2xl.
  - Checkout “Підтвердити замовлення” uses `.btn-primary` gradient `#ff6b00 → #ff8533`, rounded-2xl, hover shadow in [public-site/checkout.html](public-site/checkout.html).
  - Admin primary buttons are flat `bg-spicy` solids with `rounded-lg`, lighter hover darkening (no gradients) in [admin-site/index.html](admin-site/index.html).
  - States/hover: storefront buttons use scale/translate animations; admin buttons rely on color change only.

- **Inputs**
  - Checkout: `border-2 border-gray-200`, `rounded-xl/2xl`, focus ring & shadow in orange (#ff6b00); labels are bold text-sm in [public-site/checkout.html](public-site/checkout.html).
  - Admin login and forms: `border` (1px), `rounded-lg`, focus ring `spicy`, labels text-sm in [admin-site/index.html](admin-site/index.html).
  - Focus outlines differ (checkout adds box-shadow; admin only ring), and border thickness/radius differ.

- **Cards**
  - Product detail/gallery cards: `rounded-2xl`, `border-gray-200`, shadow-lg, hover lift; grid splits 2 columns on md+ in [public-site/product.html](public-site/product.html).
  - Category product grid: cards filled via JS but wrapper grid uses `gap-3 md:gap-6` with hover shadow/lift defined in inline CSS in [public-site/category.html](public-site/category.html).
  - Checkout summary & form blocks: `rounded-2xl/3xl`, `shadow-sm`, white surfaces in [public-site/checkout.html](public-site/checkout.html).
  - Admin cards (e.g., merchandising, toasts): `rounded-lg/xl`, mixed background tints (orange-100, gray-50) with lighter shadows.

## Spacing & Grid
- Max widths vary: 7xl (category hero/grid), 6xl (product detail, checkout), 5xl (thank-you), ~full width for admin panels.
- Section padding: storefront commonly `px-4` with `py-12–20`; cards use `p-4/6`; gaps `gap-4–8` on grids.
- Product grids: 2 cols on mobile → 3/4 cols on md/lg via Tailwind (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`).
- Checkout layout: 3-column grid on lg with 2 columns for form, 1 for order summary; stacks vertically on mobile.

## Mobile vs Desktop
- Responsive typography: headings step down (e.g., thank-you `text-3xl` mobile → `text-5xl` desktop; category `text-4xl` → `text-6xl`).
- Layout shifts: product add-to-cart becomes sticky bottom bar on mobile; category filter drawer becomes bottom sheet with rounded top; checkout grids collapse to single column.
- Quantity/controls: opacity reveals on hover desktop but always visible on mobile (category/product).
- Padding tightens on mobile (`py-12` → `py-8`, `px-4` base) but font scales stay relatively large for CTAs (mobile buttons remain `py-4`, `text-lg`).

## Warning
- Primary palette drift: three different dark-orange values (#e55d00, #e55a00, #e55f00) and a unique gradient stop (#ff8533) only on checkout.
- Accent red drift: hearts use #ef4444, alerts use #dc2626, Tailwind config defines #ff4444 — not unified.
- Button style split: product mobile CTA uses gradient, desktop CTA lacks explicit background, checkout uses gradient, admin uses flat solid — interaction and radius differ.
- Input styling split: checkout uses 2px borders and rounded-2xl with box-shadow focus; admin uses 1px border, rounded-lg, ring only.
- Container widths vary (5xl/6xl/7xl) without a shared token; spacing/gaps differ per page.
- Tailwind config names differ per page (colors renamed per file), and checkout uses `tailwindcss.config` instead of `tailwind.config`, which may not apply as intended.

## Unified Vision (Recommended)
1. **Single Tailwind config** (shared CDN snippet or build):
   - `primary: #ff6b00`, `primary-dark: #e55f00`, `primary-light: #fff3e8`, `accent-red: #ff4444`, `danger: #dc2626`, `amber: #fbbf24`, `info: #3b82f6`, `surface: #ffffff`, `surface-muted: #f3f4f6`.
   - Export as CSS variables (`--color-primary`, etc.) for non-Tailwind contexts.
2. **Buttons:**
   - Primary: gradient `from-primary` → `to #ff8533`, `rounded-2xl`, `py-3.5 px-5`, shadow `0 10px 30px rgba(255,107,0,0.35)`, hover lift + 0.95 active scale. Apply to product CTAs (desktop+mobile), checkout submit, admin primary actions.
   - Secondary: `bg-white`, `border 1.5px primary-light`, `rounded-xl`, text `primary`, hover tint.
3. **Inputs:** unify to `border 1.5px #d6d6d6`, `rounded-1rem`, `focus: border primary + ring 2 rgba(255,107,0,0.2)`, label `text-sm font-medium text-gray-700`. Use for checkout and admin.
4. **Cards:**
   - Default card: `bg-white`, `rounded-2xl`, `shadow-md (0 12px 30px rgba(0,0,0,0.08))`, `border 1px #f0f0f0`, padding `24px`. Use for product tiles, checkout sections, admin panels.
   - Hover: `translateY(-4px)` and softer shadow for interactive cards.
5. **Typography scale:**
   - `h1: clamp(2.25rem, 3vw, 3.5rem) 800`, `h2: clamp(1.5rem, 2vw, 2.25rem) 700`, `body: 1rem 400`, `body-lg: 1.125rem 500`, `caption: 0.875rem 500`. Keep Inter as default; reserve Poppins only inside logo asset.
6. **Layout tokens:**
   - Container widths: `max-w-7xl` desktop, `max-w-6xl` for forms/detail pages, `max-w-5xl` for confirmation/thank-you. Base padding `px-4` mobile, `px-6` tablet, `px-10` desktop. Vertical rhythm `section: py-12 mobile / py-16 desktop`, grid gaps `gap-4 mobile / gap-6 desktop`.
7. **States & focus:** use shared focus outline `outline: 2px solid #3b82f6; outline-offset: 2px` (already in styles.css) plus `ring` tokens in Tailwind for consistency.
8. **Clean up per-page Tailwind configs:** consolidate to one palette import; remove duplicated `tailwind.config` blocks; fix checkout to use `tailwind.config` name; define `spicy` palette once.

With these tokens codified in a shared Tailwind/CSS file and applied to all pages, the storefront and admin can share identical primitives for color, radius, spacing, and interaction while keeping responsive behavior consistent.
