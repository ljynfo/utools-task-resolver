// npm i && npm run build
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
module.exports = {
    mode: 'production',
    target: 'node',
    entry:  {
        'preload': './src/preload.js',
    },
    output: {
        filename: "[name].js",
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            // 启用多进程并发运行
            parallel: true,
            terserOptions: {
                mangle: false
            }
        })]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/img', to: 'img'},
                { from: 'src/plugin.json', to: ''},
                { from: 'src/utils', to: 'utils'}
            ],
        }),
    ],
    resolve: {
        extensions: ['.jsx', '.js'],
    },
}
