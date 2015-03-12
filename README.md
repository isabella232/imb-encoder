# imb-encoder
[![Build Status](https://travis-ci.org/lob/imb-encoder.svg)](https://travis-ci.org/lob/imb-encoder)
[![Coverage Status](https://coveralls.io/repos/lob/imb-encoder/badge.svg?branch=master)](https://coveralls.io/r/lob/imb-encoder?branch=master)
[![NPM version](https://badge.fury.io/js/imb-encoder.svg)](https://npmjs.org/package/imb-encoder)
[![Downloads](http://img.shields.io/npm/dm/imb-encoder.svg)](https://npmjs.org/package/imb-encoder)

The purpose of this library is to take in an object of [IMB](https://ribbs.usps.gov/index.cfm?page=intellmailmailpieces) information and return the encoded string.

### Usage

```javascript
var encoder = require('imb-encoder');

var encodedString = encoder.encodeTrackingNumber('0031012345678912345694158');
```
---
#### Credit for this logic goes to Robert Mathews at http://bobcodes.weebly.com/imb.html
---
