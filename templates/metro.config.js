// Bare React Native. For Expo, use metro.config.expo.js instead (rename it to metro.config.js).
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config')
const {withRozenite} = require('@rozenite/metro')

const defaultConfig = getDefaultConfig(__dirname)
const {assetExts, sourceExts} = defaultConfig.resolver

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  transformer: {
    // SVGs are imported as React components (colours via .svgrrc)
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native')
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg']
  }
}

// Rozenite discovers every installed @rozenite/* plugin and serves it in React Native DevTools
module.exports = withRozenite(mergeConfig(defaultConfig, config))
