'use strict';
const express = require('express');
let bodyParser = require('body-parser');
const path = require('path');
const { Gateway, Wallet, Wallets } = require('fabric-network');
const ConnectionProfile = require('./Net1Org1Connection.json');//require('./fabricConncectionProfile.json');
const WalletMigration = require('fabric-wallet-migration');
const cors = require('cors');
//const fs = require('fs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// a global variable that will be initiated when we log into Fabric first time on server start
let smartContract = null;
const smartContractName = 'CredsVerifyNet';

// --------- This Function connects to Fabric and retrieves the smart contract object
async function connectToFabric() {
    // --------------- MIGRATE the Fabric 1.4 version wallet to Fabric 2.0
    // ------------ the IBM blockchain VS Code extension only exported Fabric 1.4 wallet
    const walletStore = await WalletMigration.newFileSystemWalletStore(
        'fabricConnectionWallet/Org1'
    );
    const olderFabricVersionWallet = new Wallet(walletStore);

    const walletPath = path.join(
        process.cwd(),
        'fabricConnectionWallet/Org1/org1Admin'
    );
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identityLabels = await olderFabricVersionWallet.list();
    for (const label of identityLabels) {
        const identity = await olderFabricVersionWallet.get(label);
        if (identity) {
            await wallet.put(label, identity);
        }
    }

    // --------- Connect to Fabric with the gateway --------
    console.log('Going to connect to Gateway');
    const gateway = new Gateway();

    // Below code to be enabled when you move to IBM block chain extension 2.0
    /*
    const wallet = await Wallets.newFileSystemWallet('./fabricConnectionWallet/Org1');
    const connectionProfileJson = (await fs.promises.readFile('./fabricConnectionWallet/Net1Org1GatewayConnection.json')).toString();
    const ConnectionProfile = JSON.parse(connectionProfileJson);
*/


    await gateway.connect(ConnectionProfile, {
        wallet: wallet,
        identity: 'org1Admin',
        discovery: { enabled: true, asLocalhost: true },
    });

    // --------- Get the Channel we are interested in --------
    console.log('Going to connect to channel');
    const network = await gateway.getNetwork('mychannel');
    // --------- Get the smart contract we are interested in --------
    console.log('Going to retrieve the smart contract');
    const contract = network.getContract(smartContractName);

    return contract;
}

(async () => {
    smartContract = await connectToFabric();
    console.log('connected to fabric and retrieved a contract');
})();

app.get('/', (req, res) => {
    console.log('responding to a GET /');
    res.send('Hello World');
});

app.post('/submitTransactionToBlockChain', async (req, res) => {
    let nameOfTransaction = req.body.nameOfTransaction; //'proposeRepoTrade';//'getRepoTrade'

    // a comma separated string of arguments will be expected as input
    // let argsToBePassed = ['Org1MSP','Org2MSP','100000','ABC','10000','0.02','2020-12-16','2020-12-19'];//['repoTrade_1']
    let argsToBePassed = req.body.argsToBePassed.split('###|||');
    argsToBePassed.unshift(nameOfTransaction);

    try {
        console.log('submitting following request : ');
        console.log(argsToBePassed);
        const transactionSubmitResponse = await smartContract.submitTransaction(
            ...argsToBePassed
        );
        console.log(typeof transactionSubmitResponse);
        console.log(Object.keys(transactionSubmitResponse).length); //0 keys when no response data back
        if (Object.keys(transactionSubmitResponse).length > 0) {
            console.log(JSON.parse(transactionSubmitResponse.toString()));
            res.send(JSON.parse(transactionSubmitResponse.toString()));
        } else {
            console.log('Success but no JSON data back');
            res.sendStatus(200);
        }
    } catch (err) {
        console.error(err);
        // we are going to return a server error
        //res.send(err);
        res.sendStatus(500);
    }
});

app.listen(3001, () => {
    console.log('Server is up and running');
});

// you can send events from Node with class events or web-push. Server side events
// This can be used for monitoring blockchain events
