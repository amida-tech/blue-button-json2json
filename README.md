blue-button-json2json
=====================

Template Rules based JSON Transformer 

[![NPM](https://nodei.co/npm/blue-button-json2json.png)](https://nodei.co/npm/blue-button-json2json/)

[![Build Status](https://travis-ci.org/amida-tech/blue-button-json2json.svg)](https://travis-ci.org/amida-tech/blue-button-json2json)
[![Coverage Status](https://coveralls.io/repos/amida-tech/blue-button-json2json/badge.png)](https://coveralls.io/r/amida-tech/blue-button-json2json)

This library provides a template rules based formalism to describe JSON to JSON transformations declaratively.  This formalism is primarily designed for health data translation between various formats such as FHIR and CCDA.

## Usage

In its most basic form JSON to JSON transformation are desribed by a template object where `content` objects recursively describe destination keys, `dataKey` objects describe source keys, and `value` functions describe formatting
```js
var upper = function(input) {
	return input ? input.toUpperCase() : null;
};

var template = {
    content: {
        dest_a: {
            dataKey: 'a.c'
        },
        dest_b: {
            content: {
                dest_b0: {
                    value: upper,
                    dataKey: 'b.c'
                },
                dest_b1: {
                    value: upper,
                    dataKey: 'd'
                }
            },
            dataKey: 'a'
        }
    }
};
```
An engine instance is available from blue-button-json2json and can be used to transform an `input` as described by the template
```js
var bbj2j = require('blue-button-json2json');
var j2j = bbj2j.instance();

var input = {
    a: {
        b: {
            c: 'value_0'
        },
        c: 'value_2',
        d: 'value_1'
    }
};

var r = j2j.run(template, input);
console.log(r); // {dest_a: 'value_2', dest_b: {dest_b0: 'VALUE_0', dest_b1: 'VALUE_1'}}
```

## Standard Template Rules

The following are the list of all keys that have special meaning in the template objects
- [`dataKey`](#dataKey)
- [`value`](#value)
- [`content`](#content)
- [`constant`](#constant)
- [`existsWhen`](#existsWhen)
- [`dataTransform`](#dataTransform)
- [`default`](#default)
- [`multiple`](#multiple)
- [`firstOf`](#firstOf)
- [`assign`](#assign)

<a name="dataKey" />
#### `dataKey` rule

This rule selects a particular property of input
```js
var template = {
    dataKey: 'a'
};

var r0 = j2j.run(template, {
    a: 1,
    b: 2
});
console.log(r0); // 1

var r1 = j2j.run(template, {
    b: 2
});
console.log(r1); // null


var r2 = j2j.run(template, {
    a: {
        b: 2
    }
});
console.log(r2); // {b: 2}
```

The properties can be deep
```js
var template = {
    dataKey: 'a.b.c'
};

var r0 = j2j.run(template, {
    a: {
        b: {
            c: 'value'
        }
    }
});
console.log(r0); // 'value'

var r1 = j2j.run(template, {
    a: 2
});
console.log(r1); // null
```

If the property or any of the properties on the deep property is an array `dataKey` yields an array as well
```js
var template = {
    dataKey: 'a.b.c'
};

var r = j2j.run(template, {
    a: {
        b: [{
            c: 'value_0'
        }, {
            d: 'value_1'
        }, {
            c: 'value_2'
        }]
    }
});
console.log(r); // ['value_0', 'value_2']
```
Currently only one array on the deep property is supported.  Multiple arrays will result in array of arrays.

`0` on the path is treated as a special case and selects the first element of the array
```js
var template = {
    dataKey: 'a.b.0.c'
};

var r = j2j.run(template, {
    a: {
        b: [{
            c: 'value_0'
        }, {
            d: 'value_1'
        }, {
            c: 'value_2'
        }]
    }
});
console.log(r); // 'value_0'
```

`dataKey` can be an array.  In that case the first deep property that evaluates to a value that is not `null` is selected
```js
var template = {
    dataKey: ['a.b', 'a.c']
};

var r0 = j2j.run(template, {
    a: {
        b: 1,
        c: 2
    }
});
console.log(r0); // 1

var r1 = j2j.run(template, {
    a: {
        c: 3
    }
});
console.log(r1); // 3

var r2 = j2j.run(template, {
    a: {
        d: 4
    }
});
console.log(r2); // null
```

<a name="value" />
#### `value` rule

This rule is primarily used to format `input` or `input` property that is selected by `dataKey`.  In this case it is assigned to a function
```js
var template = {
    value: function (input) {
        return input.toUpperCase();
    },
    dataKey: 'name'
};

var r = j2j.run(template, {
    name: 'joe'
});
console.log(r); // JOE
```
```js
var template = {
    value: function (input) {
        return input.toUpperCase();
    }
};

var r = j2j.run(template, 'joe');
console.log(r); // JOE
```

This rule can be used to return a primary data type
```js
var template = {
    value: 'names are classified',
    dataKey: 'name'
};

var r = j2j.run(template, {
    name: 'joe'
});
console.log(r); // 'names are classified'
```

If `value` is assigned to an object, the object is assumed to be a nested template and evaluated as such
```js
var nestedTemplate = {
    value: function(input) {
        return input.toUpperCase();
    },
    dataKey: 'b'
};

var template = {
    value: nestedTemplate,
    dataKey: 'a'
};

var r = j2j.run(template, {
    a: {
        b: 'value'
    }
});
console.log(r); // 'VALUE'
```

<a name="content" />
#### `content` rule

This rule is used to describe a new object based on `input`.  The property keys of the `content` becomes the properties in the destination object.  The property values of `content` are primarily other templates
```js
var nameTemplate = {
    content: {
        last: {
            dataKey: 'familyName'
        },
        first: {
            dataKey: 'givenName'
        }
    }
};

var template = {
    content: {
        name: nameTemplate,
        age: {
            value: function (input) {
                return 2015 - input;
            },
            dataKey: 'birthYear'
        }
    }
};

var r = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE',
    birthYear: 1980
});
console.log(r); // {name: {last: 'DOE', first: 'JOE'}, age: 35}
```

The `content` property values can also be formatting functions or primary data types which shortcuts the need to use `value` rule for those cases
```js
var nameTemplate = {
    content: {
        last: {
            dataKey: 'familyName'
        },
        first: {
            dataKey: 'givenName'
        }
    }
};

var template = {
    content: {
        type: 'Report',
        title: function (input) {
            return input.gender === 'M' ? 'Mr.' : 'Ms.';
        },
        name: nameTemplate,
        age: {
            value: function (input) {
                return 2015 - input;
            },
            dataKey: 'birthYear'
        }
    }
};

var r = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE',
    gender: 'M',
    birthYear: 1980
});
console.log(r); // {type: 'Report', title: 'Mr.', name: {last: 'DOE', first: 'JOE'}, age: 35}
```

The `content` property keys can be deep
```js
var template = {
    content: {
        'name.last': {
            dataKey: 'familyName'
        },
        'name.first': {
            dataKey: 'givenName'
        }
    }
};

var r = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE'
});
console.log(r); // name: {last: 'DOE', first: 'JOE'}
```

<a name="constant" />
#### `constant` rule

When values in `value` rule and property values in `content` rule are objects, they are assumed to be nested templates.  `constant` rule makes it possible to define a constant object within template
```js
var template = {
    content: {
        codes: {
            constant: {
                'Y': 'yellow',
                'R': 'red'
            }
        },
        'color.back': {
            dataKey: 'backgroundColor'
        },
        'color.fore': {
            dataKey: 'foreGroundColor'
        }
    }
};

var r = j2j.run(template, {
    backgroundColor: 'Y',
    foreGroundColor: 'R'
});
console.log(r); // {codes: {Y: 'yellow', R: 'red'}, color: {back: 'Y', fore: 'R'}}
```

You can also use primary data types in `constant` rule as alternatives to directly specifying them with `content` and `value` rules
```js
var template = {
    constant: 'CONST'
};

var r = j2j.run(template, {
    any: 'any'
});
console.log(r); // 'CONST'
```

<a name="existsWhen" />
#### `existsWhen` rule

This rule determines if a property or value exists.  It must be a predicate.  A set of most common predicates are available from [blue-button-util](https://github.com/amida-tech/blue-button-util) predicate library.  This rule is evaluated before any other rule on the same level.

```js
var bbu = require('blue-button-util');
var predicate = bbu.predicate;

var template = {
    content: {
        dest_a: {
            dataKey: 'a'
        },
        dest_b: {
            dataKey: 'b',
            existsWhen: predicate.hasProperty('c')
        },
    },
    existsWhen: function (input) {
        return input && input.public;
    }
};

var result0 = j2j.run(template, {
    a: 'value_a',
    b: 'value_b',
    public: true
});
console.log(result0.dest_a); // 'value_a'
console.log(result0.dest_b); // undefined

var result1 = j2j.run(template, {
    a: 'value_a',
    b: 'value_b',
    c: 0,
    public: true
});
console.log(result1.dest_a); // 'value_a'
console.log(result1.dest_b); // 'value_b'

var result2 = j2j.run(template, {
    a: 'value_a',
    b: 'value_b',
    c: 0
});
console.log(result2); // null
```

<a name="dataTransform" />
#### `dataTransform` rule

This rule transforms `input` so that existing templates can be reused
```js
var nameTemplate = {
    content: {
        last: {
            dataKey: 'familyName'
        },
        first: {
            dataKey: 'givenName'
        }
    }
};

var template = {
    content: {
        name: {
        	value: nameTemplate,
			dataTransform: function(input) {
				return {
					familyName: input.lastName,
					givenName: input.firstName
				};
			}
		},
        age: {
            value: function (input) {
                return 2015 - input;
            },
            dataKey: 'birthYear'
        }
    }
};

var r = j2j.run(template, {
    lastName: 'DOE',
    firstName: 'JOE',
    birthYear: 1980
});
console.log(r); // {name: {last: 'DOE', first: 'JOE'}, age: 35}
```

<a name="default" />
#### `default` rule

This rule can be used to assign default values after templates are evaluated to be `null`
```js
var template = {
    content: {
        last: {
            dataKey: 'familyName',
            default: 'unknown'
        },
        first: {
            dataKey: 'givenName',
            default: 'unknown'
        }
    }
};

var r0 = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE'
});
console.log(r0); // {last: 'DOE', first: 'JOE'}

var r1 = j2j.run(template, {
    familyName: 'DOE'
});
console.log(r1); // {last: 'unknown', first: 'JOE'}

var r2 = j2j.run(template, {
    givenName: 'JOE'
});
console.log(r2); // {last: 'DOE', first: 'unknown'}
```

<a name="multiple" />
#### `multiple` rule

This rule can be change a template evaluted value into a one element array.
```js
var template = {
    content: {
        last: {
            dataKey: 'familyName',
        },
        given: {
            dataKey: 'givenName',
            multiple: true
        }
    }
};

var r = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE'
});
console.log(r); // {last: 'DOE', given: ['JOE']}
```

<a name="firstOf" />
#### `firstOf` rule

This rule must be assigned to an array of other templates and selects the first one that does not evaluate to `null`
```js
var nameTemplate = {
    content: {
        last: {
            dataKey: 'familyName'
        },
        first: {
            dataKey: 'givenName'
        }
    },
    existsWhen: function (input) {
        return input && input.familyName && input.givenName;
    }
};

var template = {
    firstOf: [nameTemplate, {
        dataKey: 'familyName'
    }]
};

var r0 = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE'
});
console.log(r0); // {last: 'DOE', first: 'JOE'}

var r1 = j2j.run(template, {
    familyName: 'DOE'
});
console.log(r1); // 'DOE'

var r2 = j2j.run(template, {
    givenName: 'JOE'
});
console.log(r2); // null
```

You can include also a primary data type as the last element to simulate a default
```js
var nameTemplate = {
    content: {
        last: {
            dataKey: 'familyName'
        },
        first: {
            dataKey: 'givenName'
        }
    },
    existsWhen: function (input) {
        return input && input.familyName && input.givenName;
    }
};

var template = {
    firstOf: [nameTemplate, 'UNKNOWN']
};

var r0 = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE'
});
console.log(r0); // {last: 'DOE', first: 'JOE'}

var r1 = j2j.run(template, {
    familyName: 'DOE'
});
console.log(r1); // 'UNKNOWN'
```

<a name="assign" />
#### `assign` rule

This rule accepts an array of other templates that generate object results and works similar to [lodash assign method](https://lodash.com/docs#assign).  `assign` rule is primarily used to reuse existing templates to obtain a new one
```js
var nameTemplate = {
    content: {
        last: {
            dataKey: 'familyName'
        },
        first: {
            dataKey: 'givenName'
        }
    }
};

var template = {
    assign: [{
        content: {
            id: function (input) {
                return input.givenName[0] + input.familyName;
            }
        }
    }, nameTemplate]
};


var r = j2j.run(template, {
    familyName: 'DOE',
    givenName: 'JOE'
});
console.log(r); // {id: 'JDOE', last: 'DOE', first: 'JOE'}
```

## Overrides

Each engine instance `j2j` contains all the implementation details as functions in the following keys: 
- `run`
- `content`
- `assign`
- `firstOf`
- `constant`
- `value`
- `runForArray`
- `evaluateDataKey`
- `evaluateValue`
- `actionKeys`
- `dataKeyPieceOverride`
- `dataKeyArrayOverride`
- `dataKeyToInputForArray`
- `dataKeyToInput`
- `dataKeyArrayToInput`

`run` is the entry point. `content`, `value`, `constant`, `firstOf` and `assign` are called action keys and listed in `actionKeys` array.  Only one of `actionKeys` can appear on a template on the same level.  None of these keys are designed to be overridden except `dataKeyPieceOverride`.  However you can add additional functionality by adding new data and action keys.

### Overrides To Existing Keys

Although in principle any of the implementation keys can be overridden, only `dataKeyPieceOverride` is designed 
as such.  You can override this key to further transform `input` based on `dataKey` piece
```js
var peopleDb = {
    '1': {
        lastName: 'Doe',
        firstName: 'Joe',
        spouseId: 2
    },
    '2': {
        lastName: 'Doe',
        firstName: 'Jane',
        spouseId: 1
    },
    '3': {
        lastName: 'Eod',
        firstName: 'Dave'
    }
};

var override = {
    peopleDb: peopleDb,
    dataKeyPieceOverride: function (input, dataKeyPiece) {
        if (input && (dataKeyPiece === 'spouseId')) {
            var person = this.peopleDb[input];
            if (person) {
                return person;
            } else {
                return null;
            }
        } else {
            return input;
        }
    }
};

var j2j_od = bbj2j.instance(override);

var nameTemplate = {
    content: {
        last: {
            dataKey: 'lastName'
        },
        first: {
            dataKey: 'firstName'
        }
    }
};

var template = {
    content: {
        name: nameTemplate,
        spouseName: {
            value: nameTemplate,
            dataKey: 'spouseId'
        }
    }
};

var r0 = j2j_od.run(template, peopleDb[1]);
console.log(r0); // {name: {last: 'Doe', first: 'Joe'}, spouseName: {last: 'Doe', first: 'Jane'}}

var r1 = j2j_od.run(template, peopleDb[3]);
console.log(r1); // {name: {last: 'Eod', first: 'Dave'}}
```

### Additional Action Keys

The functionality of templates can be customized by adding additional action keys
```js
var meds = {
    'aspirin': {
        id: 1
    },
};

var override = {
    meds: meds,
    external: function (template, input) {
        console.log(input);
        var te = template.external;
        if (!input) {
            return null;
        }
        var external = this.meds[input];
        if (external) {
            return external.id;
        } else {
            var newId = Object.keys(meds).length + 1;
            meds[input] = {
                id: newId
            };
            return newId;
        }
    }
};

var j2j_od_e = bbj2j.instance(override, ['external']);

var nameTemplate = {
    content: {
        last: {
            dataKey: 'lastName'
        },
        first: {
            dataKey: 'firstName'
        }
    }
};

var template = {
    content: {
        name: nameTemplate,
        meds: {
            external: {},
            dataKey: 'meds'
        }
    }
};

var r = j2j_od_e.run(template, {
    lastName: 'Doe',
    firstName: 'Joe',
    meds: ['claritin', 'aspirin', 'albuterol']
});
console.log(r); // {name: {last: 'Doe', first: 'Joe'}, meds: [2, 1, 3]}

console.log(meds); // {aspirin: {id: 1}, claritin: {id: 2}, albuteral: {id: 3}}
```
Here we added `external` to `actionKeys`.  Note that for this simple example, `external` is assigned to an empty object but in general it can be anything including other templates.  You can `run` the templates by `this.run(te, input)` where `te` is the value of `external` as demontrated above.

## License

Licensed under [Apache 2.0](./LICENSE).

