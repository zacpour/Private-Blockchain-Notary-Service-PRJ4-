const express = require('express')
const app = express()
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Import classes from simpleChain
const simpleChain = require('./simpleChain');
let blockchain = new simpleChain.Blockchain();

// Middleware to handle async function calls
const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

// Get endpoint to serve the blocks
app.get('/block/:blockHeight([0-9]+)', asyncMiddleware(async (req, res, next) => {
    blockHeight =req.params.blockHeight
    blockchainHeight = await blockchain.getBlockHeight()

    // Check of out of bound blocks
    if(blockHeight > blockchainHeight)
        res.send("Invalid Block");
    else{
        // Retreive the block
        const block = await blockchain.getBlock(req.params.blockHeight)
        res.json(block);
    }
}));

app.use(express.json());
// Post endpoint to create new blocks
app.post('/block', asyncMiddleware(async (req, res, next) => {
    const content = req.body.body

    // Check for invalid & empty blocks
    if(content === undefined || content === null || content === ""){
        console.log("Invalid pyaload")
        res.send("Invalid Payload");
    }
    else{
        // Create the new block
        let newBlock = new simpleChain.Block(content)
        let newBlockHeight  = await blockchain.addBlock(newBlock)
        console.log("New Block height " + newBlockHeight)

        // Retrieve the newly created block
        await delay(100);
        newBlockRet = await blockchain.getBlock(newBlockHeight)
        res.json(newBlockRet);
    }
}));

app.listen(8000, function(){
    console.log('Example app listening on port 8000!')
})
