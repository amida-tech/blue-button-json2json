# v1.6.0 - FINAL

- dataKeyPieceOverride functionality is removed
- paths like 'a.b.c' where 'b' is array is not supported. use a.b[*].c with jsonave.
- 'dataKeyFnOptions' replaced with 'context' option.
- existsWhen now accepts arrays.
- existsUnless is added.  Opposite of existsWhen
- deprecated.  use jsonapter.

# v1.5.0 - June 12, 2015

- `dataKey` now accepts functions.  Primarily designed for JSONPath expression.
- `arrayContent` key is added.
- `single` key is added.

# v1.4.0 - March 8, 2015

This is the initial release of blue-button-json2json library.

- Provides a teplate rules based JSON to JSON transformation.

