const path = require("path");

module.exports = {
  mode: "development",
  entry: "./src/renderer.js",
  target: "electron-renderer",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "renderer.bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
    ],
  },
  devtool: false, // Disable source maps in development
};
