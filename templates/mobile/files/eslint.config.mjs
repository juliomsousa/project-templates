import {defineConfig, globalIgnores} from 'eslint/config'
// TODO(init): Expo → `import expoConfig from 'eslint-config-expo/flat.js'` and use it instead of reactNativeConfig
import reactNativeConfig from '@react-native/eslint-config/flat'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier/recommended'
import sonarjs from 'eslint-plugin-sonarjs'
import tseslint from 'typescript-eslint'

// Components that must always receive a testID (keeps E2E locators stable)
const TEST_ID_REQUIRED = ['PrimaryButton', 'SecondaryButton', 'Checkbox', 'RadioOption']

export default defineConfig([
  globalIgnores(['coverage', 'e2e', 'android', 'ios', 'src/services/http/schema.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactNativeConfig,
      importPlugin.flatConfigs.recommended,
      tseslint.configs.recommended,
      sonarjs.configs.recommended,
      prettierPlugin
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    settings: {
      'import/resolver': {typescript: {}}
    },
    rules: {
      'comma-dangle': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'no-console': 'error',
      'object-shorthand': 'error',
      'react/jsx-sort-props': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-boolean-value': 'error',
      'react/jsx-curly-brace-presence': 'error',
      'import/no-default-export': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal'],
          pathGroups: [
            {pattern: 'react', group: 'external', position: 'before'},
            {pattern: 'react-native', group: 'external', position: 'before'},
            {pattern: '@app/**', group: 'external', position: 'after'},
            {pattern: '@fixtures/**', group: 'external', position: 'after'}
          ],
          pathGroupsExcludedImportTypes: ['react'],
          alphabetize: {order: 'asc', caseInsensitive: true}
        }
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {name: 'axios', message: 'Use callApi from @app/services/http/httpClient.'},
            {name: 'date-fns', message: "Import the function subpath, e.g. 'date-fns/addDays' (Metro does not tree-shake)."}
          ],
          patterns: [
            {group: ['../../*'], message: 'Use the @app/* alias instead of deep relative imports.'}
          ]
        }
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXOpeningElement[name.name=/^(${TEST_ID_REQUIRED.join('|')})$/]:not(:has(JSXAttribute[name.name='testID']))`,
          message: 'This component requires a testID from @app/constants/locators.'
        }
      ],
      // Off: third-party edges make a hard ban impractical. Prefer `unknown` + narrowing (docs/03).
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', {fixStyle: 'inline-type-imports'}],
      'sonarjs/prefer-immediate-return': 'error',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/todo-tag': 'off'
    }
  },
  {
    // The HTTP layer is the only place allowed to touch axios directly
    files: ['src/services/http/**'],
    rules: {'no-restricted-imports': 'off'}
  },
  {
    // Files that a tool requires to default-export. TODO(init): add `app/**` for Expo Router
    files: ['*.config.{js,mjs,ts}', '**/*.d.ts'],
    rules: {'import/no-default-export': 'off'}
  }
])
