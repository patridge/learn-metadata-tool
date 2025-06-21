const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    background: './src/background.js',
    // Currently using programmatically injected scripts for content and popup.
    // content: './src/content.ts',
    // popup: './src/pop-up.ts'
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