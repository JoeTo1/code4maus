const defaultsDeep = require('lodash.defaultsdeep');
let path = require('path');
let webpack = require('webpack');

// Plugins
let CopyWebpackPlugin = require('copy-webpack-plugin');
let HtmlWebpackPlugin = require('html-webpack-plugin');
let UglifyJsPlugin = require('uglifyjs-webpack-plugin');
let Visualizer = require('webpack-visualizer-plugin');

// PostCss
let autoprefixer = require('autoprefixer');
let postcssVars = require('postcss-simple-vars');
let postcssImport = require('postcss-import');
let postcssMixins = require('postcss-mixins');

require('dotenv').config();
const bucketSuffix = process.env.BRANCH === 'production' ? 'prod' : 'staging';
const bucketUrl = `https://${process.env.S3_BUCKET_PREFIX}-${bucketSuffix}` +
    `.s3.dualstack.${process.env.FUNCTIONS_AWS_REGION || process.env.AWS_REGION}.amazonaws.com`;

const base = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        contentBase: path.resolve(__dirname, 'build'),
        host: '0.0.0.0',
        port: process.env.PORT || 8601,
        proxy: {
            '/api': {
                target: 'http://localhost:9000',
                pathRewrite: {
                    '^/api': '',
                },
            },
            '/data': {
                target: bucketUrl,
                changeOrigin: true,
                pathRewrite: {
                    '^/data': '',
                },
            },
        },
        historyApiFallback: true,
    },
    output: {
        library: 'GUI',
        filename: '[name].js',
    },
    externals: {
        React: 'react',
        ReactDOM: 'react-dom',
    },
    resolve: {
        symlinks: false,
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader',
                include: [ path.resolve(__dirname, 'src'), /node_modules[\\/](@wdr-data[\\/])?scratch-[^\\/]+[\\/]src/ ],
                options: {
                // Explicitly disable babelrc so we don't catch various config
                // in much lower dependencies.
                    babelrc: false,
                    plugins: [
                        'syntax-dynamic-import',
                        'transform-async-to-generator',
                        'transform-object-rest-spread',
                        [
                            'react-intl', {
                                messagesDir: './translations/messages/',
                            },
                        ],
                    ],
                    presets: [ [ 'env', { targets: { browsers: [ 'last 3 versions', 'Safari >= 8', 'iOS >= 8' ] } } ], 'react' ],
                },
            },
            {
                test: /\.css$/,
                use: [
                    {
                        loader: 'style-loader',
                    }, {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            importLoaders: 1,
                            localIdentName: '[name]_[local]_[hash:base64:5]',
                            camelCase: true,
                        },
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            ident: 'postcss',
                            plugins: function() {
                                return [
                                    postcssMixins,
                                    postcssImport,
                                    postcssVars,
                                    autoprefixer({
                                        browsers: [ 'last 3 versions', 'Safari >= 8', 'iOS >= 8' ],
                                    }),
                                ];
                            },
                        },
                    },
                ],
            },
            {
                test: /\.md$/,
                use: [
                    {
                        loader: 'babel-loader',
                    },
                    {
                        loader: 'react-markdown-loader',
                    },
                ],
            },
        ],
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                include: /\.min\.js$/,
            }),
        ],
    },
    plugins: [],
};

module.exports = [
    // to run editor examples
    defaultsDeep({}, base, {
        entry: {
            'lib.min': [ 'react', 'react-dom' ],
            'gui': './src/playground/index.jsx',
            'blocksonly': './src/playground/blocks-only.jsx',
            'compatibilitytesting': './src/playground/compatibility-testing.jsx',
            'player': './src/playground/player.jsx',
        },
        output: {
            path: path.resolve(__dirname, 'build'),
            filename: '[name].js',
            publicPath: '/',
        },
        externals: {
            React: 'react',
            ReactDOM: 'react-dom',
        },
        module: {
            rules: base.module.rules.concat([
                {
                    test: /\.(svg|png|wav|gif|jpg)$/,
                    loader: 'file-loader',
                    options: {
                        outputPath: 'static/assets/',
                    },
                },
            ]),
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                name: 'lib.min',
            },
            runtimeChunk: {
                name: 'lib.min',
            },
        },
        plugins: base.plugins.concat([
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': '"' + process.env.NODE_ENV + '"',
                'process.env.DEBUG': Boolean(process.env.DEBUG),
            }),
            new HtmlWebpackPlugin({
                chunks: [ 'lib.min', 'gui' ],
                template: 'src/playground/index.ejs',
                title: 'Programmieren mit der Maus',
                sentryConfig: process.env.SENTRY_CONFIG ? '"' + process.env.SENTRY_CONFIG + '"' : null,
            }),
            new HtmlWebpackPlugin({
                chunks: [ 'lib.min', 'blocksonly' ],
                template: 'src/playground/index.ejs',
                filename: 'blocks-only.html',
                title: 'Scratch 3.0 GUI: Blocks Only Example',
            }),
            new HtmlWebpackPlugin({
                chunks: [ 'lib.min', 'compatibilitytesting' ],
                template: 'src/playground/index.ejs',
                filename: 'compatibility-testing.html',
                title: 'Scratch 3.0 GUI: Compatibility Testing',
            }),
            new HtmlWebpackPlugin({
                chunks: [ 'lib.min', 'player' ],
                template: 'src/playground/index.ejs',
                filename: 'player.html',
                title: 'Scratch 3.0 GUI: Player Example',
            }),
            new CopyWebpackPlugin([
                {
                    from: 'assets/img/favicon.png',
                    to: '',
                },
            ]),
            new CopyWebpackPlugin([
                {
                    from: 'node_modules/@wdr-data/scratch-blocks/media',
                    to: 'static/blocks-media',
                }, {
                    from: 'assets/blocks-media',
                    to: 'static/blocks-media',
                },
            ]),
            new CopyWebpackPlugin([
                {
                    from: 'extensions/**',
                    to: 'static',
                    context: 'src/examples',
                },
            ]),
            new CopyWebpackPlugin([
                {
                    from: '_redirects',
                },
            ]),
            new CopyWebpackPlugin([
                {
                    from: 'edu/**/*',
                    context: 'src/lib/',
                },
            ]),
            new CopyWebpackPlugin([
                {
                    from: 'static',
                    to: 'static',
                }, {
                    from: 'assets/icons',
                    to: 'static/icons',
                },
            ]),
            new Visualizer({
                filename: 'statistics.html',
            }),
        ]),
    }),
].concat(
    process.env.NODE_ENV === 'production' ?
        // export as library
        defaultsDeep({}, base, {
            target: 'web',
            entry: {
                'scratch-gui': './src/index.js',
            },
            output: {
                libraryTarget: 'umd',
                path: path.resolve('dist'),
            },
            externals: {
                React: 'react',
                ReactDOM: 'react-dom',
            },
            module: {
                rules: base.module.rules.concat([
                    {
                        test: /\.(svg|png|wav|gif|jpg)$/,
                        loader: 'file-loader',
                        options: {
                            outputPath: 'static/assets/',
                            publicPath: '/static/assets/',
                        },
                    },
                ]),
            },
            plugins: base.plugins.concat([
                new CopyWebpackPlugin([
                    {
                        from: 'node_modules/scratch-blocks/media',
                        to: 'static/blocks-media',
                    }, {
                        from: 'assets/blocks-media',
                        to: 'static/blocks-media',
                    },
                ]),
            ]),
        }) : []
);
