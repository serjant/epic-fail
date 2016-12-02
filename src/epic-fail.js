'use strict';

var DEBUG = true;

var Domit = require('../static/domit');

var _clients = {},
    _docs = {};

var getNextId = (function () {
    var id = 0;
    return function () {
        return ++id;
    };
})();

var getRandomColor = (function () {
    // Min is 0, max is 150 to avoid white.
    var getRandomChannel = function () {
        return ( '0' + ( 0 | Math.random() * 150 ).toString(16) ).slice(-2);
    }

    return function () {
        return '#' +
            getRandomChannel() +
            getRandomChannel() +
            getRandomChannel();
    }
})();

var getRandomName = (function () {
    var names = ['Chuck', 'James', 'Ray', 'Sam', 'Fats', 'Buddy', 'Jerry', 'Little', 'Elvis', 'The', 'Carl', 'Cornell', 'Billy', 'Eddie', 'Bo', 'Aretha', 'Marvin', 'Bill', 'B.B.', 'Clyde', 'Ricky', 'Roy', 'Carl', 'Smokey', 'Big', 'Muddy', 'Jackie', 'Al', 'Mike', 'Brian', 'Carl', 'The', 'George', 'John', 'Paul', 'Ringo', 'The', 'Ben', 'Rudy', 'Clyde', 'Johnny', 'Bill', 'Charlie', 'Van', 'The', 'Eric', 'Chas', 'Alan', 'John', 'John', 'Bob', 'Rod', 'Al', 'Janis', 'Neil', 'Frank', 'David'],
        snames = ['Berry', 'Brown', 'Charles', 'Cooke', 'Domino', 'Holly', 'Lewis', 'Richard', 'Presley', 'Coasters', 'Gardner', 'Gunter', 'Guy', 'Cochran', 'Diddley', 'Franklin', 'Gaye', 'Haley', 'King', 'McPhatter', 'Nelson', 'Orbison', 'Perkins', 'Robinson', 'Turner', 'Waters', 'Wilson', 'Jardine', 'Love', 'Wilson', 'Wilson', 'Beatles', 'Harrison', 'Lennon', 'McCartney', 'Starr', 'Drifters', 'King', 'Lewis', 'McPhatter', 'Moore', 'Pinkney', 'Thomas', 'Morrison', 'Animals', 'Burdon', 'Chandler', 'Price', 'Steel', 'Lennon', 'Marley', 'Stewart', 'Green', 'Joplin', 'Young', 'Zappa', 'Bowie'];

    return function () {
        return names[0 | ( Math.random() * names.length - 1 )] +
            ' ' +
            snames[0 | ( Math.random() * snames.length - 1 )];
    }
})();

var getDocumentClients = function (doc) {
    if (doc && doc.clients) {
        return doc.clients.map(function (client) {
            return {
                clientId: client.id,
                clientName: client.name,
                clientColor: client.color
            }
        });
    }
    else
        return [];
}

exports.add = function add(io, socket, dataProvider) {
    var clientId = socket.id,
        client = _clients[clientId] = {
            docId: null,
            doc: null,
            name: getRandomName(),
            color: getRandomColor()
        };

    socket.on('init', function (data) {
        DEBUG && console.log('[EPIC] init - data: ' + JSON.stringify(data, null, '\t'));

        var docId = data.docId;
        client.docId = docId;
        var doc = _docs[docId];

        var toEmit = {
            clientColor: client.color,
            clientName: client.name
        };

        if (!doc) {
            _docs[docId] = doc = {
                id: docId,
                clients: [],
                domit: new Domit(data.head)
            };
        }
        else
            toEmit.head = doc.domit.head;

        // Order is crucial.
        doc.clients.push(client);
        client.doc = doc;
        toEmit.clients = getDocumentClients(doc);

        socket.emit('init', toEmit);

        // Join doc room.
        socket.join(docId);

        console.log('[EPIC] Client (' + clientId + ') connected to edit doc:' + docId);
        console.log('[EPIC] Number of clients editing doc:' + docId + ': ' + doc.clients.length);
    });

    socket.on('disconnect', function () {
        delete _clients[clientId];

        var docClients = client.doc.clients;
        docClients.splice(docClients.indexOf(clientId), 1);

        if (!docClients.length) {
            delete _docs[client.docId];
        }

        // Selection must be empty and present for caretlocator plugin.
        try {
            socket.broadcast.to(client.docId).emit('disconnect', {
                clientId: clientId,
                selection: [],
                clients: getDocumentClients(client.doc)
            });
        } catch (e) {
            console.log(e);
        }
        console.log('[EPIC] Client (' + clientId + ') disconntected from doc:' + client.docId);
        console.log('[EPIC] Number of clients editing doc:' + client.docId + ': ' + docClients.length);
    });

    socket.on('commit', function (data) {
        DEBUG && console.log('[EPIC] commit - data: ' + JSON.stringify(data, null, '\t'));

        var success = client.doc.domit.apply(data.diff);

        if (success) {
            dataProvider.save(data, function (error, data) {
                    if (error) DEBUG && console.log('[EPIC] ERROR Could not save data: ' + JSON.stringify(data, null, '\t'));
                    else DEBUG && console.log('[EPIC] Saved data: ' + JSON.stringify(data, null, '\t'));
                }
            );

            socket.broadcast.to(client.docId).emit('push', {
                diff: data.diff,
                selection: data.selection,
                clientId: clientId
            });
            socket.emit('accepted', {stamp: data.stamp});
        }
        else {
            socket.emit('rejected', {stamp: data.stamp, head: client.doc.domit.head});
        }
    });

    socket.on('selection', function (data) {
        data.clientId = clientId;
        data.clientName = client.name;
        data.clientColor = client.color;
        data.clients = getDocumentClients(client.doc);

        socket.broadcast.to(client.docId).emit('selection', data);
    });

    socket.on('name', function (data) {
        if (data.clientName == client.name)
            return;

        client.name = data.clientName;

        io.sockets.in(client.docId).emit('name', {
            clientId: clientId,
            clientName: client.name,
            clients: getDocumentClients(client.doc)
        });

        console.log('[EPIC] Client (' + clientId + ') changed name to: ' + client.name);
    });

    socket.on('reset', function () {
        socket.emit('reset', {head: client.doc.domit.head});
    });

    socket.on('get_versions', function (data) {
        dataProvider.findAll(data.docId, data.stamp, function (error, data) {
                if (error) DEBUG && console.log('[EPIC] ERROR Could not find data: ' + JSON.stringify(data, null, '\t'));
                else {
                    DEBUG && console.log('[EPIC] Found data: ' + JSON.stringify(data, null, '\t'));

                    socket.emit('versions_fetched', {
                        diffs: data,
                        clientId: clientId
                    });
                }
            }
        );

    });

};
