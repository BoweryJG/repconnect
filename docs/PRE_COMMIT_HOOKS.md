# Pre-commit Hooks Setup

This project uses pre-commit hooks to maintain code quality and prevent common issues before they reach the repository.

## Overview

The following hooks are configured:

1. **ESLint** - Checks JavaScript/TypeScript code for errors and style violations
2. **Prettier** - Formats code consistently
3. **Secret Scanning** - Prevents accidental commit of credentials
4. **Commit Message Validation** - Ensures commit messages follow conventional format
5. **Test Running** - Runs tests for changed files before push

## Installation

The hooks are automatically installed when you run `npm install` due to the `prepare` script in package.json.

## Hook Details

### Pre-commit Hook

Runs on every commit and executes lint-staged, which:
- Runs ESLint with auto-fix on JS/TS files
- Formats files with Prettier
- Scans for potential secrets in changed files

### Commit-msg Hook

Validates commit messages against conventional commit format:
- Types allowed: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `security`
- Format: `<type>(<scope>): <subject>`
- Example: `feat(auth): add login functionality`

### Pre-push Hook

Runs tests for changed files before pushing to remote repository.

## Available Scripts

```bash
# Run linting
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting without changing files
npm run format:check

# Run tests for changed files
npm run test:changed
```

## Configuration Files

- `.husky/` - Husky hooks configuration
- `.lintstagedrc.json` - Lint-staged configuration
- `.commitlintrc.json` - Commit message validation rules
- `.eslintrc.json` - ESLint rules
- `.prettierrc.json` - Prettier formatting rules
- `.prettierignore` - Files to ignore for Prettier
- `scripts/check-secrets.js` - Secret scanning script

## Bypassing Hooks (Use with Caution)

If you need to bypass hooks in emergency situations:

```bash
# Bypass pre-commit hooks
git commit --no-verify -m "emergency fix"

# Bypass pre-push hooks
git push --no-verify
```

**Note:** Bypassing hooks should be avoided. They exist to maintain code quality.

## Troubleshooting

### Hooks not running

1. Ensure husky is installed: `npm install`
2. Check if hooks are executable: `ls -la .husky/`
3. Reinstall husky: `rm -rf .husky && npm install`

### ESLint/Prettier conflicts

The configuration uses `eslint-config-prettier` to disable ESLint rules that conflict with Prettier.

### Secret detection false positives

The secret scanner may flag legitimate code. If this happens:
1. Review the flagged content
2. If it's a false positive, consider:
   - Using environment variables
   - Adding pattern exceptions to `scripts/check-secrets.js`
   - Using placeholder values in code

## Best Practices

1. **Write meaningful commit messages** following the conventional format
2. **Fix linting errors** before committing rather than disabling rules
3. **Never commit secrets** - use environment variables instead
4. **Run tests locally** before pushing to catch issues early
5. **Keep dependencies updated** to get the latest security fixes