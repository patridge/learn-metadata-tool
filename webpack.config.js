const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    "azdo-helpers": './src/azdo-helpers.js',
    "azure-devops-extension-popup": './src/azure-devops-extension-popup.js',
    "background": './src/background.js',
    "docs-extension-popup": './src/docs-extension-popup.js',
    "get-docs-metadata": './src/get-docs-metadata.js',
    "options": './src/options.ts',
    "/js/storage-helpers": './src/js/storage-helpers.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd' // Ensure compatibility with the browser environment
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/js/*.js', to: 'js/[name][ext]' },
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'images/learn-tool*.png', to: 'images/[name][ext]' },
        { from: '*.html', to: '[name].html' },
        { from: '*.css', to: '[name].css' },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
};