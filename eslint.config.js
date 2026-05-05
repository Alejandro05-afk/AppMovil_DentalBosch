// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      'react/no-children-prop': 'off',
    },
  },

  // FSD boundary: @shared — no imports de capas superiores
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@entities/*'], message: 'shared cannot import from entities' },
            { group: ['@features/*'], message: 'shared cannot import from features' },
            { group: ['@widgets/*'], message: 'shared cannot import from widgets' },
            { group: ['@pages/*'], message: 'shared cannot import from pages' },
            { group: ['../entities/*'], message: 'shared cannot import from entities' },
            { group: ['../features/*'], message: 'shared cannot import from features' },
            { group: ['../widgets/*'], message: 'shared cannot import from widgets' },
            { group: ['../pages/*'], message: 'shared cannot import from pages' },
          ],
        },
      ],
    },
  },

  // FSD boundary: @entities — solo importa de @shared
  {
    files: ['src/entities/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@features/*'], message: 'entities cannot import from features' },
            { group: ['@widgets/*'], message: 'entities cannot import from widgets' },
            { group: ['@pages/*'], message: 'entities cannot import from pages' },
            { group: ['../features/*'], message: 'entities cannot import from features' },
            { group: ['../widgets/*'], message: 'entities cannot import from widgets' },
            { group: ['../pages/*'], message: 'entities cannot import from pages' },
          ],
        },
      ],
    },
  },

  // FSD boundary: @features — importa de @shared + @entities
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@widgets/*'], message: 'features cannot import from widgets' },
            { group: ['@pages/*'], message: 'features cannot import from pages' },
            { group: ['../widgets/*'], message: 'features cannot import from widgets' },
            { group: ['../pages/*'], message: 'features cannot import from pages' },
          ],
        },
      ],
    },
  },

  // FSD boundary: @widgets — importa de @shared + @entities + @features
  {
    files: ['src/widgets/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@pages/*'], message: 'widgets cannot import from pages' },
            { group: ['../pages/*'], message: 'widgets cannot import from pages' },
          ],
        },
      ],
    },
  },

  // FSD boundary: app/ — solo re-exporta desde pages, no importa lógica de negocio
  // Excepción: layouts pueden importar @shared/ui/theme y @shared/ui para configuración visual
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@shared/api/*'], message: 'app should not import api directly, use @pages or @features' },
            { group: ['@entities/*'], message: 'app should import from @pages, not @entities directly' },
            { group: ['@features/*'], message: 'app should import from @pages, not @features directly' },
            { group: ['@widgets/*'], message: 'app should import from @pages, not @widgets directly' },
          ],
        },
      ],
    },
  },
]);
