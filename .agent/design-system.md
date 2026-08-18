# LexReport Design System

Complete frontend inventory and styling guide for AI agents. Prevents rebuilding existing components and ensures consistency.

---

## ⚠️ TL;DR - Most Common Violations (Fix These First!)

### ❌ NEVER Use These Patterns:
```tsx
// Hardcoded colors
bg-[#efeff2]           // ❌ Use design tokens
text-[#FF0000]         // ❌ Use design tokens

// Arbitrary spacing
gap-[8px]              // ❌ Use: gap-2
px-[24px] py-[16px]    // ❌ Use: px-6 py-4

// Arbitrary sizing
h-[36px]               // ❌ Use: h-9
h-[24px]               // ❌ Use: h-6

// Arbitrary borders
rounded-[8px]          // ❌ Use: rounded-lg
rounded-[12px]         // ❌ Use: rounded-xl
```

### ✅ Quick Reference - Correct Tokens:
- **Colors:** Use CSS variables from `globals.css` (e.g., `var(--color-g-600)`, `var(--color-paper)`)
- **Spacing:** Standard Tailwind scale (`gap-2`, `gap-3`, `px-6`, `py-4`)
- **Sizing:** Standard Tailwind scale (`h-6`, `h-9`, `size-4`)
- **Borders:** `rounded` (4px), `rounded-lg` (8px), `rounded-xl` (12px)

---

## Installation

- **Package manager:** npm (`package-lock.json` present)
- **UI framework:** Radix UI primitives
- **Styling:** Tailwind CSS v4 + CSS variables
- **State:** React hooks (useState, useReducer)
- **Data fetching:** TanStack React Query + Axios
- **Icons:** Lucide React

---

## Assets

- **Fonts:** Georgia (display), system sans-serif, monospace
- **Icons:** Lucide React (import directly from `lucide-react`)

---

## Color System

The project uses CSS custom properties defined in `app/globals.css`:

### Primary Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-ink` | `#0f1510` | Primary text |
| `--color-ink-2` | `#1e2b20` | Secondary text |
| `--color-body` | `#374039` | Body text |
| `--color-muted` | `#637068` | Muted text |
| `--color-faint` | `#8fa090` | Faint text |

### Background Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg` | `#f2efe9` | Page background |
| `--color-paper` | `#faf9f6` | Card/panel background |
| `--color-panel` | `#e9e6df` | Panel background |
| `--color-line` | `#d8d5cd` | Borders |
| `--color-line-2` | `#c0bcb2` | Secondary borders |

### Green Scale (Primary Accent)
| Token | Value | Usage |
|-------|-------|-------|
| `--color-g-900` | `#0a1810` | Dark green |
| `--color-g-800` | `#0e2418` | Button primary |
| `--color-g-700` | `#133220` | Hover states |
| `--color-g-600` | `#1a4a2e` | Links, active states |
| `--color-g-500` | `#226040` | Icons |
| `--color-g-400` | `#2d7c54` | Interactive elements |
| `--color-g-300` | `#44a070` | Lighter accent |
| `--color-g-200` | `#80c89e` | Light accent |
| `--color-g-100` | `#c0e4d0` | Very light accent |
| `--color-g-50` | `#e8f5ee` | Tinted backgrounds |

### Status Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-amber` | `#8a5e0e` | Warning text |
| `--color-amber-bg` | `#fef3e0` | Warning background |
| `--color-amber-bd` | `#e8d4a2` | Warning border |
| `--color-rose` | `#9a3244` | Error/danger text |
| `--color-rose-bg` | `#fdeef1` | Error background |
| `--color-rose-bd` | `#efc0ca` | Error border |
| `--color-blue` | `#1c5c9e` | Info text |
| `--color-blue-bg` | `#eaf2fd` | Info background |
| `--color-blue-bd` | `#b8d0f0` | Info border |

---

## Directory Guide

