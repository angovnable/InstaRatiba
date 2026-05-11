# PWA Icons — InstaRatiba

## Required icon files (place in this folder)

| File                          | Size        | Purpose                                  |
|-------------------------------|-------------|------------------------------------------|
| `pwa-64x64.png`               | 64×64 px    | Favicon fallback                         |
| `pwa-192x192.png`             | 192×192 px  | Android home screen, splash              |
| `pwa-512x512.png`             | 512×512 px  | Standard PWA icon                        |
| `pwa-512x512-maskable.png`    | 512×512 px  | Android adaptive icon (safe-zone design) |
| `apple-touch-icon.png`        | 180×180 px  | iOS Safari "Add to Home Screen"          |
| `shortcut-dashboard.png`      | 96×96 px    | Android long-press shortcut              |
| `shortcut-generate.png`       | 96×96 px    | Android long-press shortcut              |
| `shortcut-teachers.png`       | 96×96 px    | Android long-press shortcut              |

## Quick generation with vite-plugin-pwa's pwa-assets-generator

```bash
# Install the generator (dev dependency only)
npm install --save-dev @vite-pwa/assets-generator

# Add to package.json scripts:
# "generate-pwa-assets": "pwa-assets-generator"

# Create pwa-assets.config.ts:
cat > pwa-assets.config.ts << 'EOF'
import { defineConfig } from '@vite-pwa/assets-generator/config'
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: {
      sizes: [64, 192, 512],
      favicons: [[64, 'favicon.ico']],
    },
    maskable: { sizes: [512] },
    apple: { sizes: [180] },
  },
  images: ['public/favicon.svg'],
})
EOF

npm run generate-pwa-assets
```

## Manual (Figma / Adobe)

1. Export the InstaRatiba logo on a **#2E7D32** background at 1024×1024 px.
2. For the maskable icon, keep the logo within the **inner 80%** (safe zone) so it looks correct when cropped circular on Android.
3. Export at each size listed above using "Export Slices" or "Save for Web."
4. Place all PNGs in `public/icons/`.

## Maskable icon safe-zone rule

```
┌──────────────────────────────┐
│                              │  <- 10% padding each side
│   ┌──────────────────────┐   │
│   │                      │   │
│   │     LOGO LIVES HERE  │   │  <- 80% safe zone
│   │                      │   │
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```
