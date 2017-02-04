const expect = require('chai').expect;
const alltomp3 = require('..');
const _ = require('lodash');

describe('guessTrackFromString', function() {
  it('should guess the right track', function () {
    this.timeout(20000);
    let queries = [
      {
        q: "Kungs vs Cookin’ on 3 Burners - This Girl",
        title: "This Girl (Kungs Vs. Cookin' On 3 Burners)",
        a: "Kungs"
      },
      {
        q: "'City of Stars' (Duet ft. Ryan Gosling, Emma Stone) - La La Land Original Motion Picture Soundtrack",
        t: "City of Stars",
        a: "Piano Dreamers"
      },
      {
        q: "Imagine Dragons - On Top Of The World (Official Music Video)",
        t: "On Top Of The World",
        a: "Imagine Dragons"
      },
      {
        q: "Mika - Elle Me Dit (clip officiel)",
        t: "Elle Me Dit",
        a: "Mika"
      }
    ];
    let promises = [];
    _.forEach(queries, q => {
      let p = alltomp3.guessTrackFromString(q.q).then(a => {
        expect(a.title).to.be(q.t);
        expect(a.artistName).to.be(q.a);
      });
      promises.push(p);
    });
    return promises;
  });
});
