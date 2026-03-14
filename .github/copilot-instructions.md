# Copilot Instructions for AX Expense Tracker

## Project Overview
AX is a Progressive Web App (PWA) for personal expense tracking. It allows users to quickly log daily expenses, auto-categorizes them, and provides summaries.

## Tech Stack
- Vanilla HTML, CSS, JavaScript (no frameworks)
- PWA with service worker for offline support
- localStorage for data persistence

## Code Conventions
- Use `'use strict'` in all JavaScript files
- Use vanilla ES5-compatible JavaScript for maximum browser support
- Follow BEM naming convention for CSS classes (e.g., `.expense__item`, `.header__title`)
- Use CSS custom properties for theming
- Keep all styles in `css/style.css`
- Keep all app logic in `js/app.js`
- Use Russian language for user-facing text
- Prefer glassmorphism design style with dark backgrounds

## File Structure
```
├── index.html          # Main app page
├── manifest.json       # PWA manifest
├── css/
│   └── style.css       # All styles
├── js/
│   ├── app.js          # Main app logic
│   └── sw.js           # Service worker
├── icons/              # App icons
└── README.md
```

## Testing
- No test framework is currently set up
- Test manually by opening `index.html` in a browser

## Important Notes
- All data is stored in localStorage under the key `ax_expenses`
- Expense categories are auto-detected from the description text
- The app must work offline after first load
