require('babel-register');
require('babel-polyfill');
require('dotenv/config');
const PrivateKeyProvider = require("truffle-privatekey-provider");

module.exports = {
	networks: {
		development: {
        host: "localhost",
	        port: 8545,
	        gasPrice: 10000000000,
	        gas: 5000000,
	        network_id: "*" // Match any network id
	    },
		kovan: {
			provider: process.env.KOVAN_PRIV ? new PrivateKeyProvider(process.env.KOVAN_PRIV, "https://kovan.infura.io") : "",
			gasPrice: 10000000000, // 10 gwei
			gas: 7000000,
			network_id: 4
		},
		mainnet: {
			provider: process.env.MAINNET_PRIV ? new PrivateKeyProvider(process.env.MAINNET_PRIV, "https://mainnet.infura.io/") : "",
			gasPrice: 12000000000, // 2 gwei
			network_id: "*"
		},
		coverage: {
			host: "localhost",
			network_id: "*",
			port: 8555,         // <-- If you change this, also set the port option in .solcover.js.
			gas: 0xfffffffffff, // <-- Use this high gas value
			gasPrice: 0x01      // <-- Use this low gas price
	    }
	}
};
