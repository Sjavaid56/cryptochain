const bodyParser = require('body-parser');
const express = require('express');
const request = require('request')
const path = require("path")
const Blockcahin = require('./blockchain');
const PubSub = require('./app/pubsub')
const TransactionPool =require('./wallet/transaction-pool')
const Wallet = require('./wallet')
const TransactionMiner = require('./app/transaction-miner')

const isDevelopment = process.env.ENV === 'development';

const REDIS_URL = isDevelopment ? 
'redis://127.0.0.1:6379':
'redis://h:pea8ef042eb6409dff28d94265b7ba0651139d1f65e0962ac10d0b5906822bc53@ec2-54-209-91-65.compute-1.amazonaws.com:11219'
const DEFUALT_PORT = 3000;
const ROOT_NODE_ADDRESS = ifDevelopment ?
`http://localhost:${DEFUALT_PORT}`:
'https://gentle-journey-67534.herokuapp.com'; 

const app = express()
const blockchain = new Blockcahin();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain, transactionPool, redisUrl: REDIS_URL})
const transactionMiner = new TransactionMiner({blockchain, transactionPool, wallet,pubsub})


app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'client/dist')))

  


app.get('/api/blocks', (req,res) => {
    res.json(blockchain.chain);
});

app.post("/api/mine", (req,res) => {
    const { data } = req.body;
    
    blockchain.addBlock({ data });

    pubsub.broadcastChain();


    res.redirect('/api/blocks');
});

app.post('/api/transact', (req,res) => {

    const {amount,recipient} = req.body

    let transaction = transactionPool.existingTransaction({  inputAddress: wallet.publicKey });

    try {
        if(transaction){
            transaction.update({ senderWallet: wallet, recipient, amount});
            
        } else { 
            transaction = wallet.createTransaction({
                recipient, 
                amount, 
                chain: blockchain.chain
            })
        }

    } catch(error){
     return  res.status(400).json({type: 'error', message: error.message});

    }
   
    transactionPool.setTransaction(transaction);
    

    pubsub.broadcastTransaction(transaction)

    res.json({type: 'success', transaction})

})

app.get('/api/transaction-pool-map', (req,res) => {
    res.json(transactionPool.transactionMap);

})

app.get('/api/mine-transactions', (req,res) => {
    transactionMiner.mineTransactions();

    res.redirect('/api/blocks');
})

app.get('/api/wallet-info', (req,res) => {
    const address = wallet.publicKey;
res.json({ 
    address,
    balance: Wallet.calculateBalance({chain: blockchain.chain, address: wallet.publicKey})
})
})

app.get('/api/known-addresses', (req, res) => {
    const addressMap = {};
  
    for (let block of blockchain.chain) {
      for (let transaction of block.data) {
        const recipient = Object.keys(transaction.outputMap);
  
        recipient.forEach(recipient => addressMap[recipient] = recipient);
      }
    }
  
    res.json(Object.keys(addressMap));
  });

app.get('*', (req,res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));

})

const syncWithRootState = () => {
    request({ url: `${ROOT_NODE_ADDRESS}/api/blocks` }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);
  
        console.log('replace chain on a sync with', rootChain);
        blockchain.replaceChain(rootChain);
      }
    });

    request({ url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          const rootTransactionPoolMap = JSON.parse(body);
    
          console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
          transactionPool.setMap(rootTransactionPoolMap);
        }
      });
    };
  
    if (isDevelopment) {

const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
  const transaction = wallet.createTransaction({
    recipient, amount, chain: blockchain.chain
  });

  transactionPool.setTransaction(transaction);
};

const walletAction = () => generateWalletTransaction({
  wallet, recipient: walletFoo.publicKey, amount: 5
});

const walletFooAction = () => generateWalletTransaction({
  wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
});

const walletBarAction = () => generateWalletTransaction({
  wallet: walletBar, recipient: wallet.publicKey, amount: 15
});

for (let i=0; i<10; i++) {
  if (i%3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i%3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  transactionMiner.mineTransactions();
}

}
let PEER_PORT;

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFUALT_PORT + Math.ceil(Math.random() * 1000)
}

const PORT = process.env.PORT || PEER_PORT || DEFUALT_PORT

app.listen(process.env.PORT, () => {console.log(`listening at localhoat:${PORT}`)
if(PORT !== DEFUALT_PORT){
    syncWithRootState();
} 
});


