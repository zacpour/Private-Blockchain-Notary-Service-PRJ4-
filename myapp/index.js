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

// Retruns if true if str contains only ASCII, false otherwise
function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}

// Returns the ascii equivalent of provided hex
function hex_to_ascii(hexStr)
 {
	var hex  = hexStr.toString();
	var str = '';
	for (var n = 0; n < hex.length; n += 2) {
		str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
	}
	return str;
 }

app.use(express.json());
// Post endpoint to send a request
app.post('/requestValidation', asyncMiddleware(async (req, res, next) => {
    if(req.body.hasOwnProperty('address') && req.body.address != ""){
        const address = req.body.address
        const ts = new Date().getTime().toString().slice(0,-3)

        // Update requestTimeStamp if there a new request or old request is expired
        if(!(address in mempool) || timeRemaining(mempool[address]['requestTimeStamp']) <= 0){
            // Store request's info in the mempool with updated timestamp
            mempool[address] = {
                "requestTimeStamp" : ts,
                "valid" : false
            }
        }

        // Prepare and return the response
        const message = address + ":" + mempool[address]['requestTimeStamp'] + ":" + "starRegistry"
        const resMsg = {
            "address": address,
            "requestTimeStamp": ts,
            "message": message,
            "validationWindow": timeRemaining(mempool[address]['requestTimeStamp'])
        }
        res.json(resMsg)
    }
    else{
        const resMsg = {
            "status": "Invalid Request"
        }
        res.json(resMsg)
    }

}));

// Post endpoint to validate a request
app.post('/message-signature/validate', asyncMiddleware(async (req, res, next) => {
    const address = req.body.address
    const signature = req.body.signature

    // Check if address exists in the mempool and within validation window
    if(address in mempool && timeRemaining(mempool[address]['requestTimeStamp']) > 0){
        const message = address + ":" + mempool[address]['requestTimeStamp'] + ":" + "starRegistry"

        // Validate signature and store in mempool
        const signValid = bitcoinMessage.verify(message, address, signature)
        mempool[address] = {
            "requestTimeStamp" : mempool[address]['requestTimeStamp'],
            "valid" :signValid
        }

        // Prepare and return the response
        const resMsg = {
            "registerStar": true,
            "status": {
              "address": address,
              "requestTimeStamp": mempool[address]['requestTimeStamp'],
              "message": message,
              "validationWindow": timeRemaining(mempool[address]['requestTimeStamp']),
              "messageSignature": signValid
            }
        }
        res.json(resMsg)
    }
    else{
        resMsg = {
            "registerStar": false,
            "status" : "Invalid Request"
        }
        res.json(resMsg)
    }

}));

// Post endpoint to register a start and create a new block
app.post('/block', asyncMiddleware(async (req, res, next) => {

    let dataInvalid = true;
    // Check for required parameters in the posted data
    if('address' in req.body && 'star' in req.body && 'dec' in req.body['star'] && 'ra' in req.body['star'] && 'story' in req.body['star']){
        const address = req.body['address']
        // Check for validity of the request
        if(address in mempool && timeRemaining(mempool[address]['requestTimeStamp']) > 0 && mempool[address]['valid']){
            // Convert story to Hex encoded Ascii string limited to 250 words/500 bytes
            const story = req.body['star']['story']
            if(Buffer.byteLength(story) <= 500 && isASCII(story)){
                let star = {}
                star["dec"] = req.body['star']['dec']
                star["ra"] = req.body['star']['ra']
                star["story"] = Buffer.from(story).toString('hex')
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
                    dataInvalid = true
                }
                else{
                    // Invalidate the entry in the mempool
                    delete mempool[address]

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

    if(dataInvalid){
        resMsg = {
            "status" : "Invalid Request"
        }
        res.json(resMsg)
    }
}));

// Get endpoint to retrieve the stars/blocks by height
app.get('/block/:blockHeight([0-9]+)', asyncMiddleware(async (req, res, next) => {
    const blockHeight =req.params.blockHeight
    const blockchainHeight = await blockchain.getBlockHeight()

    // Check of out of bound blocks
    if(blockHeight > blockchainHeight){
        resMsg = {
            "status" : "Invalid Block"
        }
        res.json(resMsg)
    }
    else{
        // Retreive the block
        let block = await blockchain.getBlock(req.params.blockHeight)

        // Add decoded story
        block["body"]["star"]["storyDecoded"] = hex_to_ascii(block["body"]["star"]["story"])

        res.json(block);
    }
}));

// Get endpoint to retrieve the stars/blocks by wallet address
app.get('/stars/address:address', asyncMiddleware(async (req, res, next) => {
    const address = req.params.address.slice(1)

    // TODO: Check the address has a valid format

    // Retreive the block
    const blocks = await blockchain.getBlocksByAddress(address)
    if(blocks === undefined){
        resMsg = {
            "status" : "Invalid Block"
        }
        res.json(resMsg)
    }
    else{
        // Add decoded story
        for(let i=0; i<blocks.length; i++)
            blocks[i]["body"]["star"]["storyDecoded"] = hex_to_ascii(blocks[i]["body"]["star"]["story"])

        res.json(blocks);
    }
}));

// Get endpoint to retrieve the stars/blocks by block hash
app.get('/stars/hash:hash', asyncMiddleware(async (req, res, next) => {
    const hash = req.params.hash.slice(1)
    // TODO: Check the hash has a valid format

    // Retreive the block
    const block = await blockchain.getBlockByHash(hash)
    if(block === undefined){
        resMsg = {
            "status" : "Invalid Block"
        }
        res.json(resMsg)
    }
    else{
        // Add decoded story
        block["body"]["star"]["storyDecoded"] = hex_to_ascii(block["body"]["star"]["story"])

        res.json(block);
    }
}));

app.listen(8000, function(){
    console.log('Example app listening on port 8000!')
})
