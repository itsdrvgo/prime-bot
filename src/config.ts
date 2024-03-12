import { ColorResolvable } from "discord.js";

export default {
	dev: {
		id: "1234567890",
		secret: "1234567890",
		token: "1234567890",
		db: "mongodb+srv:/1234567890:1234567890@1234567890.1234567890.mongodb.net/1234567890?retryWrites=true&w=majority",
		logs: "1234567890",
		domain: "http://localhost",
		port: 8000,
	},
	prod: {
		id: "1234567890",
		secret: "1234567890",
		token: "1234567890",
		db: "mongodb+srv://1234567890:1234567890@1234567890.1234567890.mongodb.net/1234567890?retryWrites=true&w=majority",
		logs: "1234567890",
		domain: "https://xyz.com",
		port: 25016,
	},
	handlers: { commands: "./dist/commands", events: "./dist/events" },
	guilds: {
		dev: ["1234567890"],
		primary: "1234567890",
	},
	paypal: {
		dev: {
			id: "1234567890",
			secret: "1234567890",
			url: "https://api-m.sandbox.paypal.com",
			email: "sb-1234567890@business.example.com",
		},
		prod: {
			id: "1234567890",
			secret: "1234567890",
			url: "https://api-m.paypal.com",
			email: "1234567890@gmail.com",
		},
	},
	color: "Blue" as ColorResolvable,
	developers: ["1234567890"],
};
