const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');

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
    externals: [nodeExternals({whitelist: ['collisions']})],
    mode: 'development',
    plugins: [
      new webpack.DefinePlugin({'process.env.ENV': '"prod"'}),
      new CopyWebpackPlugin(['./schema.prisma']),
    ].filter((a) => a),
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
