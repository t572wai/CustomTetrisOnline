const path = require('path');
const HtmlWebpackPlugin = require("html-webpack-plugin"); //installed via npm

module.exports = {
	mode: 'development',

	entry: {
		main:`./src/index.ts`,
		//general: './src/general.ts',
		//global: './src/global.ts',
		//gameOptions: './src/gameOptions.ts',
		//SwiperClass: './src/SwiperClass.ts',
		//const: './src/const.ts',
		//buttonAction: './src/buttonAction.ts',
		//sounds: './src/sounds.ts',
		//systems: './src/systems.ts',
		//display: './src/display.ts',
		//dialogs: './src/dialogs.ts',
		//init: './src/init.ts',
		//keyinput: './src/keyinput.ts',
		//tetriminos: './src/tetriminos.ts',
		//tetrisGameType: './src/tetrisGameType.ts',
		//tetrisKeyinput: './src/tetrisKeyinput.ts',
	},
	plugins: [new HtmlWebpackPlugin({ template: "./src/index.html" })],

	output: {
		filename: "main.js",
		path: path.join(__dirname, 'dist')
	},

	module: {
		rules: [
			{
				test: /(\.s[ac]ss)$/,
				use: [
					"style-loader",
					"css-loader",
					"postcss-loader",
					"sass-loader",
				]
			},
			{
				test: /\.ts$/,
				use: "ts-loader",
			}
		]
	},

	resolve: {
		extensions: [
			'.ts', '.js',
		]
	}
};
