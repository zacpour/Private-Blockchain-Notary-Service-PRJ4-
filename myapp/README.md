# Build a Private Blockchain Notary Service

Udacity's project #4

## Node.js framework

Express.js

## Endpoint documentation

### POST

#### Allow User Request
The Web API will allow users to submit their request using their wallet address.
URL: http://localhost:8000/requestValidation

Request parameters:
* Wallet Address

Sample request:
```
{
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
}
```

Sample response:
```
{
    "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
    "requestTimeStamp": "1532296090",
    "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
    "validationWindow": 300
}
```

#### Validate User Message Signature
After receiving the response, users will prove their blockchain identity by signing the received message from the previous endpoint with their wallet. Once they sign this message, the application will validate their request and grant access to register a star.
URL: http://localhost:8000/message-signature/validate

Request parameters:
* Wallet Address
* Message Signature

Sample request:
```
    {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
    }
```

Sample response:
```
    {
        "registerStar": true,
        "status": {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "requestTimeStamp": "1532296090",
            "message": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ:1532296090:starRegistry",
            "validationWindow": 193,
            "messageSignature": "valid"
        }
    }
```

#### Register a Star
Accept user requests and register a star.
URL: http://localhost:8000/block

Request parameters:
* Wallet address
* star object with following properties
* right_ascension (ra)
* declination (de)
* magnitude (mag) [optional]
* constellation (con) [optional]
* story [Hex encoded Ascii string limited to 250 words/500 bytes]

Sample request:
```
    {
        "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
        "star": {
            "dec": "-26° 29'\'' 24.9",
            "ra": "16h 29m 1.0s",
            "story": "Found star using https://www.google.com/sky/"
        }
    }
```

Sample response:
```
    {
        "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
        "height": 1,
        "body": {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "star": {
            "ra": "16h 29m 1.0s",
            "dec": "-26° 29' 24.9",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f"
            }
        },
        "time": "1532296234",
        "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
    }
```

### GET

#### Get Star By Height
endpoint that responds to a request using a URL path with a block height parameter or properly handles an error if the height parameter is out of bounds.
URL: http://localhost:8000/block/[HEIGHT]

Sample request:
```
    http://localhost:8000/block/1
```

Sample response:
```
    {
        "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
        "height": 1,
        "body": {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "star": {
            "ra": "16h 29m 1.0s",
            "dec": "-26° 29' 24.9",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
            }
        },
        "time": "1532296234",
        "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
    }
```

#### Get Star By Hash
Endpoint that responds to a request using a URL path with a star hash
URL: http://localhost:8000/stars/hash:[HASH]

Sample request:
```
    http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f
```

Sample response:
```
    {
        "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
        "height": 1,
        "body": {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "star": {
            "ra": "16h 29m 1.0s",
            "dec": "-26° 29' 24.9",
            "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
            "storyDecoded": "Found star using https://www.google.com/sky/"
            }
        },
        "time": "1532296234",
        "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
    }
```

#### Get an Array of Stars by Wallet Address
Endpoint that responds to a request using a URL path with a wallet address
URL: http://localhost:8000/stars/address:[ADDRESS]

Sample request:
```
    http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ
```

Sample response:
```
    [
        {
            "hash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f",
            "height": 1,
            "body": {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "star": {
                "ra": "16h 29m 1.0s",
                "dec": "-26° 29' 24.9",
                "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                "storyDecoded": "Found star using https://www.google.com/sky/"
            }
            },
            "time": "1532296234",
            "previousBlockHash": "49cce61ec3e6ae664514d5fa5722d86069cf981318fc303750ce66032d0acff3"
        },
        {
            "hash": "6ef99fc533b9725bf194c18bdf79065d64a971fa41b25f098ff4dff29ee531d0",
            "height": 2,
            "body": {
            "address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
            "star": {
                "ra": "17h 22m 13.1s",
                "dec": "-27° 14' 8.2",
                "story": "466f756e642073746172207573696e672068747470733a2f2f7777772e676f6f676c652e636f6d2f736b792f",
                "storyDecoded": "Found star using https://www.google.com/sky/"
            }
            },
            "time": "1532330848",
            "previousBlockHash": "a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"
        }
    ]
```

## Running the code

Install all the required js packages:
```
    npm install
```

Installing message verification packages:
```
    npm i --ignore-scripts bitcoinjs-lib
    npm i bitcoinjs-message
```

Run the code
```
    node index.js
```

## Running the tests

Request a message
```
    curl -X "POST" "http://localhost:8000/requestValidation" \
        -H 'Content-Type: application/json; charset=utf-8' \
        -d $'{
    "address": "REPLACE_WITH_YOUR_WALLET_ADDRESS"
    }'
```

Verify your signature
```
    curl -X "POST" "http://localhost:8000/message-signature/validate" \
        -H 'Content-Type: application/json; charset=utf-8' \
        -d $'{
    "address": "REPLACE_WITH_YOUR_WALLET_ADDRESS",
    "signature": "REPLACE_WITH_YOUR_SIGNATURE"
    }'
```

Register a star
```
    curl -X "POST" "http://localhost:8000/block" \
        -H 'Content-Type: application/json; charset=utf-8' \
        -d $'{
    "address": "REPLACE_WITH_YOUR_WALLET_ADDRESS",
    "star": {
        "dec": "-26° 29'\'' 24.9",
        "ra": "16h 29m 1.0s",
        "story": "Found star using https://www.google.com/sky/"
    }
    }'
```

Retrieve a star by height
```
    curl -i -H "Accept: application/json" "http://127.0.0.1:8000/block/0"
```

Retrieve a star by hash
```
    curl "http://localhost:8000/stars/hash:REPLACE_WITH_A_START_HASH"
```

Retrieve a list of starts by wallet address
```
    curl "http://localhost:8000/stars/address:REPLACE_WITH_YOUR_WALLET_ADDRESS"
```

## Extra test cases

Send an invalid signature
```
    Use the POST section above
```

Register a star without validation
```
    Use the POST section above
```

Send any of the first 3 post request outside of the 300sec period
```
    Use the POST section above
```

Retrieve a star by an invalid height
```
    curl -i -H "Accept: application/json" "http://127.0.0.1:8000/block/1000000"

    curl -i -H "Accept: application/json" "http://127.0.0.1:8000/block/test"
```

Retrieve a star by an invalid hash
```
    curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9n"
```

Retrieve a list of starts by a random wallet address
```
    curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3LpZ"
```

## Acknowledgments

* Using Async Await in Express with Node 9
(https://medium.com/@Abazhenov/using-async-await-in-express-with-node-8-b8af872c0016)

* JavaScript: Convert Hexadecimal to ASCII format
(https://www.w3resource.com/javascript-exercises/javascript-string-exercise-28.php)


```
PROJECT LICENSE

This project was submitted by Zac Mohsen Pour as part of the Nanodegree At Udacity.

As part of Udacity Honor code, your submissions must be your own work, hence
submitting this project as yours will cause you to break the Udacity Honor Code
and the suspension of your account.

Me, the author of the project, allow you to check the code as a reference, but if
you submit it, it's your own responsibility if you get expelled.

Copyright (c) 2018 Zac Mohsen Pour

Besides the above notice, the following license applies and this license notice
must be included in all works derived from this project.

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

