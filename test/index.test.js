var expect    = require('chai').expect;

var encoder   = require('../lib/index');

describe('imb encoder', function () {
  it('should encode a barcode', function () {
    expect(encoder.encodeTrackingNumber('0031012345678912345694158'))
    .to.eql(
      'AFTDFDFFFDTAATFDTTAAATDFADFADDDFAADAAADATDDATTATDFTTTAFDDATFFAAFA'
    );
  });
});
