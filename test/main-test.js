var $ = require('jquery');

var myCode = require('../client/main');

var expect = require('chai').expect

describe('Mocha & Chai works', () => {
  it('Should pass', () => {
    expect(2).to.equal(2);
  });
});

describe('clearMarkers function', function() {
  it('should clear markers from array', function() {
    var markersArray = [1,2,3];
    myCode.clearMarkers();
    expect(markersArray.length).to.equal(0);
  });
});
