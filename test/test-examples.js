"use strict";

var chai = require('chai');

var expect = chai.expect;

describe('examples', function () {
    var bbj2j = require('../index');
    var j2j = bbj2j.instance();

    it('usage', function () {
        var upper = function (input) {
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
    });

    xit('dataKey - 0', function () {
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
    });

    xit('dataKey - 1', function () {
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
    });

    xit('dataKey - 2', function () {
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
    });

    xit('dataKey - 3', function () {
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
    });

    xit('dataKey - 4', function () {
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
    });

    xit('value - 0', function () {
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
    });

    xit('value - 1', function () {
        var template = {
            value: function (input) {
                return input.toUpperCase();
            }
        };

        var r = j2j.run(template, 'joe');
        console.log(r); // JOE
    });

    xit('value - 2', function () {
        var template = {
            value: 'names are classified',
            dataKey: 'name'
        };

        var r = j2j.run(template, {
            name: 'joe'
        });
        console.log(r); // 'names are classified'
    });

    xit('value - 3', function () {
        var nestedTemplate = {
            value: function (input) {
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
    });

    xit('content - 0', function () {
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
    });

    xit('content - 1', function () {
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
    });

    xit('constant - 0', function () {
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
    });

    xit('constant - 1', function () {
        var template = {
            constant: 'CONST'
        };

        var r = j2j.run(template, {
            any: 'any'
        });
        console.log(r); // 'CONST'
    });

    xit('existsWhen', function () {
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
    });

    xit('dataTransform - 0', function () {
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
                    dataTransform: function (input) {
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
    });

    xit('default - 0', function () {
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
    });

    xit('multiple - 0', function () {
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
    });

    xit('firstOf - 0', function () {
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
    });

    xit('firstOf - 1', function () {
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
    });

    xit('assign - 0', function () {
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
    });

    xit('override - dataKeyPieceOverride', function () {
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
    });

    it('override - actionKey', function () {
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
    });
});
