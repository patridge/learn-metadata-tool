import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const config: webpack.Configuration = {
  entry: {
    "azdo-helpers": './src/azdo-helpers.ts',
    "azure-devops-extension-popup": './src/azure-devops-extension-popup.ts',
    "background": './src/background.ts',
    "docs-extension-popup": './src/docs-extension-popup.ts',
    "get-docs-metadata": './src/get-docs-metadata.ts',
    "options": './src/options.ts',
    "/js/storage-helpers": './src/js/storage-helpers.ts',
  },
  output: {
    libraryTarget: 'umd', // Ensure compatibility with the browser environment
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true, // Clean the output directory before each build
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
  },
  performance: {
    assetFilter: function(assetFilename) {
      // Exclude Font Awesome JS from Webpack's performance warnings
      return !/font-awesome-all\.min\.js$/.test(assetFilename);
    }
  }
};

export default config;