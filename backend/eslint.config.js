// Se ejecuta desde la raíz del repo (ver "npm run lint" en backend/package.json):
//   backend/node_modules/.bin/eslint -c backend/eslint.config.js backend/src frontend/js
const js = require('@eslint/js');
const globals = require('globals');

// common.js se carga antes que el resto de scripts del frontend y deja estas
// funciones y constantes en el ámbito global de la página.
const sharedFromCommon = Object.fromEntries([
  'ICONS', 'icon', 'renderIcons', 'Session', 'requireAuth', 'apiFetch', 'doLogout', 'confirmLogout',
  'toast', 'escapeHtml', 'initials', 'fmtDate', 'fmtTime', 'fmtDateTime', 'fmtDuration', 'durationBetween',
  'countUp', 'setLoading', 'shake', 'refreshUserChip', 'RULES', 'openFormModal',
].map((name) => [name, 'readonly']));

// Librerías de frontend/vendor
const vendorGlobals = { QRCode: 'readonly', Html5Qrcode: 'readonly' };

const rules = {
  // Los errores de verdad: variables sin definir (p. ej. `require` en el navegador), etc.
  'no-unused-vars': ['warn', { args: 'after-used', argsIgnorePattern: '^(_|req|res|next)$', caughtErrors: 'none', ignoreRestSiblings: true }],
  'no-empty': ['error', { allowEmptyCatch: true }],
};

module.exports = [
  js.configs.recommended,
  {
    files: ['backend/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'commonjs', globals: { ...globals.node } },
    rules,
  },
  {
    files: ['frontend/js/**/*.js'],
    ignores: ['frontend/js/common.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, ...sharedFromCommon, ...vendorGlobals } },
    rules,
  },
  {
    files: ['frontend/js/common.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.browser, ...vendorGlobals } },
    // Aquí se definen las funciones globales: no hay que avisar de que no se usan dentro del propio archivo
    rules: { ...rules, 'no-unused-vars': 'off' },
  },
];
