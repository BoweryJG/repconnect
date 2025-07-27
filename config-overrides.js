module.exports = function override(config, env) {
  // TypeScript TS2590 errors have been fixed by replacing complex sx props with CSS classes
  // No workarounds needed anymore
  return config;
};
