const path = require('path');
const fs = require('fs');

// Print current working directory
console.log('Current working directory:', process.cwd());

// Try to read package.json in the test-repo directory
try {
  const packageJsonPath = path.join('./test-repo', 'package.json');
  console.log('Package.json path:', packageJsonPath);
  
  const exists = fs.existsSync(packageJsonPath);
  console.log('Package.json exists:', exists);
  
  if (exists) {
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    console.log('Package.json content:', content);
  }
} catch (error) {
  console.error('Error:', error);
}

// Made with Bob
