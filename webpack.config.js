const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    azureDevOpsExtensionPopup: './src/azure-devops-extension-popup.js',
    docsExtensionPopup: './src/docs-extension-popup.js',
    azdoHelpers: './src/azdo-helpers.js',
    options: './src/options.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd' // Ensure compatibility with the browser environment
  },
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