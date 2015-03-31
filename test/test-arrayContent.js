"use strict";

var chai = require('chai');

var json2json = require('../index');

var case_0 = require('./test_cases/case-arrayContent-0');

var expect = chai.expect;

describe('arrayContent', function () {
    var engine = json2json.instance();

    it('case-arrayContent-0: basic', function () {
        var actual = engine.run(case_0.template, case_0.input);
        expect(actual).to.deep.equal(case_0.expected);
    });
});
