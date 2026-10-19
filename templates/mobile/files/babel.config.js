// TODO(init): Bare only. Expo → presets: ['babel-preset-expo'] and drop module-resolver
// and the env plugin (Expo resolves tsconfig `paths` and inlines EXPO_PUBLIC_* natively).

module.exports = api => {
  const isTest = api.env('test')

  if (!isTest) {
    // Load .env.<variant> so transform-inline-environment-variables can inline values.
    // Metro caches transforms, so restart with --reset-cache after changing env files.
    try {
      process.loadEnvFile(`.env.${process.env.APP_VARIANT ?? 'dev'}`)
    } catch {
      // A missing file is reported by `pnpm env:validate`
    }
  }

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.ts', '.android.ts', '.ts', '.tsx', '.js', '.json'],
          alias: {
            '@app': './src',
            '@fixtures': './__fixtures__'
          }
        }
      ],
      // Tests read process.env at runtime from jest.env.js instead
      ...(isTest
        ? []
        : [
            [
              'transform-inline-environment-variables',
              {include: ['APP_VARIANT', 'API_BASE_URL', 'LOG_LEVEL']}
            ]
          ]),
      ['react-native-unistyles/plugin', {root: 'src'}],
      'react-native-worklets/plugin' // must stay last
    ]
  }
}
