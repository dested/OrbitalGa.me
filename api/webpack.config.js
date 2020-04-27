const path = require('path');
const nodeExternals = require('webpack-node-externals');
const slsw = require('serverless-webpack');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChmodWebpackPlugin = require('chmod-webpack-plugin');

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
    minimize: false,
  },
  target: 'node',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    symlinks: false,
    alias: {
      '@common': path.resolve(__dirname, '..', 'common', 'src'),
    },
  },
  externals: [nodeExternals()],
  plugins: [
    new CopyWebpackPlugin(['./prisma/schema.prisma']),
    ...(slsw.lib.webpack.isLocal
      ? [
          /**
           * This is due to the fact the both TypeORM and TypeGraphQL is using a global variable for storage.
           * This is only needed in development.
           *
           * When the module that's been hot reloaded is requested, the decorators are executed again, and we get
           * new entries.
           *
           * @see https://github.com/typeorm/typeorm/blob/ba1798f29d5adca941cf9b70d8874f84efd44595/src/index.ts#L176-L180
           * @see https://github.com/MichalLytek/type-graphql/blob/1eb65b44ca70df1b253e45ee6081bf5838ebba37/src/metadata/getMetadataStorage.ts#L5
           */
          new webpack.BannerPlugin({
            entryOnly: true,
            banner: `
        delete global.TypeGraphQLMetadataStorage;
        delete global.typeormMetadataArgsStorage;
      `,
            raw: true,
          }),
        ]
      : []),
  ],
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
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader',
      },
    ],
  },
};
