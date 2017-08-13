const expect = require('chai').expect;
const alltomp3 = require('..');
const _ = require('lodash');

/**
 * Lyrics uses 5 or 6 different websites,
 * and the first to answer is the one chosen.
 * So it is absolutely non determinist, and
 * these tests are repeated 5 times.
 * Moreover lyrics varies depending on the website,
 * and can sometimes be wrong...
*/

describe('findLyrics', function() {

  for (var i = 0; i < 5; i++) {
    it('should find lyrics for Imagine Dragons - On Top of the World', function (done) {
      var lyricsQuery = alltomp3.findLyrics('On Top of the World', 'Imagine Dragons').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/^if-you-love-somebody-better-tell-them-while-theyre-here/);
        expect(lyrics).to.match(/(when-you-hit-the-ground-get-up-now-get-up-get-up-now)|(i-can-been-dreaming-of-this-since-a-child-im-on-top-of-the-world)$/);
        done();
      });
    });
    it('should find lyrics for Pauline Croze - T\'es Beau', function (done) {
      var lyricsQuery = alltomp3.findLyrics('T\'es beau', 'Pauline Croze').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/tes-beau-parce-que-tes-courageux-de-regarder-dans-le-fond-des-yeux-celui-qui-te-defie-detre-heureux/);
        expect(lyrics).to.match(/jai-peur-doublier-jai-peur-daccepter-jai-peur-des-vivants-a-present-tes-beau$/);
        done();
      });
    });
    it('should find lyrics for M - Mama Sam', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Mama Sam', 'M').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/^quand-je-te-revois-mama-sam-je-retrouve-les-vraies-valeurs/);
        expect(lyrics).to.match(/non-je-ne-connais-pas-l-afrique-aigrie-est-ma-couleur-de-peau-la-vie-est-une-machine-a-fric-ou-les-affreux-non(t?)-pas-dafro$/);
        done();
      });
    });
    it('should find lyrics for Coldplay - Viva la Vida', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Viva la Vida', 'Coldplay').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/^i-used-to-rule-the-world-seas-would-rise-when-i-gave-the-word/);
        expect(lyrics).to.match(/for-some-reason-i-cant-explain-i-know-saint-peter-wont-call-my-name-never-an-honest-word-but-that-was-when-i-ruled-the-world/);
        done();
      });
    });
    it('should find lyrics for HYPHEN HYPHEN - Cause I Got A Chance', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Cause I Got A Chance', 'HYPHEN HYPHEN').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/^tonight-i-dont-wanna-cry-tonight-i-want-you-to-dance-with-me-tonight/);
        expect(lyrics).to.match(/ive-been-waiting-for-so-long-knew-you-always-thought-about-always-thought-about-me$/);
        done();
      });
    });
    it('should find lyrics for Calvin Harris - The Rain', function (done) {
      var lyricsQuery = alltomp3.findLyrics('The Rain', 'Calvin Harris').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/^shes-the-type-of-girl-that-makes-you-feel-better/);
        expect(lyrics).to.match(/these-are-the-good-times-in-your-life-so-put-on-a-smile-and-itll-be-((alright)|(all-right))/);
        done();
      });
    });
    it('should find lyrics for Sam Smith - Writing\'s on the Wall', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Writing\'s on the Wall', 'Sam Smith').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/^ive-been-here-before-but-always-hit-the-floor-ive-spent-a-lifetime-running-and-i-always-get-away/);
        expect(lyrics).to.match(/where-i-give-it-all-up-for-you-i-have-to-risk-it-all-cause-the-writings-on-the-wall$/);
        done();
      });
    });
    it('should find lyrics for C2C - Down The Road', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Down The Road', 'C2C').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/have-no-place-to-go-have-no-place-to-go-darling/);
        expect(lyrics).to.match(/when-that-train-rolls-up-and-i-come-walking-out/);
        done();
      });
    });
    it('should find lyrics for Galantis - Runaway (U & I)', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Runaway (U & I)', 'Galantis').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/think-i-can-fly-think-i-can-fly-when-im-with-u/);
        expect(lyrics).to.match(/i-know-that-im-rich-enough-for-pride-i-see-a-billion-dollars-in-your-eyes-even-if-were-strangers/);
        done();
      });
    });
    it('should find lyrics for Mika - Elle me dit', function (done) {
      var lyricsQuery = alltomp3.findLyrics('Elle me dit', 'Mika').then(function (lyrics) {
        lyrics = _.kebabCase(lyrics);

        expect(lyrics).to.match(/elle-me-dit-ecris-une-chanson-contente-pas-une-chanson-deprimante-une-chanson-que-tout-l((e-)?)monde-aime/);
        expect(lyrics).to.match(/pourquoi-tu-gaches-ta-vie-pourquoi-tu-gaches-ta-vie/);
        expect(lyrics).to.match(/regarde-un-peu-tes-amis-quest-c((e-)?)quils-vont-faire-de-leur-vie/);
        done();
      });
    });
  }
});
