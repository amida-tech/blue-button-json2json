"use strict";

var bbu = require('blue-button-util');
var _ = require('lodash');

var bbuobjectset = bbu.objectset;
var bbuobject = bbu.object;

var emptyFunction = function () {};

var prototype = {
    logger: {
        trace: emptyFunction,
        debug: emptyFunction,
        warn: emptyFunction,
        error: emptyFunction,
        fatal: emptyFunction
    },
    dataKeyPieceOverride: function (input, dataKeyPiece) {
        return input;
    },
    dataKeyArrayOverride: function (input, dataKeyPieces, dataKeyIndex) {
        var n = dataKeyPieces.length;
        if (dataKeyIndex >= n - 1) {
            return input;
        }
        if (dataKeyPieces[dataKeyIndex + 1] === '0') {
            input = input[0];
            if (!bbuobject.exists(input)) {
                return null;
            }
            if (dataKeyIndex + 1 >= n - 1) {
                return input;
            }
            var piecesAfter0 = dataKeyPieces.slice(dataKeyIndex + 2, n).join('.');
            return this.dataKeyToInput(input, piecesAfter0);
        }

        var remainingDataKey = dataKeyPieces.slice(dataKeyIndex + 1, n).join('.');
        return this.dataKeyToInputForArray(input, remainingDataKey);
    },
    dataKeyToInputForArray: function (input, dataKey) {
        var result = [];
        for (var i = 0; i < input.length; ++i) {
            var premResult = this.dataKeyToInput(input[i], dataKey);
            if (bbuobject.exists(premResult)) {
                result.push(premResult);
            }
        }
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    },
    dataKeyToInput: function (input, dataKey) {
        if (!bbuobject.exists(input)) {
            return null;
        }
        if (!bbuobject.exists(dataKey)) {
            return input;
        }
        var dataKeyPieces = dataKey.split('.');
        var n = dataKeyPieces.length;
        for (var i = 0; i < n; ++i) {
            var pathPiece = dataKeyPieces[i];
            input = input[pathPiece];
            if (!bbuobject.exists(input)) {
                return null;
            }
            input = this.dataKeyPieceOverride(input, pathPiece);
            if (Array.isArray(input)) {
                return this.dataKeyArrayOverride(input, dataKeyPieces, i);
            }
        }
        return input;
    },
    dataKeyArrayToInput: function (input, dataKeyArray) {
        var n = dataKeyArray.length;
        for (var i = 0; i < n; ++i) {
            var dataKey = dataKeyArray[i];
            var inputCandidate = this.dataKeyToInput(input, dataKey);
            if (bbuobject.exists(inputCandidate)) {
                return inputCandidate;
            }
        }
        return null;
    },
    evaluateDataKey: function (input, dataKey) {
        if (!bbuobject.exists(input)) {
            return null;
        }
        if (!bbuobject.exists(dataKey)) {
            return input;
        }
        if (Array.isArray(dataKey)) {
            return this.dataKeyArrayToInput(input, dataKey);
        } else {
            return this.dataKeyToInput(input, dataKey);
        }
    },
    evaluateValue: function (value, input) {
        var valueType = (typeof value);
        if (valueType === 'function') {
            return value(input);
        } else if (valueType === 'object') {
            return this.run(value, input);
        } else {
            return value;
        }
    },
    content: function (template, input) {
        var that = this;
        var content = template.content;
        var hasValue = false;
        var keys = Object.keys(content);
        var result = keys.reduce(function (r, key) {
            var contentValue = template.content[key];
            var value = that.evaluateValue(contentValue, input);
            if (value !== null) {
                bbuobjectset.deepValue(r, key, value);
                hasValue = true;
            }
            return r;
        }, {});
        return hasValue ? result : null;
    },
    assign: function (template, input) {
        var templateAssign = template.assign;
        if (templateAssign === null || templateAssign === undefined) {
            this.logger.fatal({
                arguments: arguments
            }, 'template value is empty');
            return null;
        } else if (!Array.isArray(templateAssign)) {
            this.logger.fatal({
                arguments: arguments
            }, 'template value is not array');
            return null;
        } else {
            var that = this;
            var assignValues = templateAssign.reduce(function (r, assignValue) {
                var v = that.evaluateValue(assignValue, input);
                if (typeof v === 'object') {
                    r.push(v);
                }
                return r;
            }, [{}]);
            if (assignValues.length === 1) {
                return null;
            }
            var v = _.assign.apply(null, assignValues);
            return v;
        }
    },
    firstOf: function (template, input) {
        var templateFirstOf = template.firstOf;
        if (templateFirstOf === null || templateFirstOf === undefined) {
            this.logger.fatal({
                arguments: arguments
            }, 'template value is empty');
            return null;
        } else if (!Array.isArray(templateFirstOf)) {
            this.logger.fatal({
                arguments: arguments
            }, 'template value is not array');
            return null;
        } else {
            for (var i = 0; i < templateFirstOf.length; ++i) {
                var t = templateFirstOf[i];
                var value = this.evaluateValue(t, input);
                if (value !== null) {
                    return value;
                }
            }
            return null;
        }
    },
    constant: function (template, input) {
        return template.constant;
    },
    value: function (template, input) {
        var templateValue = template.value;
        return this.evaluateValue(templateValue, input);
    },
    runForArray: function (template, input) {
        var hasActionKeys = false;
        var modifiedTemplate = this.actionKeys.reduce(function (r, actionKey) {
            // dataTransform tags only apply to the array
            if (template[actionKey]) {
                r[actionKey] = template[actionKey];
                hasActionKeys = true;
            }
            return r;
        }, {});
        if (!hasActionKeys) {
            return input;
        }
        var that = this;
        var result = input.reduce(function (r, e) {
            var value = that.run(modifiedTemplate, e);
            if (value !== null) {
                r.push(value);
            }
            return r;
        }, []);
        if (result.length > 0) {
            return result;
        } else {
            return null;
        }
    },
    run: function (template, input) {
        if (!template) {
            this.logger.fatal('empty template');
            return null;
        }
        if (template.existsWhen && !template.existsWhen(input)) {
            this.logger.debug({
                arguments: arguments
            }, 'exist when return');
            return null;
        }
        if (template.dataKey) {
            input = this.evaluateDataKey(input, template.dataKey);
        }
        if ((input !== null) && template.dataTransform) {
            input = template.dataTransform(input);
        }
        if (Array.isArray(input)) {
            return this.runForArray(template, input);
        }
        var result = input;
        if (input !== null) {
            for (var i = 0; i < this.actionKeys.length; ++i) {
                var actionKey = this.actionKeys[i];
                if (template.hasOwnProperty(actionKey)) {
                    result = this[actionKey](template, input);
                    break;
                }
            }
        }
        if ((result === null) && template.default) {
            result = template.default;
        }
        if ((result !== null) && template.multiple) {
            result = [result];
        }
        return result;
    },
    actionKeys: ['content', 'value', 'assign', 'firstOf', 'constant']
};

exports.instance = function (overrides, addlActionKeys) {
    var result = Object.create(prototype);
    if (overrides) {
        _.assign(result, overrides);
    }
    if (addlActionKeys) {
        result.actionKeys = result.actionKeys.concat(addlActionKeys);
    }
    return result;
};
