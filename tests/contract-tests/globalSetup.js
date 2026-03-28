'use strict';

/**
 * Jest global setup — clears generated pact files before the consumer test
 * suite runs so that every run produces a clean, deduplicated pact file.
 */

const fs   = require('fs');
const path = require('path');

module.exports = async () => {
  const pactsDir = path.join(__dirname, 'pacts');
  if (!fs.existsSync(pactsDir)) return;

  for (const file of fs.readdirSync(pactsDir)) {
    if (file.endsWith('.json')) {
      fs.unlinkSync(path.join(pactsDir, file));
    }
  }
};
