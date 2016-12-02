var DEBUG = true;

var Db = require('mongodb').Db;
var Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;
var BSON = require('mongodb').BSON;
var ObjectID = require('mongodb').ObjectID;

DataProvider = function (host, port) {
    this.db = new Db('node-mongo-epic-fail', new Server(host, port, {safe: true}, {auto_reconnect: true}, {}));
    this.db.open(function () {
    });
};

DataProvider.prototype.getDocs = function (callback) {
    this.db.collection('documents', function (error, docs) {
        if (error) {
            callback && callback(error);
        } else {
            callback && callback(null, docs);
        }
    });
};

DataProvider.prototype.getDocument = function (docId, callback) {
    var collection = this.db.collection('documents');
    collection.find({"docId": docId}).toArray(function (error, results) {
        if (error) {
            callback && callback(error);
        } else {
            callback && callback(null, results);
        }
    });
};

DataProvider.prototype.updateDocument = function (docId, data, callback) {
    var collection = this.db.collection('documents');
    collection.updateOne({"docId": docId}, {$set: {data: data}}, function (error, results) {
        if (error) {
            callback && callback(error);
        } else {
            callback && callback(null, results);
        }
    });
};

//find all docs
DataProvider.prototype.findAll = function (docId, stamp, callback) {
    this.getDocs(function (error, docs) {
        if (error) callback(error)
        else {
            docs.find({"docId": docId, "stamp": {$gt: stamp}}).toArray(function (error, results) {
                if (error) callback(error)
                else callback(null, results)
            });
        }
    });
};

//save new doc
DataProvider.prototype.save = function (docs, callback) {
    //DEBUG && console.log( 'DataProvider: saving docs ' + JSON.stringify(docs, null, '\t'));

    this.getDocs(function (error, local_docs) {
        if (error) callback(error)
        else {
            //DEBUG && console.log( 'DataProvider: ready to insert doc');

            if (typeof(docs) == "undefined") console.log('DataProvider: docs was undefined');

            if (typeof(docs.length) == "undefined") {
                //DEBUG && console.log( 'DataProvider: docs length was undefined - convert to array');
                docs = [docs];
            }

            //DEBUG && console.log('DataProvider: docs after conversion: ' + JSON.stringify(docs, null, '\t'));

            for (var i = 0; i < docs.length; i++) {
                //DEBUG && console.log( 'DataProvider: creating new doc ' + i);
                doc = docs[i];
                doc.created_at = new Date();
            }

            //DEBUG && console.log('DataProvider: docs before insert: ' + JSON.stringify(docs, null, '\t'));
            local_docs.insert(docs, function () {
                //DEBUG && console.log('DataProvider: docs after insert: ' + JSON.stringify(docs, null, '\t'));
                callback(null, docs);
            });
        }
    });
};

exports.DataProvider = DataProvider;