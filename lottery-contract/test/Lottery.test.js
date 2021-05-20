const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3");
const { interface, bytecode } = require("../compile");

const web3 = new Web3(ganache.provider());

let lottery;
let accounts;

beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  const newContract = new web3.eth.Contract(JSON.parse(interface));
  lottery = await newContract.deploy({ data: bytecode }).send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery", () => {
  it("Contract deployed", () => {
    assert.ok(lottery.options.address);
  });

  it("allow one player", async () => {
    const account = accounts[0];
    await lottery.methods.enter().send({
      from: account,
      value: web3.utils.toWei("1", "ether"),
    });
    const players = await lottery.methods.getPlayers().call({
      from: account,
    });
    assert.strictEqual(players[0], account);
    assert.strictEqual(players.length, 1);
  });

  it("allow multiple players", async () => {
    const account0 = accounts[0];
    const account1 = accounts[1];
    const account2 = accounts[2];
    await lottery.methods.enter().send({
      from: account0,
      value: web3.utils.toWei("1", "ether"),
    });
    await lottery.methods.enter().send({
      from: account1,
      value: web3.utils.toWei("1", "ether"),
    });
    await lottery.methods.enter().send({
      from: account2,
      value: web3.utils.toWei("1", "ether"),
    });
    const players = await lottery.methods.getPlayers().call({
      from: account0,
    });
    assert.strictEqual(players[0], account0);
    assert.strictEqual(players[1], account1);
    assert.strictEqual(players[2], account2);
    assert.strictEqual(players.length, 3);
  });

  it("require a minimum amount of ether to enter", async () => {
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 200, // 200 wei
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("only manager can call pickWinner", async () => {
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1],
      });
      assert(false);
    } catch (error) {
      assert(error);
    }
  });

  it("send money to the Winner and reset players", async () => {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether"),
    });

    const initialBalance = await web3.eth.getBalance(accounts[0]);
    await lottery.methods.pickWinner().send({
      from: accounts[0],
    });
    const finalBalance = await web3.eth.getBalance(accounts[0]);
    const difference = finalBalance - initialBalance;
    console.log(difference);
    assert(difference > web3.utils.toWei("1.8", "ether"));
    const players = await lottery.methods.getPlayers().call();
    assert.strictEqual(players.length, 0);
  });
});
