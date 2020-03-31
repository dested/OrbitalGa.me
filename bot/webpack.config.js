const webpack = require('webpack');
const fs = require('fs');
const path = require('path');

module.exports = env => {
  return {
    entry: './src/index.ts',
    output: {
      path: path.join(__dirname, 'dist'),
      filename: 'index.js',
      libraryTarget: 'commonjs2'
    },
    target: 'node',
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
      }
    },
    externals: {},
    mode: 'development',
    plugins: [
      // new webpack.IgnorePlugin(/uWebSockets/),
      // env === 'deploy' && new UglifyJsPlugin(),
    ].filter(a => a),
    module: {
      rules: [
        // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          options: {
            compilerOptions: {noEmit: false}
          }
        }
      ]
    }
  };
};
