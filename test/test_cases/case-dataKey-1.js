"use strict";

var bbu = require('blue-button-util');

var jp = bbu.jsonpath;

exports.template = {
    content: {
        price: {
            dataKey: jp.instance('book[0].price')
        },
        prices: {
            dataKey: jp.instance('book[1:].price')
        }
    }
};

exports.inputs = [];
exports.expecteds = [];

exports.inputs[0] = {
    book: [{
        price: 20
    }, {
        price: 25
    }, {
        price: 30
    }]
};

exports.expecteds[0] = {
    price: 20,
    prices: [25, 30]
};
