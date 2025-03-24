const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const cssTemplatePath = path.resolve(__dirname, '../src/main/views/webpack/css-template.njk');
const jsTemplatePath = path.resolve(__dirname, '../src/main/views/webpack/js-template.njk');

const cssWebPackPlugin = new HtmlWebpackPlugin({
  template: cssTemplatePath,
  publicPath: '/',
  filename: 'css.njk',
  inject: false,
});

const jsWebPackPlugin = new HtmlWebpackPlugin({
  template: jsTemplatePath,
  publicPath: '/',
  filename: 'js.njk',
  inject: false,
});

module.exports = {
  plugins: [cssWebPackPlugin, jsWebPackPlugin],
};
