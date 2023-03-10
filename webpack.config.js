//@ts-check
'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node', 

    entry: path.resolve(__dirname, 'src/extension.ts'),
    output: { 
        path: path.resolve(__dirname, 'pack'),
        filename: 'extension.js',
        libraryTarget: "commonjs2",
        devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: 'source-map',
    externals: {
        vscode: "commonjs vscode"
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        compilerOptions: {
                            "module": "es6" // override `tsconfig.json` so that TypeScript emits native JavaScript modules.
                        }
                    }
                }]
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            }
        ]
    },
}

const outputPath = path.resolve('./pack');

/**@type {import('webpack').Configuration}*/
const config2 = {
    target: 'node',

    entry: path.resolve(__dirname, 'src/language-server/main.ts'),
    output: {
		filename: 'language-server.js',
        path: outputPath
    },
    devtool: 'nosources-source-map',

    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: ['ts-loader']
            },
            {
                test: /\.js$/,
                use: ['source-map-loader'],
                enforce: 'pre'
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/]
};

module.exports =[config,config2] 

