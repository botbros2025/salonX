module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Reanimated (and related worklets) requires its plugin to be added last.
    plugins: [
      'react-native-reanimated/plugin',
    ],
  };
};

