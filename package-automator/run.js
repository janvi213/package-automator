#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Get the directory of this script
const scriptDir = __dirname;

// Create a clean path for the index.js file
const indexPath = path.join(scriptDir, 'index.js');

// Log the paths
console.log('Script directory:', scriptDir);
console.log('Index path:', indexPath);

// Run the index.js script with the clean path
const child = spawn('node', [indexPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Override the REPO_PATHS to use a clean path
    REPO_PATHS: path.join(scriptDir, 'test-repo')
  }
});

child.on('close', (code) => {
  process.exit(code);
});

// Made with Bob
