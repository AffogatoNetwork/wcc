const WrappedCoffeeCoin = artifacts.require("WrappedCoffeeCoin");
const CoffeeHandler = artifacts.require("CoffeeHandler");

module.exports = function(deployer, network) {
	if (network == "development") {
		deployer.deploy(WrappedCoffeeCoin);
		deployer.deploy(CoffeeHandler);
	}
};
