const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    devtool: process.env.NODE_ENV === 'production' ? false : 'inline-source-map',
    context: __dirname,
    mode: process.env.NODE_ENV,
    entry: {
        background: './src/ts/app/background.ts',
        contentscript: './src/ts/app/contentscript.ts',
        popup: './src/ts/app/popup.tsx',
        'notify-close-tabs': './src/ts/app/notify-close-tabs.tsx',
    },
    output: {
        path: `${__dirname}/dist`,
        filename: '[name].js',
    },
    module: {
        rules: [
            {
                test: /\.scss/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                            sourceMap: true,
                            importLoaders: 2,
                        },
                    },
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    [
                                        'autoprefixer',
                                        {
                                            grid: true
                                        }
                                    ],
                                ],
                            },
                        },
                    },
                    {
                        loader: 'sass-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                ],
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [
            '.ts',
            '.tsx',
            '.js',
            '.jsx',
            '.json',
        ],
        alias: {
            '@': [`${__dirname}/src/ts/`, `${__dirname}/test/ts/`],
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/popup.html',
            filename: 'html/popup.html',
            chunks: ['popup'],
        }),
        new HtmlWebpackPlugin({
            template: './src/html/notify-close-tabs.html',
            filename: 'html/notify-close-tabs.html',
            chunks: ['notify-close-tabs'],
        }),
    ],
};
