const path = require('path');
const nodeExternals = require('webpack-node-externals');
const slsw = require('serverless-webpack');

module.exports = {
  entry: slsw.lib.entries,
  mode: 'production',
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    pathinfo: false,
  },
  optimization: {
    minimize: false
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    symlinks: false,
  },
  externals: [nodeExternals()],
  plugins: [],
  // devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          transpileOnly: true,
          compilerOptions: {noEmit: false},
        },
      },
    ],
  },
};
