const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const Dotenv = require('dotenv-webpack')
const TerserPlugin = require('terser-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const getPlugins = () => {
  const plugins = [
    new Dotenv({
      path: `.env.${process.env.NODE_ENV}`
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
      inject: false
    }),
    new MiniCssExtractPlugin({
      filename: `./main.css`
    })
  ]
  return plugins
}

const getDevtool = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'eval-source-map'
  } else {
    return false
  }
}

module.exports = env => {
  let dropConsole = false
  if (env && env.dropConsole) {
    dropConsole = true
  }

  return {
    entry: './src/main.ts',
    // ファイルの出力設定
    output: {
      //  出力ファイルのディレクトリ名
      path: `${__dirname}/dist`,
      // 出力ファイル名
      filename: 'main.js'
    },
    module: {
      rules: [
        {
          // 拡張子 .ts もしくは .tsx の場合
          test: /\.tsx?$/,
          // TypeScript をコンパイルする
          use: ['ts-loader']
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: process.env.NODE_ENV === 'development',
                reloadAll: true
              }
            },
            'css-loader'
          ]
        }
      ]
    },
    // import 文で .ts や .tsx ファイルを解決するため
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.css', '.json']
    },
    plugins: getPlugins(),
    devtool: getDevtool(),
    // 開発サーバーの設定
    devServer: {
      contentBase: './dist',
      historyApiFallback: true,
      port: 8081
    },
    optimization: {
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: { drop_console: dropConsole }
          }
        })
      ]
    }
  }
}
