'use strict';

const pkg = require('./package.json');
const webpack = require('webpack');
const banner = [
  `${pkg.name} - ${pkg.description}`,
  `@version v${pkg.version}`,
  `@link ${pkg.homepage}`,
  `@license ${pkg.license}`
].join("\n");

const inproduction = ('production' === process.env.NODE_ENV);

module.exports = {
  context: __dirname,
  devtool: inproduction ? false : 'source-map',
  entry: {
    background: './src/js/apps/background.js',
    contentscript: './src/js/apps/contentscript.js',
    popup: './src/js/apps/popup.js'
  },
  output: {
    path: __dirname + '/dist',
    filename: 'js/bundle.[name].min.js',
    sourceMapFilename: 'js/bundle.[name].min.js.map'
  },
  eslint: {
    configFile: './.eslintrc'
  },
  resolve: {
    extensions: ['', '.js', '.json'],
    modulesDirectories: [
      'src/js',
      'node_modules'
    ]
  },
  module: {
    preLoaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'eslint'
      }
    ],
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015', 'react'],
          plugins: [
            'transform-class-properties',
            'transform-react-jsx'
          ]
        }
      },
    ]
  },
  plugins: [
    new webpack.BannerPlugin(banner),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      },
      __BUILD_DATE_AT__: JSON.stringify(new Date().toString())
    }),
    new webpack.optimize.UglifyJsPlugin({
      preserveComments: 'some',
      compress: {
        warnings: false
      }
    }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin()
  ]
};
