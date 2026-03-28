import fs from 'node:fs';
import path from 'node:path';

/**
 * Jest global setup — clears generated pact files before the consumer test
 * suite runs so that every run produces a clean, deduplicated pact file.
 */
export default async function globalSetup(): Promise<void> {
  const pactsDir = path.join(__dirname, 'pacts');
  if (!fs.existsSync(pactsDir)) return;

  for (const file of fs.readdirSync(pactsDir)) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(pactsDir, file));
    }
  }
}
