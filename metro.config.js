const { getDefaultConfig } = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

// Aggiungiamo estensioni extra per evitare l'errore postinstall.mjs
defaultConfig.resolver.sourceExts.push('cjs');
defaultConfig.resolver.assetExts.push('mjs');

module.exports = defaultConfig;