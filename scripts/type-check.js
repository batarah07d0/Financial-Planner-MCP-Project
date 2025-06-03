#!/usr/bin/env node

/**
 * Custom TypeScript type checking script
 * Mengatasi masalah Flow type annotations di dependencies
 */

const { execSync } = require('child_process');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Running TypeScript type check...');
console.log('📁 Project root:', projectRoot);

try {
  // Run TypeScript compiler dengan konfigurasi yang sudah dioptimasi
  const result = execSync(
    'npx tsc --noEmit --skipLibCheck --project tsconfig.json',
    {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    }
  );
  
  console.log('✅ TypeScript type check passed!');
  if (result.trim()) {
    console.log('📝 Output:', result);
  }
  
} catch (error) {
  console.error('❌ TypeScript type check failed:');
  
  // Filter out errors dari node_modules/react-native-tcp
  const output = error.stdout || error.message || '';
  const lines = output.split('\n');
  
  const filteredLines = lines.filter(line => {
    // Skip errors dari react-native-tcp (legacy)
    if (line.includes('node_modules/react-native-tcp')) {
      return false;
    }
    // Skip Flow type annotation errors (legacy)
    if (line.includes('Type annotations can only be used in TypeScript files')) {
      return false;
    }
    return true;
  });
  
  const filteredOutput = filteredLines.join('\n').trim();
  
  if (filteredOutput) {
    console.error(filteredOutput);
    process.exit(1);
  } else {
    console.log('✅ All remaining errors are from dependencies (ignored)');
  }
}
