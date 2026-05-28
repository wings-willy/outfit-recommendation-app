module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
          },
        },
      ],
      // reanimated v4에서 worklets 플러그인이 분리됨 — 반드시 마지막에 위치
      'react-native-worklets/plugin',
    ],
  };
};
