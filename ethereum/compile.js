const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

const contractPath = {
    'a.sol': path.resolve(__dirname, 'contracts', 'a.sol'),
    'b.sol': path.resolve(__dirname, 'contracts', 'b.sol'),
};

const source = {
    'a.sol': fs.readFileSync(contractPath['a.sol'],'utf8'),
    'b.sol': fs.readFileSync(contractPath['b.sol'], 'utf8'),
};

const outputs = solc.compile({sources: source}, 1).contracts;
console.log("error: ", solc.compile({sources: source}, 1).errors);

fs.ensureDirSync(buildPath);

for (let contract in outputs) {
    fs.outputJsonSync(
        path.resolve(buildPath, `${contract.split('.', 1)[0]}.json`),
        outputs[contract]
    );
    console.log('Successfully compiled: ', contract);
}