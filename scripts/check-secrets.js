const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scanAll = process.argv.includes('--all');

const allowedFiles = [
  /(^|\/)\.env\.example$/,
  /(^|\/)env-example-/,
  /(^|\/)\.env\.sample$/,
];

const binaryExtensions = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.docx',
  '.zip',
  '.gz',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.mp4',
  '.webm',
]);

const secretPatterns = [
  { name: 'AWS access key', regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  {
    name: 'GitHub token',
    regex: /\b(?:gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{22,255})\b/,
  },
  { name: 'Slack token', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: 'Stripe live key', regex: /\bsk_live_[0-9a-zA-Z]{24,}\b/ },
  {
    name: 'Private key block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/,
  },
  {
    name: 'JWT token',
    regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
  },
  {
    name: 'Connection string with password',
    regex:
      /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^:\s/]+:[^@\s]+@/i,
  },
];

const envSecretPattern =
  /^\s*(?:[A-Z0-9_]*(?:SECRET|PASSWORD|TOKEN|PRIVATE_KEY|CLIENT_SECRET|API_KEY)[A-Z0-9_]*)\s*=\s*(?!\s*$)(?!.*(?:\$\{|<|change[_-]?me|example|placeholder|your[_-]))(.{16,})\s*$/im;

const isEnvFile = (file) => path.basename(file).startsWith('.env');

const getFiles = () => {
  const args = scanAll
    ? ['ls-files']
    : ['diff', '--cached', '--name-only', '--diff-filter=ACM'];

  return execFileSync('git', args, { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
};

const files = getFiles().filter((file) => {
  if (allowedFiles.some((pattern) => pattern.test(file))) {
    return false;
  }

  if (binaryExtensions.has(path.extname(file).toLowerCase())) {
    return false;
  }

  return fs.existsSync(file);
});

const violations = [];

for (const file of files) {
  let content;

  try {
    content = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of secretPatterns) {
      if (pattern.regex.test(line)) {
        violations.push({
          file,
          line: index + 1,
          rule: pattern.name,
        });
      }
    }

    if (isEnvFile(file) && envSecretPattern.test(line)) {
      violations.push({
        file,
        line: index + 1,
        rule: 'Hardcoded secret in env file',
      });
    }
  });
}

if (violations.length > 0) {
  console.error('Secret scan failed. Remove the following values before committing:\n');

  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} (${violation.rule})`);
  }

  console.error(
    '\nUse environment variables or a secret manager instead of committing secrets.',
  );
  process.exit(1);
}

console.log(`Secret scan passed (${files.length} file(s) checked).`);
