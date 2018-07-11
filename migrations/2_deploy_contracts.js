const Proxy = artifacts.require('./Proxy.sol');
const LController = artifacts.require('./LockedController.sol');

const decimals = 18;
const supply = 10000000000000;

module.exports = async function(deployer) {
    // deploy proxy
    await deployer.deploy(Proxy);
    const proxy = await Proxy.deployed();
    // deploy controller
    await deployer.deploy(LController);
    const controller = await LController.deployed();
    // create binding of proxy with controller interface
    let parsec = LController.at(proxy.address);
    // use binding
    await parsec.initialize(controller.address, supply*(10**decimals));
    // check result
    let cap = await parsec.cap();
    console.log(cap.toNumber());
};
