(function () {
    'use strict';

    CKEDITOR.plugins.add('pseudom', {});

    CKEDITOR.pseudom = {
        parseChildren: parseChildren,

        writeFragment: writeFragment,

        writeElement: writeElement
    };

    function parseChildren(element) {
        var children = element.getChildren(),
            childrenArr = [];

        for (var i = 0, l = children.count(); i < l; ++i) {
            childrenArr.push(parseNode(children.getItem(i)));
        }

        return childrenArr;
    }

    function parseNode(node) {
        switch (node.type) {
            case CKEDITOR.NODE_ELEMENT:
                return parseElement(node);
            case CKEDITOR.NODE_TEXT:
                return {
                    type: CKEDITOR.NODE_TEXT,
                    text: node.getText()
                }
            // Unsupported node type.
            default:
                return null;
        }
    }

    function parseElement(element) {
        var obj = {
            type: CKEDITOR.NODE_ELEMENT,
            name: element.getName()
        };

        var attributes = element.$.attributes,
            attributesObj = {};

        for (var i = 0, l = attributes.length; i < l; ++i) {
            attributesObj[attributes[i].nodeName] = attributes[i].nodeValue;
        }

        if (!attributesObj['id']) {
            var val = 'epic-' + randomHash(10);
            attributesObj['id'] = val;
            element.setAttribute('id', val);
        }
        if (!attributesObj['data-line-id']) {
            var val = Guid.newGuid();
            attributesObj['data-line-id'] = val;
            element.setAttribute('data-line-id', val);
        }

        obj.children = parseChildren(element);
        obj.attributes = attributesObj;

        return obj;
    }

    function writeFragment(fragment) {
        return fragment.map(function (node) {
            return writeNode(node);
        }).join('');
    }

    function writeNode(node) {
        // Write unsupported node type.
        if (!node) {
            return '';
        }

        return ( node.type == CKEDITOR.NODE_ELEMENT ?
                writeElement(node) :
                node.text
        );
    }

    function writeElement(element) {
        var html = '<' + element.name;

        for (var name in element.attributes)
            html += ' ' + name + '="' + element.attributes[name] + '"';

        if (CKEDITOR.dtd.$empty[element.name])
            return html + '/>';
        else
            html += '>';

        html += writeFragment(element.children);

        return html + '</' + element.name + '>';
    }

    var Guid = Guid || (function () {

            var EMPTY = '00000000-0000-0000-0000-000000000000';

            var _padLeft = function (paddingString, width, replacementChar) {
                return paddingString.length >= width ? paddingString : _padLeft(replacementChar + paddingString, width, replacementChar || ' ');
            };

            var _s4 = function (number) {
                var hexadecimalResult = number.toString(16);
                return _padLeft(hexadecimalResult, 4, '0');
            };

            var _cryptoGuid = function () {
                var buffer = new window.Uint16Array(8);
                window.crypto.getRandomValues(buffer);
                return [_s4(buffer[0]) + _s4(buffer[1]), _s4(buffer[2]), _s4(buffer[3]), _s4(buffer[4]), _s4(buffer[5]) + _s4(buffer[6]) + _s4(buffer[7])].join('-');
            };

            var _guid = function () {
                var currentDateMilliseconds = new Date().getTime();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (currentChar) {
                    var randomChar = (currentDateMilliseconds + Math.random() * 16) % 16 | 0;
                    currentDateMilliseconds = Math.floor(currentDateMilliseconds / 16);
                    return (currentChar === 'x' ? randomChar : (randomChar & 0x7 | 0x8)).toString(16);
                });
            };

            var create = function () {
                var hasCrypto = typeof (window.crypto) != 'undefined',
                    hasRandomValues = typeof (window.crypto.getRandomValues) != 'undefined';
                return (hasCrypto && hasRandomValues) ? _cryptoGuid() : _guid();
            };

            return {
                newGuid: create,
                empty: EMPTY
            };
        })();

    function randomHash(len) {
        return parseInt(( Math.random() + '' ).slice(2), 10).toString(30).slice(0, len);
    }
})();