```
components/
├── Sidebar.tsx           # Main navigation sidebar
├── Topbar.tsx            # Top navigation bar
├── LandingPage.tsx       # Public landing page
├── LandingSections.tsx   # Landing page sections
├── Research.tsx          # Research page
├── ResearchFilters.tsx   # Research filter controls
├── JudgmentDetail.tsx    # Judgment detail view
├── JudgmentText.tsx      # Judgment text display
├── JudgmentFrontMatter.tsx # Judgment metadata
├── CaseEntry.tsx         # Case list item
├── CaseCitator.tsx       # Case citator view
├── CitationGraph.tsx     # Citation graph visualization
├── CitationGraphBackdrop.tsx # Graph backdrop
├── Digest.tsx            # Digest view
├── Dictionary.tsx        # Legal dictionary
├── Legislation.tsx       # Legislation view
├── Library.tsx           # Library view
├── Reports.tsx           # Reports view
├── ReportBatchDetail.tsx # Report batch detail
├── DraftStudio.tsx       # Draft studio
├── DraftStudioRedesign.tsx # Redesigned draft studio
├── Practice.tsx          # Practice area
├── Profile.tsx           # User profile
├── AuthShell.tsx         # Authentication shell
├── GlobalSearchPalette.tsx # Global search
├── SearchPagination.tsx  # Search pagination
├── SearchSyntaxHelp.tsx  # Search syntax help
├── SaveToFolderMenu.tsx  # Save to folder menu
├── ConfirmDialog.tsx     # Confirmation dialog
├── AsyncState.tsx        # Loading/error/empty states
├── AutoSizeInput.tsx     # Auto-sizing input
├── SecondarySources.tsx  # Secondary sources view
├── ai-chat/              # AI chat feature
│   ├── AIChatPanel.tsx
│   ├── ChatMessages.tsx
│   ├── ChatInput.tsx
│   ├── ChatHeader.tsx
│   ├── AIMessage.tsx
│   ├── UserMessage.tsx
│   ├── ContextBadge.tsx
│   ├── AIChatButton.tsx
│   └── SuggestedActions.tsx
└── admin/                # Admin components

lib/
├── api/                  # API client
│   ├── config.ts         # Environment config
│   ├── client.ts         # Fetch wrapper
│   ├── types.ts          # TypeScript types
│   ├── index.ts          # API methods
│   ├── hooks.ts          # React Query hooks
│   ├── auth.ts           # Authentication
│   ├── axios.ts          # Axios config
│   └── query-provider.tsx # Query provider
├── routes.ts             # Route definitions
├── utils.ts              # Utility functions
├── types.ts              # Shared types
├── judgment.ts           # Judgment utilities
├── judgment-markdown.ts  # Judgment markdown
├── download.ts           # Download utilities
├── useDismissable.ts     # Dismissable hook
├── useFocusTrap.ts       # Focus trap hook
├── useSidebarCollapse.ts # Sidebar collapse hook
└── search/               # Search utilities

hooks/
└── useAIChat.ts          # AI chat hook

app/
├── layout.tsx            # Root layout
├── page.tsx              # Home/landing page
├── globals.css           # Global styles
├── error.tsx             # Error boundary
├── not-found.tsx         # 404 page
├── icon.svg              # Favicon
├── styles/               # Additional styles
├── login/                # Login page
├── signup/               # Signup page
├── dashboard/            # Dashboard (auth required)
├── verify-email/         # Email verification
├── forgot-password/      # Password reset request
└── reset-password/       # Password reset

scripts/
├── smoke.mjs             # Smoke tests
├── interactions.mjs      # Interaction tests
├── audit-layout.mjs      # Layout audit
├── audit-shots.mjs       # Screenshot audit
└── generate-sample-report.py # Sample data generator
```

---

## Available Components

### Layout Components

**Sidebar** (`components/Sidebar.tsx`)
- Main navigation with collapsible rail mode
- Navigation items with icons
- User chip with avatar
- Coverage chip

**Topbar** (`components/Topbar.tsx`)
- Sticky top bar with date and title
- Action buttons
- Hamburger menu (mobile)

**AsyncState** (`components/AsyncState.tsx`)
- Renders loading, error, and empty branches
- Used by all data-fetching screens

### Data Display

