const fs = require('fs');
const solc = require('solc');
const Web3 = require('web3');
const web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));

const contractSource = fs.readFileSync('CryptoFiat.sol', 'utf8');

const output = solc.compile(contractSource);

if (output.errors) {
    output.errors.forEach(console.error);
    process.exit(1);
}

const contracts = output.contracts;

installContract(contracts[':CryptoFiat'], function (c) {
    installContract(contracts[':Data'], c.address, contractMined('Data'));
    installContract(contracts[':Accounts'], c.address, contractMined('Accounts'));
    installContract(contracts[':Approving'], c.address, contractMined('Approving'));
    installContract(contracts[':Reserve'], c.address, contractMined('Reserve'));
    installContract(contracts[':Enforcement'], c.address, contractMined('Enforcement'));
    installContract(contracts[':AccountRecovery'], c.address, contractMined('AccountRecovery'));
    installContract(contracts[':Delegation'], c.address, contractMined('Delegation'));
    contractMined('CryptoFiat')(c);
});

var contractMined = function (name) {
    return function (c) {
        console.log(name + " mined! Address: " + c.address);
    }
};

function installContract(contract, address, cb) {
    if (!cb && typeof address === 'function') {
        cb = address;
        address = undefined;
    }

    var Contract = web3.eth.contract(JSON.parse(contract.interface));

    web3.eth.getAccounts(function (e, accounts) {

        var primaryAccount = accounts[0];

        try {
            web3.personal.unlockAccount(primaryAccount, 'Parool123');
        } catch (e) {

        }

        var contractCreated = function (e, contract) {
            if (!e) {
                if (contract.address && cb) {
                    cb(contract);
                }
            } else {
                console.error(e);
            }
        };

        var contractParams = { from: primaryAccount, data: '0x' + contract.bytecode, gas: 50000000 };

        if (address) {
            Contract.new(address, contractParams, contractCreated);
        } else {
            Contract.new(contractParams, contractCreated);
        }

    });
}