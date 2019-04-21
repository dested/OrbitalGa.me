const path = require("path");

module.exports = {
    entry: './app/index.tsx',
    output: {
        filename: './dist/bundle.js'
    },
    devtool: 'source-map',
    resolve: {
        // Add `.ts` and `.tsx` as a resolvable extension.
        extensions: ['.ts', '.tsx', '.js'], // note if using webpack 1 you'd also need a '' in the array as well
        alias: {
            "@common": path.resolve(__dirname, "../common/")
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                    compilerOptions: {noEmit: false}
                }
            },
            {
                test: /\.less$/,
                loader: 'less-loader' // compiles Less to CSS
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
            {
                test: /\.(gif|svg|jpg|png)$/,
                loader: 'file-loader'
            }]
    }
};
