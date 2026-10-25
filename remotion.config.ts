import {Config} from '@remotion/cli/config';
import fs from 'fs';

// Remotion normally downloads its own headless Chrome. In sandboxed environments
// without that download we point it at a locally installed headless shell.
const localShell =
  process.env.REMOTION_BROWSER_EXECUTABLE ??
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
if (fs.existsSync(localShell)) {
  Config.setBrowserExecutable(localShell);
}

// PNG frames keep the encode in standard (limited-range) yuv420p.
Config.setVideoImageFormat('png');
Config.setPixelFormat('yuv420p');
