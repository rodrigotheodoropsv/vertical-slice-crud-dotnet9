import fs from 'node:fs';
import path from 'node:path';

/**
 * Jest global setup.
 *
 * By default, pact cleanup runs only for consumer-focused test executions.
 * This prevents provider verification runs from deleting pact artifacts that
 * must already exist in the pacts directory.
 */
export default async function globalSetup(): Promise<void> {
  const cliArgs = process.argv.join(' ').toLowerCase();
  const forceCleanup = (process.env.CLEAN_PACTS_BEFORE_TESTS || '').toLowerCase() === 'true';
  const isConsumerRun = cliArgs.includes('consumer');

  if (!forceCleanup && !isConsumerRun) {
    return;
  }

  const pactsDir = path.join(__dirname, 'pacts');
  if (!fs.existsSync(pactsDir)) return;

  for (const file of fs.readdirSync(pactsDir)) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(pactsDir, file));
    }
  }
}
