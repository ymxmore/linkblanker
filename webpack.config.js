/*
 * webpack.config.js
 */
const pkg = require('./package.json');
const webpack = require('webpack');
const banner = [
  `${pkg.name} - ${pkg.description}`,
  `@version v${pkg.version}`,
  `@link ${pkg.homepage}`,
  `@license ${pkg.license}`,
].join('\n');
const env = process.env.NODE_ENV || 'development';
const inproduction = (env === 'production');

module.exports = {
  context: __dirname,
  mode: env,
  devtool: inproduction ? false : 'source-map',
  performance: {
    hints: false,
  },
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
        loader: 'eslint-loader',
        options: {
          configFile: './.eslintrc.yml',
        },
      },
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['env', 'react'],
          plugins: [
            'transform-class-properties',
            'transform-react-jsx',
          ],
        },
      },
    ],
  },
  plugins: [
    new webpack.BannerPlugin(banner),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(env),
      },
      '__BUILD_DATE_AT__': JSON.stringify(new Date().toString()),
    }),
  ],
};
