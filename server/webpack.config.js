const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = (env) => {
  return {
    entry: './src/index.ts',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'index.js',
      libraryTarget: 'commonjs2',
    },
    target: 'node',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@common': path.resolve(__dirname, '..', 'common', 'src'),
      },
    },
    externals: [nodeExternals({whitelist:['collisions']})],
    mode: 'development',
    plugins: [].filter((a) => a),
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            compilerOptions: {noEmit: false},
          },
        },
      ],
    },
  };
};
