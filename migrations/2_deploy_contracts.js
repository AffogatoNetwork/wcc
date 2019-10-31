const WrappedCoffeeCoin = artifacts.require("WrappedCoffeeCoin");
const CoffeeHandler = artifacts.require("CoffeeHandler");
//For testing only
const DaiToken = artifacts.require("DaiToken");

module.exports = function(deployer, network) {
	if (network == "development") {
		deployer.deploy(WrappedCoffeeCoin);
		deployer.deploy(CoffeeHandler);
		deployer.deploy(DaiToken);
	}
};
