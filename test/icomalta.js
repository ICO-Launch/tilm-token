import { increaseTimeTo, duration } from './helpers/increaseTime';
import latestTime from './helpers/latestTime';

const Proxy = artifacts.require('./Proxy.sol');
const Controller = artifacts.require('./LockedController.sol');
//const Controller2 = artifacts.require('./Controller2.sol');

//Use Chai.should for assertion
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const should = chai.should();
chai.use(chaiAsPromised);

const name = "Timelocked ILM token";
const symbol = "TILM";
const decimals = 18;
const initCap = 400000000;

const name2 = "COIN2";
const symbol2 = "COIN2";
const decimals2 = 16;
const initCap2 = 500000000;

contract('Proxy', (accounts) => {
    let proxy;
    let token;
    let controller;

    beforeEach(async () => {
        proxy = await Proxy.new();
        controller = await Controller.new();
        token = Controller.at(proxy.address);
    });

    describe('ILM token tests', function () {
        it('should be initializable through proxy', async () => {
        // initialize contract
        await token.initialize(controller.address, initCap);

        // check total supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 0);
        // check cap
        let cap = await token.cap();
        assert.equal(cap.toNumber(), initCap);
        // check wiring to proxy
        let del = await proxy.delegation();
        assert.equal(del, controller.address);
        // check wiring to proxy
        let addr = await token.thisAddr();
        assert.equal(addr, controller.address);
        });

        it('should not be initializable without proxy', async () => {
        // try to call initialize() without delegatecall
        controller.initialize(controller.address, initCap).should.be.rejectedWith('revert');
        });

        it('should allow to read params', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        assert.equal(await token.name(), name);
        });

        it('should mint a given amount of tokens to a given address', async function () {
        // initialize contract
        await token.initialize(controller.address, 100);
        // mint some tokens
        const result = await token.mint(accounts[0], 100);
        // validate balance
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0.toNumber(), 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        });

        it('should not allow to mint over the cap', async function () {
        // initialize contract
        await token.initialize(controller.address, 100);
        // fail while trying to mint more than cap
        await token.mint(accounts[0], 200).should.be.rejectedWith('revert');
        });

        it('should allow to update controller', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        // mint some tokens
        let result = await token.mint(accounts[0], 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        // deploy new controller
        let newController = await Controller.new();
        //Transfer delegation = upgrade controller
        await proxy.transferDelegation(newController.address);
        // check wiring
        let delegation = await proxy.delegation();
        assert.equal(delegation, newController.address);
        // mint some more tokens on top
        result = await token.mint(accounts[0], 100);
        // validate supply
        totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 200);
        });
        /*
        it('should allow to update controller to another with different logic', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        //check params
        assert.equal(await token.name(), name);
        assert.equal(await token.symbol(), symbol);
        assert.equal(await token.decimals(), decimals);
        // deploy new controller
        let newController = await Controller2.new();
        //Transfer delegation = upgrade controller
        await proxy.transferDelegation(newController.address);
        // check wiring
        let delegation = await proxy.delegation();
        assert.equal(delegation, newController.address);
        //check params
        assert.equal(await token.name(), name2);
        assert.equal(await token.symbol(), symbol2);
        assert.equal(await token.decimals(), decimals2);
        // mint some tokens
        let result = await token.mint(accounts[0], 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        });
        */
        it('check ownership transfer', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);

        let other = accounts[1];
        await token.transferOwnership(other);
        let owner = await token.owner();

        assert.isTrue(owner === other);
        });

        it('should prevent non-owners from transfering ownership', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        const other = accounts[2];
        const owner = await token.owner.call();
        assert.isTrue(owner !== other);
        await token.transferOwnership(other, { from: other }).should.be.rejectedWith('revert');
        });

        it('should prevent non-owners to mint', async function () {
        // initialize contract
        await token.initialize(controller.address, 100);
        //transfer ownership
        let other = accounts[1];
        await token.transferOwnership(other);
        let owner = await token.owner();
        assert.isTrue(owner !== accounts[0]);
        // fail while trying to mint
        await token.mint(accounts[0], 100).should.be.rejectedWith('revert');
        });

        it('should prevent non-owners to update controller', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        // mint some tokens
        let result = await token.mint(accounts[0], 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        // deploy new controller
        let newController = await Controller.new();
        //transfer ownership
        let other = accounts[1];
        await token.transferOwnership(other);
        let owner = await token.owner();
        assert.isTrue(owner !== accounts[0]);
        //Fail when trying to update delegation by the non-owner
        await proxy.transferDelegation(newController.address).should.be.rejectedWith('revert');
        });

        it('should mint a given amount of tokens to a given address after ownership transfer', async function () {
        // initialize contract
        await token.initialize(controller.address, 100);
        //transfer ownership
        let other = accounts[1];
        await token.transferOwnership(other);
        let owner = await token.owner();
        assert.isTrue(owner !== accounts[0]);
        // mint some tokens
        const result = await token.mint(accounts[0], 100, {from: other});
        // validate balance
        let balance0 = await token.balanceOf(accounts[0]);
        assert.equal(balance0.toNumber(), 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        });

        it('should allow to update controller after ownership transfer', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        // mint some tokens
        let result = await token.mint(accounts[0], 100);
        // validate supply
        let totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 100);
        //transfer ownership
        let other = accounts[1];
        await token.transferOwnership(other);
        let owner = await token.owner();
        assert.isTrue(owner !== accounts[0]);
        // deploy new controller
        let newController = await Controller.new({from: other});
        //Transfer delegation = upgrade controller
        await proxy.transferDelegation(newController.address,{from: other});
        // check wiring
        let delegation = await proxy.delegation();
        assert.equal(delegation, newController.address);
        // mint some more tokens on top
        result = await token.mint(accounts[0], 100, {from: other});
        // validate supply
        totalSupply = await token.totalSupply();
        assert.equal(totalSupply.toNumber(), 200);
        });

        it('should guard ownership against stuck state', async function () {
        // initialize contract
        await token.initialize(controller.address, 200);
        let originalOwner = await token.owner();
        await token.transferOwnership(null, { from: originalOwner }).should.be.rejectedWith('revert');
        });
    });

    describe('Lock checks', function () {
        it('locked tokens minting and balance check (only owner)', async function () {
            // initialize contract
            await token.initialize(controller.address, 1000);
            // mint some unlocked tokens
            await token.mint(accounts[0], 100);
            // mint some locked tokens
            await token.mintLockedBalance(accounts[0], 100, latestTime()+duration.hours(1));
            // check balances
            let lockedResult = await token.lockedBalanceOf(accounts[0]);
            assert.equal(lockedResult.toNumber(), 100);
            let unlockedResult = await token.unlockedBalanceOf(accounts[0]);
            assert.equal(unlockedResult.toNumber(), 100);
            // validate supply
            let totalSupply = await token.totalSupply();
            assert.equal(totalSupply.toNumber(), 200);
        });

        it('unlock all funds (only owner)', async function () {
          // initialize contract
          await token.initialize(controller.address, 1000);
          // mint some locked tokens
          await token.mintLockedBalance(accounts[0], 100, latestTime()+duration.hours(1));
          // check balances
          let lockedResult = await token.lockedBalanceOf(accounts[0]);
          assert.equal(lockedResult.toNumber(), 100);
          // unlock funds (only owner)
          await token.unlockAllFunds(accounts[0], {from: accounts[1]}).should.be.rejectedWith('revert');
          await token.unlockAllFunds(accounts[0]);
          // re-check balances
          lockedResult = await token.lockedBalanceOf(accounts[0]);
          assert.equal(lockedResult.toNumber(), 0);
        });

        it('balances consolidation', async function () {
          const unlockTime = latestTime()+duration.hours(1);
          // initialize contract
          await token.initialize(controller.address, 1000);
          // mint some locked tokens
          await token.mintLockedBalance(accounts[0], 100, unlockTime);
          // check balances
          let lockedResult = await token.lockedBalanceOf(accounts[0]);
          assert.equal(lockedResult.toNumber(), 100);
          // increase time
          await increaseTimeTo(unlockTime);
          // re-check balances
          lockedResult = await token.lockedBalanceOf(accounts[0]);
          assert.equal(lockedResult.toNumber(), 0);
          // check locked balances list
          let lockedBalancesLength = await token.lockedBalanceLength(accounts[0]);
          assert.equal(lockedBalancesLength,1);
          // consolidate
          await token.consolidateBalance(accounts[0]);
          // recheck locked balances list
          lockedBalancesLength = await token.lockedBalanceLength(accounts[0]);
          assert.equal(lockedBalancesLength,0);
        });

        it('unlocked tokens transfer', async function () {
          const unlockTime = latestTime()+duration.hours(1);
          // initialize contract
          await token.initialize(controller.address, 1000);
          // mint some locked tokens
          await token.mintLockedBalance(accounts[0], 100, unlockTime);
          // fail while trying to transfer
          await token.transfer(accounts[1],50).should.be.rejectedWith('revert');
          // increase time
          await increaseTimeTo(unlockTime);
          // succeed to transfer
          await token.transfer(accounts[1],50);
          // check balances
          let unlockedResult0 = await token.unlockedBalanceOf(accounts[0]);
          assert.equal(unlockedResult0.toNumber(), 50);
          let unlockedResult1 = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult1.toNumber(), 50);
          // allowance
          await token.approve(accounts[0],20,{from: accounts[1]});
          // transferFrom
          await token.transferFrom(accounts[1],accounts[0],20);
          // check balances
          unlockedResult0 = await token.unlockedBalanceOf(accounts[0]);
          assert.equal(unlockedResult0.toNumber(), 70);
          unlockedResult1 = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult1.toNumber(), 30);
        });

        it('transfer tokens and lock', async function () {
          const unlockTime = latestTime()+duration.hours(1);
          // initialize contract
          await token.initialize(controller.address, 1000);
          // mint some locked tokens
          await token.mint(accounts[0], 100);
          // transfer and lock
          await token.transferLockedFunds(accounts[1],50,unlockTime);
          // check balances
          let unlockedResult = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult.toNumber(), 0);
          let lockedResult = await token.lockedBalanceOf(accounts[1]);
          assert.equal(lockedResult.toNumber(), 50);
          // increase time
          await increaseTimeTo(unlockTime);
          // re-check balances
          unlockedResult = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult.toNumber(), 50);
          lockedResult = await token.lockedBalanceOf(accounts[1]);
          assert.equal(lockedResult.toNumber(), 0);
        });

        it('transfer tokens and lock (list)', async function () {
          const unlockTime1 = latestTime()+duration.hours(1);
          const unlockTime2 = latestTime()+duration.hours(2);
          // initialize contract
          await token.initialize(controller.address, 1000);
          // mint some locked tokens
          await token.mint(accounts[0], 100);
          // transfer and lock
          await token.transferListOfLockedFunds(accounts[1],[20,30],[unlockTime1,unlockTime2]);
          // check balances
          let unlockedResult = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult.toNumber(), 0);
          let lockedResult = await token.lockedBalanceOf(accounts[1]);
          assert.equal(lockedResult.toNumber(), 50);
          // increase time
          await increaseTimeTo(unlockTime1);
          // re-check balances
          unlockedResult = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult.toNumber(), 20);
          lockedResult = await token.lockedBalanceOf(accounts[1]);
          assert.equal(lockedResult.toNumber(), 30);
          // increase time
          await increaseTimeTo(unlockTime2);
          // re-check balances
          unlockedResult = await token.unlockedBalanceOf(accounts[1]);
          assert.equal(unlockedResult.toNumber(), 50);
          lockedResult = await token.lockedBalanceOf(accounts[1]);
          assert.equal(lockedResult.toNumber(), 0);
        });
    });
});
