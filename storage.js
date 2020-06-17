var http = require('http');
var urlparse = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var axios = require('axios');
const localUrl = "mongodb://localhost:27017/";
const onlineurl = "mongodb+srv://oroszlanolo:asdqwe123@storage-nuak1.mongodb.net/<Storage>?retryWrites=true&w=majority";
var url = onlineurl;
var validateUrl = "http://apollo.xannosz.cloud:8000/validate"
var token = "944a024a-f67b-4932-89f4-c89310c5f512-5538e688-ca86-4dd1-8aa7-56ee1858fd42-aa72af1a-a89f-40fa-baea-052ef65a538e-6ccd3a39-f1d8-4cb8-ab98-9194c4d490f8-643b6c8b-a236-498c-ad66-0ae73c12ba75-1927cb6a-521a-4230-bab5-accdd6295f6e-43ac1140-4074-4c51-af19-33f538969e12-aabffc7f-0b14-4913-abfd-e7e57fb34c0a-60bc55cb-b144-4939-a240-d0c40f4abe29";
const validating = false;
//create a server object:
http.createServer(function (req, res) {
    console.log(req);
    var parsed = urlparse.parse(req.url, true);
    var q = parsed.query;
    switch (parsed.pathname) {
        case "/getStorage":
            getStorage(res);
            break;
        case "/getComm":
            getComm(res, q);
            break;
        case "/getEmpty":
            getEmpty(res);
            break;
        case "/useComm":
            useComm(res, q);
            break;
        case "/refill":
            refill(res, q);
            break;
        default:
            res.writeHead(404, {
                'Content-Type': 'text/html'
            });
            res.write("404: Page not found");
    }
}).listen(8080);

function getComm(res, params) {
    console.log("requested commodity: " + params.name);
    validate().then(result => {
        if (result) {
            var query = {
                name: params.name
            };
            MongoClient.connect(url, function (err, db) {
                if (err) throw err;
                var dbo = db.db("Storage");
                dbo.collection("goods").find(query).toArray(function (err, result) {
                    if (err) throw err;

                    res.writeHead(200, {
                        'Content-Type': 'text/html'
                    });
                    res.write(JSON.stringify(result));

                    db.close();
                    return res.end();
                });
            });
        } else {
            res.writeHead(405, {
                'Content-Type': 'text/html'
            });
            res.write("Invalid user token, try to log in!");
            res.end();
        }
    });
}

function useComm(res, params) {
    console.log("requested commodity: " + params.name);
    var query = {
        name: params.name
    };
    var prevQuant;
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Storage");
        dbo.collection("goods").findOne(query, function (err, result) {
            if (err) throw err;
            prevQuant = result.quant;
            if (prevQuant < params.quant) {
                res.writeHead(405, {
                    'Content-Type': 'text/html'
                });
                res.write("405: Requested " + params.quant + " of " + params.name + ", but there is only " + prevQuant);
                return res.end();
            } else {
                var newvalues = {
                    $set: {
                        quant: (prevQuant - params.quant)
                    }
                };
                dbo.collection("goods").updateOne(query, newvalues, function (err, res) {
                    if (err) throw err;
                });
                res.writeHead(200, {
                    'Content-Type': 'text/html'
                });
                res.write(params.name + " updated, new quantity: " + (prevQuant - params.quant));
                res.end();
            }
            db.close();
        });
    });
}

function refill(res, params) {
    var refills = JSON.parse(params.refill).refill;
    // console.log(refills[0]);
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    for (item of refills) {
        refillItem(res, item);
    }
    //{"refill":[{"name":"ham","quant":5},{"name":"tomato","quant":3}]}
    res.end();
}

function refillItem(res, item) {
    console.log(item);
    var query = {
        name: item.name
    };
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Storage");
        dbo.collection("goods").findOne(query, function (err, result) {
            if (err) throw err;
            if (result) {
                var newvalues = {
                    $set: {
                        quant: (result.quant + item.quant)
                    }
                };
                dbo.collection("goods").updateOne(query, newvalues, function (err, res) {
                    if (err) throw err;
                });
            } else {
                res.write("could not find commodity with name: " + item.name);
            }
            // }
            db.close();
        });
    });
}

function getStorage(res) {
    console.log("requested storage");
    var query = {};
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Storage");
        dbo.collection("goods").find(query).toArray(function (err, result) {
            if (err) throw err;

            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write(JSON.stringify(result));

            db.close();
            return res.end();
        });
    });
}

function getEmpty(res) {
    console.log("requested empty");
    var query = {
        quant: 0
    };
    MongoClient.connect(url, function (err, db) {
        if (err) throw err;
        var dbo = db.db("Storage");
        dbo.collection("goods").find(query).toArray(function (err, result) {
            if (err) throw err;

            res.writeHead(200, {
                'Content-Type': 'text/html'
            });
            res.write(JSON.stringify(result));

            db.close();
            return res.end();
        });
    });
}

async function validate() {
    if (!validating) {
        return true;
    }
    try {
        const response = await axios.get(validateUrl + "?token=" + token);
        return (response.data == "Access Granted");
    } catch (error) {
        console.log(error.response.body);
    }
}