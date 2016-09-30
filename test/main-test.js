// chai.should();
var expect = require('chai').expect

describe('Mocha & Chai works', () => {
  it('Should pass', () => {
    expect(2).to.equal(2);
  });
});

// describe('App', function() {
//   it('should set the background color', function() {
//     var div = document.createElement('div');
//
//     App({
//       root: div,
//       background: 'green'
//     });
//     expect(div.style.background).to.equal('green');
//   });
// });

describe('googRequest', function() {
  it('should exist', function() {
    expect('googRequest').to.exist;
  });
});
