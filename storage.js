var http = require('http');
var urlparse = require('url');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var axios = require('axios');
const localUrl = "mongodb://localhost:27017/";
const onlineurl = "mongodb+srv://oroszlanolo:asdqwe123@storage-nuak1.mongodb.net/<Storage>?retryWrites=true&w=majority";
const url = onlineurl;
const validateUrl = "http://apollo.xannosz.cloud:8000/validate"

const validating = true;
const accessUser = "user";
const accessAdmin = "admin";


http.createServer(function (req, res) {
    // console.log(req);
    try {
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
    } catch (error) {
        console.log(error);
    }
}).listen(8880);

function getComm(res, params) {
    console.log("requested commodity: " + params.name);
    validate(params.token, accessUser).then(result => {
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
    if (!params.name || !params.quant || params.quant <= 0) {
        res.write("Invalid parameters.");
        return res.end();
    }
    validate(params.token, accessUser).then(result => {
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
    validate(params.token, accessAdmin).then(result => {
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
                //res.write("could not find commodity with name: " + item.name);
            }
            // }
            db.close();
        });
    });
}

function getStorage(res, params) {
    validate(params.token, accessUser).then(result => {
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
    validate(params.token, accessUser).then(result => {
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
    if (!validating) {
        return true;
    }
    if (!tok || !acc)
        return false;
    try {
        const response = await axios.get(validateUrl + "?token=" + tok + "&access=" + acc);
        return (response.data == "Access Granted");
    } catch (error) {
        console.log(error.response.body);
    }
}