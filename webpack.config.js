// webpack.config.js

const fs = require('fs')
const path = require('path')

const root = fs.realpathSync(process.cwd())
const resolve = dir => path.join(root, dir)

const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const WebpackBar = require('webpackbar')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const { HotModuleReplacementPlugin, BannerPlugin } = require('webpack')
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CompressionWebpackPlugin = require('compression-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const CssMinimizerWebpackPlugin = require('css-minimizer-webpack-plugin')

const env = process.env.NODE_ENV
const project = require(resolve('package.json'))

const getBabelConfig = require('./babel.config')
const getPostcssConfig = require('./postcss.config')

// get style loaders
const getStyleLoaders = (importLoaders, modules) => {
  return [
    env === 'development' && 'style-loader',
    env === 'production' && MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        importLoaders,
        modules
      }
    },
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: getPostcssConfig()
      }
    }
  ].filter(Boolean)
}

// get pre processor loaders
const getPreProcessorLoaders = preProcessor => {
  return [
    {
      loader: 'resolve-url-loader',
      options: {
        sourceMap: env === 'development',
        root: resolve('src')
      }
    },
    {
      loader: preProcessor,
      options: {
        sourceMap: true
      }
    }
  ]
}

// get asset loaders
const getAssetsLoaders = type => {
  return [
    {
      loader: 'url-loader',
      options: {
        limit: type === 'images' ? 10240 : undefined,
        name: '[name].[contenthash].[ext]',
        outputPath: type,
        esModule: false
      }
    }
  ]
}

// get html webpack plugin options
const getHtmlWebpackPluginOptions = options => {
  let { publicPath } = config.output
  if (publicPath.endsWith('/')) {
    publicPath = publicPath.slice(0, -1)
  }
  return Object.assign(
    {
      template: resolve('public/index.ejs'),
      templateParameters: {
        PUBLIC_URL: publicPath,
        DOCUMENT_TITLEL: project.name
      }
    },
    options
  )
}

// common config
const config = {
  mode: env,
  context: __dirname,
  entry: [resolve('src/index.tsx')],
  output: {
    publicPath: '/',
    path: resolve('dist'),
    filename: 'js/[name].[contenthash].js',
    hashSalt: project.name
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    alias: {
      '@': resolve('src')
    }
  },
  module: {
    rules: [
      {
        test: /\.(tsx?|js)$/,
        loader: 'babel-loader',
        options: {
          ...getBabelConfig(),
          cacheDirectory: true
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: getStyleLoaders(1, false)
      },
      {
        test: /\.module\.css$/,
        use: getStyleLoaders(1, true)
      },
      {
        test: /\.(scss|sass)$/,
        use: [
          ...getStyleLoaders(3, false),
          ...getPreProcessorLoaders('sass-loader')
        ]
      },
      {
        test: /\.module\.(scss|sass)$/,
        use: [
          ...getStyleLoaders(3, true),
          ...getPreProcessorLoaders('sass-loader')
        ]
      },
      {
        test: /\.(bmp|gif|jpe?g|png|avif|svg)$/,
        use: getAssetsLoaders('images')
      },
      {
        test: /\.(ttf|woff|woff2|eot|otf)$/,
        use: getAssetsLoaders('fonts')
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          globOptions: {
            ignore: ['index.html']
          },
          context: resolve('public'),
          from: '*',
          to: resolve('dist'),
          toType: 'dir'
        }
      ]
    }),
    new WebpackBar({
      name: project.name,
      color: '#61dafb' // react blue
    }),
    new FriendlyErrorsWebpackPlugin(),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: resolve('tsconfig.json')
      }
    })
  ]
}

// development mode
if (env === 'development') {
  config.entry.unshift('webpack-hot-middleware/client?reload=true&overlay=true')
  config.plugins.push(
    new HtmlWebpackPlugin(getHtmlWebpackPluginOptions()),
    new HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin()
  )
  Object.assign(config, {
    devtool: 'eval-source-map',
    stats: 'minimal'
  })
}

// production mode
if (env === 'production') {
  const year = new Date().getFullYear()
  config.plugins.push(
    new BannerPlugin({
      banner: `/** @license ${project.license} (c) ${year} ${project.author} */`,
      raw: true
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin(
      getHtmlWebpackPluginOptions({
        minify: {
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          collapseInlineTagWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          minifyCSS: true,
          minifyJS: true,
          minifyURLs: true,
          useShortDoctype: true
        }
      })
    ),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash].css',
      chunkFilename: 'css/[id].[contenthash].css',
      ignoreOrder: false
    }),
    new CompressionWebpackPlugin()
  )
  config.optimization = {
    minimizer: [
      new TerserWebpackPlugin({ extractComments: false }),
      new CssMinimizerWebpackPlugin()
    ]
  }
}

module.exports = config
