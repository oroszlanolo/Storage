var http = require('http');
var urlparse = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var axios = require('axios');
const localUrl = "mongodb://localhost:27017/";
const onlineurl = "mongodb+srv://oroszlanolo:asdqwe123@storage-nuak1.mongodb.net/<Storage>?retryWrites=true&w=majority";
const url = onlineurl;
const validateUrl = "http://apollo.xannosz.cloud:8000/validate"
const access = "testPrivilege";
const token = "a18cda27-b31e-4588-9778-bf10c282de6d-b78b83e4-6ecb-47e7-8048-decbcdfa5fae-42cea846-e5fe-45d0-b734-b5d70ab9dd7f-5318fbc9-5575-4653-873f-43039188262f-ebef998e-2a25-4a73-b727-5ecc35c1e5dc-327420f9-323b-4fa0-9b27-de65244c6489-bfd46016-108e-4deb-9efb-eb159b395ba0-bdfd3f6a-71da-47d2-9a6d-7b281ce40db9-9c61547c-19ed-46ec-b9bf-f896c304be83";
const validating = true;


http.createServer(function (req, res) {
    // console.log(req);
    var parsed = urlparse.parse(req.url, true);
    var q = parsed.query;
    switch (parsed.pathname) {
        case "/getStorage":
            getStorage(res, q);
            break;
        case "/getComm":
            getComm(res, q);
            break;
        case "/getEmpty":
            getEmpty(res, q);
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
    validate(params.token, params.access).then(result => {
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
    validate(params.token, params.access).then(result => {
        if (result) {
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
        } else {
            res.writeHead(405, {
                'Content-Type': 'text/html'
            });
            res.write("Invalid user token, try to log in!");
            res.end();
        }
    });
}

function refill(res, params) {
    validate(params.token, params.access).then(result => {
        if (result) {
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
        } else {
            res.writeHead(405, {
                'Content-Type': 'text/html'
            });
            res.write("Invalid user token, try to log in!");
            res.end();
        }
    });
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

function getStorage(res, params) {
    validate(params.token, params.access).then(result => {
        if (result) {
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
        } else {
            res.writeHead(405, {
                'Content-Type': 'text/html'
            });
            res.write("Invalid user token, try to log in!");
            res.end();
        }
    });
}

function getEmpty(res, params) {
    validate(params.token, params.access).then(result => {
        if (result) {
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
        } else {
            res.writeHead(405, {
                'Content-Type': 'text/html'
            });
            res.write("Invalid user token, try to log in!");
            res.end();
        }
    });
}

async function validate(tok, acc) {
    if (!tok) {
        tok = token;
        acc = access;
    }
    if (!validating) {
        return true;
    }
    try {
        const response = await axios.get(validateUrl + "?token=" + tok + "&access=" + acc);
        return (response.data == "Access Granted");
    } catch (error) {
        console.log(error.response.body);
    }
}