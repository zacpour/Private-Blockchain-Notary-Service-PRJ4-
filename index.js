const express = require('express')
const app = express()
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Lib to validate message signature
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

// Import classes from simpleChain
const simpleChain = require('./simpleChain');
let blockchain = new simpleChain.Blockchain();

// Middleware to handle async function calls
const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

//Mempool
var mempool = {}
const validationWindow = 300

// Returns the amount of time remaining for the request to be valid
function timeRemaining(messageTimeStamp){
    const currentTimeStamp = new Date().getTime().toString().slice(0,-3)
    return validationWindow - (currentTimeStamp - messageTimeStamp)
}


app.use(express.json());
// Post endpoint to send a request
app.post('/requestValidation', asyncMiddleware(async (req, res, next) => {
    const address = req.body.address
    const ts = new Date().getTime().toString().slice(0,-3)
    const message = address + ":" + ts + "starRegistry"

    // Store request's info in the mempool
    mempool[address] = {
        "requestTimeStamp" : ts,
        "valid" : false
    }

    // Prepare and return the response
    const resMeg = {
        "address": address,
        "requestTimeStamp": ts,
        "message": message,
        "validationWindow": validationWindow
    }
    res.json(resMeg)
}));

// Post endpoint to validate a request
app.post('/message-signature/validate', asyncMiddleware(async (req, res, next) => {
    const address = req.body.address
    const signature = req.body.signature
    const message = address + ":" + mempool[address]['requestTimeStamp'] + "starRegistry"

    // Check if address exists in the mempool and within validation window
    if(address in mempool && timeRemaining(mempool[address]['requestTimeStamp']) > 0){
        // Validate signature and store in mempool
        const signValid = bitcoinMessage.verify(message, address, signature)
        mempool[address] = {
            "requestTimeStamp" : mempool[address]['requestTimeStamp'],
            "valid" :signValid
        }

        // Prepare and return the response
        const resMeg = {
            "registerStar": true,
            "status": {
              "address": address,
              "requestTimeStamp": mempool[address]['requestTimeStamp'],
              "message": message,
              "validationWindow": timeRemaining(mempool[address]['requestTimeStamp']),
              "messageSignature": signValid
            }
        }
        res.json(resMeg)
    }
    else
        res.send('Invalid Request')
}));

// Post endpoint to register a start and create a new block
app.post('/block', asyncMiddleware(async (req, res, next) => {

    let dataInvalid = true;
    console.log(req.body)
    // Check for required parameters in the posted data
    if('address' in req.body && 'star' in req.body && 'dec' in req.body['star'] && 'ra' in req.body['star'] && 'story' in req.body['star']){
        const address = req.body['address']
        console.log('1')
        // Check for validity of the request
        if(address in mempool && timeRemaining(mempool[address]['requestTimeStamp']) > 0 && mempool[address]['valid']){
            // Convert story to Hex encoded Ascii string limited to 250 words/500 bytes
            console.log('2')
            const story = Buffer.from(req.body['star']['story']).toString('hex')
            if(Buffer.byteLength(story) <= 500){
                console.log('3')
                let star = {}
                star["dec"] = req.body['star']['dec']
                star["ra"] = req.body['star']['ra']
                star["story"] = story
                if("mag" in req.body['star'])
                    star["mag"] = req.body['star']['mag']
                if("con" in req.body.star)
                    star["con"] = req.body['star']['con']

                // TODO:Check the format of star data (Not important since deviating from that format hurts the user)

                const content = {
                    "address" : req.body['address'],
                    "star" : star
                }

                // Check for invalid & empty blocks
                if(content === undefined || content === null || content === ""){
                    console.log('4')
                    dataInvalid = true
                }
                else{
                    // Create the new block
                    let newBlock = new simpleChain.Block(content)
                    let newBlockHeight  = await blockchain.addBlock(newBlock)
                    console.log("New Block height " + newBlockHeight)

                    // Retrieve the newly created block
                    await delay(100);
                    newBlockRet = await blockchain.getBlock(newBlockHeight)

                    dataInvalid = false
                    res.json(newBlockRet);
                }
            }
        }
    }
    console.log('6')
    if(dataInvalid)
        res.send("Invalid Payload");
}));


// Get endpoint to retrieve the stars/blocks by height
app.get('/block/:blockHeight([0-9]+)', asyncMiddleware(async (req, res, next) => {
    const blockHeight =req.params.blockHeight
    const blockchainHeight = await blockchain.getBlockHeight()

    // Check of out of bound blocks
    if(blockHeight > blockchainHeight)
        res.send("Invalid Block");
    else{
        // Retreive the block
        const block = await blockchain.getBlock(req.params.blockHeight)
        res.json(block);
    }
}));

// Get endpoint to retrieve the stars/blocks by wallet address
app.get('/stars/address:address', asyncMiddleware(async (req, res, next) => {
    const address = req.params.address.slice(1)

    // TODO: Check the address has a valid format

    // Retreive the block
    const blocks = await blockchain.getBlocksByAddress(address)
    if(blocks === undefined)
        res.send("Invalid Block")
    else
        res.json(blocks);
}));

// Get endpoint to retrieve the stars/blocks by block hash
app.get('/stars/hash:hash', asyncMiddleware(async (req, res, next) => {
    const hash = req.params.hash.slice(1)
    // TODO: Check the hash has a valid format

    // Retreive the block
    const block = await blockchain.getBlockByHash(hash)
    if(block === undefined)
        res.send("Invalid Block")
    else
        res.json(block);

}));

app.listen(8000, function(){
    console.log('Example app listening on port 8000!')
})
