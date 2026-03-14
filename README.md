# Naiper — Napier's Bones Calculator

An interactive web-based implementation of [Napier's Bones](https://en.wikipedia.org/wiki/Napier%27s_bones) — the 17th-century multiplication device invented by **John Napier**.

## Features

- 🦴 Interactive Napier's Bones grid with diagonal visualization
- ➗ Step-by-step working showing diagonal sums and carry propagation
- 🕑 Persistent calculation history (stored in `localStorage`)
- 📱 Responsive design — works on desktop and mobile

## Quick Start

### Open directly in a browser

```bash
# Just open the file — no build step needed
open index.html          # macOS
xdg-open index.html      # Linux
start index.html         # Windows
```

### Use Live Server in VS Code (recommended)

1. Install the **Live Server** extension:  
   `Ctrl+Shift+X` → search **"Live Server"** → Install
2. Open the project folder in VS Code (`File → Open Folder…`)
3. Right-click `index.html` → **"Open with Live Server"**  
   (or click **Go Live** in the bottom status bar)
4. The app opens at `http://127.0.0.1:5500`

> Any file you save is hot-reloaded automatically.

## How to Use

1. Enter a **multiplicand** (any positive integer, e.g. `425`)
2. Enter a **multiplier** (1 – 9999, e.g. `6`)
3. Click **Calculate** (or press Enter)

The app will display:
- The **Napier's Bones grid** with the matching row highlighted
- A **step-by-step diagonal addition** breakdown
- The final **result**
- An entry in the **History** panel

## Project Structure

```
Naiper/
├── index.html   # App shell & markup
├── style.css    # Styles (CSS variables, responsive)
├── script.js    # Calculator logic & DOM rendering
└── README.md    # This file
```

## How Napier's Bones Work

Each "bone" (rod) carries the multiples of a single digit split across a diagonal:

```
Digit 6 — rod:
┌────┐
│  6 │  ← digit header
├────┤
│  /6│  row 1  → 6
│1/2 │  row 2  → 12
│1/8 │  row 3  → 18
│ …  │
└────┘
```

To multiply `6 × 3`, you lay out the rod for 6 and read row 3 (= 18).  
For a multi-digit multiplicand like `425 × 6`, you lay out rods 4, 2, 5 and
add the diagonal columns of row 6 to obtain the product.

## License

MIT
