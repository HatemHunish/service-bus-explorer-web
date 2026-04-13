#!/usr/bin/env bash
# Build script: prepares the API and web bundles for Electron packaging.
# Run from the repo root: bash apps/desktop/scripts/build.sh

set -e

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
DESKTOP="$ROOT/apps/desktop"
RESOURCES="$DESKTOP/resources"

echo "==> Cleaning previous resources..."
rm -rf "$RESOURCES/api" "$RESOURCES/web"

echo "==> Building shared package..."
pnpm --filter @service-bus-explorer/shared build

echo "==> Building API..."
pnpm --filter api build

echo "==> Building web (production)..."
pnpm --filter web build

echo "==> Deploying API to resources/ (production deps only)..."
pnpm --filter api deploy --prod "$RESOURCES/api"

echo "==> Copying compiled API dist..."
cp -r "$ROOT/apps/api/dist" "$RESOURCES/api/dist"

echo "==> Copying built web..."
cp -r "$ROOT/apps/web/dist" "$RESOURCES/web"

echo "==> Rebuilding native modules for Electron..."
cd "$RESOURCES/api"
npx @electron/rebuild -f -w better-sqlite3 \
  --version "$(node -e "const e=require('$DESKTOP/node_modules/electron'); console.log(require('$DESKTOP/node_modules/electron/package.json').version)")" \
  --module-dir "$RESOURCES/api"

echo "==> Building Electron main process..."
pnpm --filter @service-bus-explorer/desktop build

echo ""
echo "✓ Build complete. Run 'electron-builder' from apps/desktop/ to package."
