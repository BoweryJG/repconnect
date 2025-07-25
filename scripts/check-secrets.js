#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(__filename);

// Patterns to detect potential secrets
const secretPatterns = [
  // API Keys
  /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?[a-zA-Z0-9]{20,}['"]?/gi,

  // ElevenLabs API Keys
  /sk_[a-zA-Z0-9]{40,}/g,

  // AWS
  /AKIA[0-9A-Z]{16}/g,
  /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?[a-zA-Z0-9/+=]{40}['"]?/gi,

  // OpenAI API Keys
  /sk-[a-zA-Z0-9]{20,}/g,

  // Generic tokens
  /(?:token|bearer)\s*[:=]\s*['"]?[a-zA-Z0-9._-]{20,}['"]?/gi,

  // Private keys
  /-----BEGIN\s+(?:RSA|DSA|EC|OPENSSH|PGP)\s+PRIVATE\s+KEY-----/g,

  // Database URLs with credentials
  /(?:postgresql|postgres|mysql|mongodb):\/\/[^:]+:[^@]+@[^/]+/gi,

  // Generic passwords
  /(?:password|passwd|pwd)\s*[:=]\s*['"]?(?!.*\$\{)[^\s'"]{8,}['"]?/gi,

  // Generic secrets
  /(?:secret|client[_-]?secret)\s*[:=]\s*['"]?[a-zA-Z0-9._-]{20,}['"]?/gi,
];

// Files to check (passed as arguments)
const filesToCheck = process.argv.slice(2);

let hasSecrets = false;

filesToCheck.forEach((filePath) => {
  // Skip certain file types and paths
  if (
    filePath.includes('node_modules') ||
    filePath.includes('.git') ||
    filePath.includes('build') ||
    filePath.includes('dist') ||
    filePath.endsWith('.lock') ||
    filePath.endsWith('.log') ||
    filePath.includes('.test.') ||
    filePath.includes('.spec.') ||
    filePath.includes('/__tests__/') ||
    filePath.includes('/__mocks__/')
  ) {
    return;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Skip commented lines
      if (
        line.trim().startsWith('//') ||
        line.trim().startsWith('#') ||
        line.trim().startsWith('*')
      ) {
        return;
      }

      secretPatterns.forEach((pattern) => {
        const matches = line.match(pattern);
        if (matches) {
          // Check for false positives (environment variables, placeholders)
          const isFalsePositive = matches.some(
            (match) =>
              match.includes('process.env') ||
              match.includes('${') ||
              match.includes('YOUR_') ||
              match.includes('REPLACE_') ||
              match.includes('example') ||
              match.includes('EXAMPLE') ||
              match.includes('test') ||
              match.includes('TEST') ||
              match.includes('dummy') ||
              match.includes('DUMMY') ||
              match.includes('xxx') ||
              match.includes('XXX') ||
              match.includes('sessionData.') ||
              match.includes('data.session.') ||
              match.includes('session.access_token') ||
              match.includes('session.refresh_token') ||
              match.includes('authHeader.substring') ||
              match.includes('Bearer ') ||
              line.includes('// Remove')
          );

          if (!isFalsePositive) {
            console.error(`\n⚠️  Potential secret found in ${filePath}:${index + 1}`);
            console.error(`   Line: ${line.trim()}`);
            console.error(`   Pattern: ${pattern.source}\n`);
            hasSecrets = true;
          }
        }
      });
    });
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
  }
});

if (hasSecrets) {
  console.error('\n❌ Secrets detected! Please remove them before committing.\n');
  console.error('Tips:');
  console.error('- Use environment variables for sensitive data');
  console.error('- Add sensitive files to .gitignore');
  console.error('- Use .env files for local configuration\n');
  process.exit(1);
} else {
  console.log('✅ No secrets detected in changed files'); // eslint-disable-line no-console
}
