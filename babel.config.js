// babel.config.js

module.exports = api => {
  api && api.cache(true)
  return {
    presets: [
      '@babel/preset-typescript',
      [
        '@babel/preset-env',
        {
          corejs: 3,
          modules: false,
          useBuiltIns: 'usage'
        }
      ]
    ],
    plugins: ['@babel/plugin-transform-runtime'],
    env: {
      development: {
        presets: [['@babel/preset-react', { development: true }]],
        plugins: ['react-refresh/babel']
      },
      production: {
        presets: ['@babel/preset-react'],
        plugins: [
          '@babel/plugin-transform-react-constant-elements',
          '@babel/plugin-transform-react-inline-elements'
        ]
      }
    }
  }
}
