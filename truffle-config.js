const path = require("path");
require("dotenv").config(); // Store environment-specific variable from '.env' to process.env
var HDWalletProvider = require("truffle-hdwallet-provider");
require("ts-node/register");

const mnemonic = process.env.MNENOMIC;

module.exports = {
	// this is required by truffle to find any ts test files
	test_file_extension_regexp: /.*\.ts$/,
	compilers: {
		solc: {
			version: "0.5.12" // Fetch exact version from solc-bin (default: truffle's version)
		}
	},
	networks: {
		development: {
			host: "localhost",
			port: 8545,
			network_id: "*" // Match any network id
		},
		rinkeby: {
			// must be a thunk, otherwise truffle commands may hang in CI
			provider: () => new HDWalletProvider(mnemonic, process.env.RINKEBY_API_URL),
			network_id: "4", // Rinkeyby's id
			gas: 5500000, // Rinkeby has a lower block limit than mainnet
			confirmations: 2, // # of confs to wait between deployments. (default: 0)
			timeoutBlocks: 200 // # of blocks before a deployment times out  (minimum/default: 50)
		},
		ropsten: {
			// must be a thunk, otherwise truffle commands may hang in CI
			provider: () => new HDWalletProvider(mnemonic, process.env.ROPSTEN_API_URL),
			network_id: "3",
			skipDryRun: true
		}
	},
	plugins: ["truffle-security"]
};