**CaseEntry** (`components/CaseEntry.tsx`)
- Case list item with treatment pill
- Citation, ratio, metadata tags
- Action buttons (save, cite)

**JudgmentDetail** (`components/JudgmentDetail.tsx`)
- Full judgment view with tabs
- Header with court, title, citation
- Body with sections
- Aside with metadata

**Digest** (`components/Digest.tsx`)
- Collapsible case groups
- Case rows with titles

**CitationGraph** (`components/CitationGraph.tsx`)
- Node-based graph visualization
- Root node highlighting

### Forms

**SearchBar** (in `globals.css`)
- Input with search icon
- Filter pills
- Flexible layout

**Profile Fields** (in `Profile.tsx`)
- Editable input fields
- Validation states
- Label + input pattern

### Feedback

**Toast** (in `globals.css`)
- Fixed bottom-right notification
- Slide-up animation

**ConfirmDialog** (`components/ConfirmDialog.tsx`)
- Modal confirmation dialog

### Navigation

**GlobalSearchPalette** (`components/GlobalSearchPalette.tsx`)
- Keyboard-triggered search overlay

**SearchPagination** (`components/SearchPagination.tsx`)
- Page navigation for search results

---

## Styling Patterns

### Button Classes
```css
.btn              /* Base button */
.btn-primary      /* Dark green background */
.btn-secondary    /* Light background with border */
.btn-ghost        /* Transparent with border */
.btn-link         /* No border, green text */
.btn-sm           /* Smaller variant */
.btn-xs           /* Extra small variant */
```

### Card Pattern
```tsx
<div className="bg-[var(--color-paper)] border border-[var(--color-line)] rounded-[var(--radius)] p-4">
  {/* Content */}
</div>
```

### Treatment Pills
```css
.treatment-pill.followed     /* Green */
.treatment-pill.distinguished /* Blue */
.treatment-pill.neutral      /* Gray */
.treatment-pill.questioned   /* Amber */
.treatment-pill.overruled    /* Rose */
```

### Metric Tiles
```css
.metric-tile           /* Card container */
.metric-tile-label     /* Uppercase label */
.metric-tile-value     /* Large display value */
```

---

## Banned Classes

### ❌ NEVER Use

**Arbitrary Color Values:**
```tsx
// ❌ WRONG
<div className="text-[#FF0000] bg-[#14B8A6]" />

// ✅ CORRECT - Use CSS variables
<div className="text-[var(--color-rose)] bg-[var(--color-g-400)]" />
```

**Arbitrary Spacing:**
```tsx
// ❌ WRONG
<div className="min-w-[340px] p-[17px]" />

// ✅ CORRECT - Use Tailwind scale
<div className="min-w-80 p-4" />
```

**Inline Styles for Colors:**
```tsx
// ❌ WRONG
<div style={{ color: '#14B8A6' }} />

// ✅ CORRECT
<div className="text-[var(--color-g-400)]" />
```

**DIVs When Component Exists:**
```tsx
// ❌ WRONG
<button className="...">Click</button>

// ✅ CORRECT - Use btn classes
<button className="btn btn-primary">Click</button>
```

---

## Usage Examples

### Page Pattern
```tsx
<div className="page">
  <div className="page-header">
    <h2>Page Title</h2>
    <div>{/* Actions */}</div>
  </div>
  {/* Content */}
</div>
```

### Card Pattern
```tsx
<div className="insight-panel">
  <div className="insight-head">
    <h3>Title</h3>
  </div>
  {/* Content */}
</div>
```

### Button Pattern
```tsx
<button className="btn btn-primary">Primary Action</button>
<button className="btn btn-secondary">Secondary Action</button>
<button className="btn btn-ghost btn-sm">Small Ghost</button>
```

### Filter Pills
```tsx
<div className="filters">
  <button className="filter-pill active">All</button>
  <button className="filter-pill">Followed</button>
  <button className="filter-pill">Distinguished</button>
</div>
```

---

## Version Info

- **Last Updated:** 2026-08-18
- **Framework:** Next.js 15 App Router
- **Styling:** Tailwind CSS v4 + CSS variables
- **Components:** Custom components + Radix UI primitives
