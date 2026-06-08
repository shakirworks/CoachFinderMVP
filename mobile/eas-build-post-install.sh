#!/usr/bin/env bash
set -euo pipefail

echo "Running expo prebuild for Android..."
npx expo prebuild --platform android --non-interactive
echo "Prebuild complete."
