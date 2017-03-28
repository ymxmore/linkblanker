'use strict';

const pkg = require('./package.json');
const webpack = require('webpack');
const banner = [
  `${pkg.name} - ${pkg.description}`,
  `@version v${pkg.version}`,
  `@link ${pkg.homepage}`,
  `@license ${pkg.license}`,
].join('\n');
const env = process.env.NODE_ENV || 'development';
const inproduction = (process.env.NODE_ENV === 'production');

module.exports = {
  context: __dirname,
  devtool: inproduction ? false : 'source-map',
  entry: {
    background: './src/js/apps/background.js',
    contentscript: './src/js/apps/contentscript.js',
    popup: './src/js/apps/popup.js',
  },
  output: {
    path: __dirname + '/dist',
    filename: 'js/bundle.[name].min.js',
    sourceMapFilename: 'js/bundle.[name].min.js.map',
  },
  resolve: {
    modules: [
      'src/js',
      'node_modules',
    ],
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['eslint-loader'],
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin(banner),
    new webpack.LoaderOptionsPlugin({
      test: /\.jsx?$/,
      options: {
        eslint: {
          configFile: './.eslintrc.yml',
        },
        babel: {
          presets: ['es2015', 'react'],
          plugins: [
            'transform-class-properties',
            'transform-react-jsx',
          ],
        },
      },
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(env),
      },
      '__BUILD_DATE_AT__': JSON.stringify(new Date().toString()),
    }),
    new webpack.optimize.UglifyJsPlugin({
      preserveComments: 'some',
      sourceMap: !inproduction,
      compress: {
        warnings: false,
      },
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.AggressiveMergingPlugin(),
  ],
};
