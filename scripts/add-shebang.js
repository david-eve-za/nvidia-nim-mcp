import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Add shebang to the compiled index.js file
const indexPath = join(process.cwd(), 'dist', 'index.js');

// Wait for file to exist (up to 5 seconds)
let attempts = 0;
const maxAttempts = 50; // 5 seconds with 100ms intervals

function waitForFile() {
  if (existsSync(indexPath)) {
    const content = readFileSync(indexPath, 'utf8');
    if (!content.startsWith('#!/usr/bin/env node')) {
      writeFileSync(indexPath, '#!/usr/bin/env node\n' + content);
      console.log('Shebang added to dist/index.js');
    } else {
      console.log('Shebang already present in dist/index.js');
    }
  } else if (attempts < maxAttempts) {
    attempts++;
    setTimeout(waitForFile, 100);
  } else {
    console.error('dist/index.js not found after waiting');
    process.exit(1);
  }
}

waitForFile();