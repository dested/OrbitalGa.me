const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: './console.ts',
  mode: 'development',
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
