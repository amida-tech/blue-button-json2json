"use strict";

var chai = require('chai');

var json2json = require('../index');

var case_0 = require('./test_cases/case-content-0');

var expect = chai.expect;

describe('content', function () {
    var engine = json2json.instance();

    it('case-content-0: basic', function () {
        var actual = engine.run(case_0.template, case_0.input);
        expect(actual).to.deep.equal(case_0.expected);
    });
});
