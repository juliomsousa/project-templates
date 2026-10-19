// Expo. Rename to metro.config.js (and delete the Bare version).
const {getDefaultConfig} = require('expo/metro-config')
const {withRozenite} = require('@rozenite/metro')

const config = getDefaultConfig(__dirname)
const {transformer, resolver} = config

config.transformer = {
  ...transformer,
  // The Expo entry keeps Expo's own transformer for non-SVG files
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo')
}

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg']
}

module.exports = withRozenite(config)
