const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const devMode = process.env.NODE_ENV !== 'production';
const fileNameSuffix = devMode ? '-dev' : '.[contenthash]';
const filename = `[name]${fileNameSuffix}.css`;

const miniCss = new MiniCssExtractPlugin({
  filename,
  chunkFilename: '[id].css',
});

module.exports = {
  rules: [
    {
      test: /\.scss$/,
      use: [
        devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
        {
          loader: 'css-loader',
          options: {
            url: false,
            sourceMap: devMode,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            implementation: require('sass'),
            sourceMap: devMode,
          },
        },
      ],
    },
  ],
  plugins: [miniCss],
};
