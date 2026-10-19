// @ts-check
import nx from '@nx/eslint-plugin';

/**
 * Configuration for Angular templates: the Nx Angular template configuration (recommended and
 * accessibility rules) and additional template rules.
 *
 * Inline templates are linted as well, because the Angular configuration extracts them from
 * component files with angular-eslint's `processInlineTemplates` processor.
 *
 * @type {import('eslint').Linter.Config[]}
 */
const config = [
  .../** @type {import('eslint').Linter.Config[]} */ (nx.configs['flat/angular-template']),
  {
    name: '@atlasng/angular-template-rules',
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/attributes-order': [
        'error',
        {
          order: [
            'STRUCTURAL_DIRECTIVE',
            'ATTRIBUTE_BINDING',
            'INPUT_BINDING',
            'TWO_WAY_BINDING',
            'OUTPUT_BINDING',
            'TEMPLATE_REFERENCE',
          ],
        },
      ],
      '@angular-eslint/template/no-interpolation-in-attributes': 'error',
      '@angular-eslint/template/prefer-at-else': 'error',
      '@angular-eslint/template/prefer-at-empty': 'error',
      '@angular-eslint/template/prefer-class-binding': 'error',
      '@angular-eslint/template/prefer-contextual-for-variables': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      '@angular-eslint/template/prefer-static-string-properties': 'error',
      '@angular-eslint/template/prefer-template-literal': 'error',
    },
  },
];

export default config;
