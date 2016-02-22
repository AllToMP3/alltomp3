const alltomp3 = require('.');

// alltomp3.getInfosWithYoutubeDl('https://soundcloud.com/taylorythm/coda', function(infos) {
//     console.log(infos);
// });
// alltomp3.getInfosWithYoutubeDl('https://www.youtube.com/watch?v=e74VMNgARvY', function(infos) {
//     console.log(infos);
// });
// var dl = alltomp3.downloadSingleURL('https://www.youtube.com/watch?v=e74VMNgARvY', 'test.mp3', '320k');
// dl.on('download', function(infos) {
//     process.stdout.cursorTo(0);
//     process.stdout.clearLine(1);
//     process.stdout.write(infos.progress + '%');
// });
// dl.on('download-end', function() {
//     console.log('Download end');
// });
// dl.on('convert', function(infos) {
//     process.stdout.cursorTo(0);
//     process.stdout.clearLine(1);
//     process.stdout.write(infos.progress + '%');
// });

// alltomp3.guessTrackFromString('Imagine Dragons - On Top of the World - Lyrics', false, false, true);
// alltomp3.guessTrackFromString('C2C - Happy Ft. D.Martin', false, false, true);
// alltomp3.guessTrackFromString('David Guetta - Bang My Head (Official Video) feat Sia & Fetty Wap', false, false, true);
// alltomp3.guessTrackFromString('David Guetta - Hey Mama (Official Video) ft Nicki Minaj, Bebe Rexha & Afrojack', false, false, true);
// alltomp3.retrieveTrackInformations('On Top of the World', 'Imagine Dragons').then(function (infos) {
//     console.log("Infos: ", infos);
// });

// alltomp3.guessTrackFromFile('./test.mp3').then(function (infos) {
//     return alltomp3.retrieveTrackInformations(infos.title, infos.artistName);
// }).then(function (infos) {
//     console.log(infos);
//     alltomp3.tagFile('./test.mp3', infos);
// });

// alltomp3.downloadAndTagSingleURL('https://www.youtube.com/watch?v=YykjpeuMNEk', true);

var title = "hide and seek imogen heap";
alltomp3.findVideo(title).then(function(results) {
    var dl = alltomp3.downloadAndTagSingleURL(results[0].url, function(infos) {
        console.log("FINI ", infos);
    }, title);
    dl.on('download', function(infos) {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        process.stdout.write(infos.progress + '%');
    });
    dl.on('download-end', function() {
        console.log('Download end');
    });
    dl.on('convert', function(infos) {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        process.stdout.write(infos.progress + '%');
    });
    dl.on('convert-end', function() {
        console.log('Convert end');
    });
    dl.on('infos', function(infos) {
        console.log('Got infos: ', infos);
    });
});
