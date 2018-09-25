/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const storage = require('./levelSandbox');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    console.log('Creating The Blockchain...');
    //if DB is empty add Genesis block
    this.getChainLength()
    .then(chainLen => {
        //Genesis block if chain length is 0
        if(chainLen == 0)
            this.addBlock(new Block("First block in the chain - Genesis block"));
    })
    .catch(error =>{
        console.log("Error - Can't create the blockchain ", error);
    });
  }

  // Add new block
  async addBlock(newBlock){
    let chainLen = await this.getChainLength();
    // Block height
    newBlock.height = chainLen;
    // UTC timestamp
    newBlock.time = new Date().getTime().toString().slice(0,-3);
    // previous block hash
    if(chainLen>0){
        let prevBlockHeight = chainLen - 1;
        storage.getLevelDBData(prevBlockHeight)
        .then(prevBlock => {
            newBlock.previousBlockHash = JSON.parse(prevBlock).hash;

            // Block hash with SHA256 using newBlock and converting to a string
            newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

            // Adding block object to chain
            storage.addDataToLevelDB(JSON.stringify(newBlock));
            console.log("Finish adding the new block");
        })
        .catch(error =>{
            console.log("Error - Retrieving prev block ", error);
        });
    }
    else{
        // Block hash with SHA256 using newBlock and converting to a string
         newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

         // Adding block object to chain
         storage.addDataToLevelDB(JSON.stringify(newBlock));
         console.log("Finish adding the Genesis block");
    }

    return newBlock.height
  }

  // Get a promise for block height
  async getChainLength(){
    let chainLen = await storage.getDBLength();
    return chainLen;
  }

  // Get block height
  async getBlockHeight() {
    let chainLen = await this.getChainLength();
    console.log(chainLen-1);
    return chainLen-1;
  }

  // Get block
  async getBlock(blockHeight){
    let block = await storage.getLevelDBData(blockHeight);
    console.log(JSON.parse(block));
    return JSON.parse(block);
  }

  // Get block by hash
  async getBlockByHash(hash){
    let block = await storage.getLevelDBDataByHash(hash);
    console.log(JSON.parse(block));
    return JSON.parse(block);
  }

  // GEt blocks by address
  async getBlocksByAddress(address){
    let blocks = await storage.getLevelDBDataByAddress(address);
    //console.log(JSON.parse(blocks));
    return blocks;
  }

  // Validate block
  async validateBlock(blockHeight){
    try{
        let block = await this.getBlock(blockHeight);
        // get block hash
        let blockHash = block.hash;
        // remove block hash to test block integrity
        block.hash = '';
        // generate block hash
        let validBlockHash = SHA256(JSON.stringify(block)).toString();
        // Compare
        if (blockHash===validBlockHash) {
            console.log("Valid");
            return true;
        }
        else {
            console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
            console.log("Invalid");
            return false;
        }
    } catch(error){
        console.log('Block #'+blockHeight);
        console.log("Invalid");
        return false;
    }

  }

  // Validate blockchain
  async validateChain(){
    let errorLog = []
    let chainLen = await this.getChainLength();
    for(let i=0; i<chainLen-1; i++){
        try{
            // Validate block i
            let blockValid = await this.validateBlock(i);
            if(!blockValid){
                errorLog.push(i);
            }
        } catch(error){
            errorLog.push(i);
        }

        try{
            //validate i,i+1 chain
            let blockI = await storage.getLevelDBData(i);
            let blockJ = await storage.getLevelDBData(i+1);
            let blockHash = JSON.parse(blockI).hash;
            let previousHash = JSON.parse(blockJ).previousBlockHash;
            if (blockHash!==previousHash) {
                errorLog.push(i);
            }
        } catch(error){
            errorLog.push(i);
        }
    }

    // Validate last block
    let blockValid = await this.validateBlock(chainLen - 1);
    if(!blockValid)
        errorLog.push(i);

    // Log the errors
    if (errorLog.length>0) {
        console.log('Block errors = ' + errorLog.length);
        console.log('Blocks: '+errorLog);
    }
    else {
        console.log('No errors detected');
    }
 }

}

module.exports = { Blockchain, Block };
