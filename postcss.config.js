// postcss.config.js

module.exports = () => {
  return {
    plugins: {
      'postcss-preset-env': {
        autoprefixer: {
          flexbox: 'no-2009'
        },
        stage: 3
      },
      'postcss-normalize': {}
    }
  }
}
