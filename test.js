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

// alltomp3.downloadAndTagSingleURL('https://www.youtube.com/watch?v=6yx18TYmCAk', './', function(infos) {
//     console.log(infos);
// });

// var title = "hide and seek imogen heap";
// alltomp3.findVideo(title).then(function(results) {
//     var dl = alltomp3.downloadAndTagSingleURL(results[0].url, function(infos) {
//         console.log("FINI ", infos);
//     }, title);
//     dl.on('download', function(infos) {
//         process.stdout.cursorTo(0);
//         process.stdout.clearLine(1);
//         process.stdout.write(infos.progress + '%');
//     });
//     dl.on('download-end', function() {
//         console.log('Download end');
//     });
//     dl.on('convert', function(infos) {
//         process.stdout.cursorTo(0);
//         process.stdout.clearLine(1);
//         process.stdout.write(infos.progress + '%');
//     });
//     dl.on('convert-end', function() {
//         console.log('Convert end');
//     });
//     dl.on('infos', function(infos) {
//         console.log('Got infos: ', infos);
//     });
// });

// var dl = alltomp3.findAndDownload("imagine dragons on top of the world", "./mp3/", function (infos) {
//     console.log("It's finished: ", infos);
// });
// dl.on('search-end', function() {
//     console.log('Search end');
// });
// dl.on('download', function(infos) {
//     process.stdout.cursorTo(0);
//     process.stdout.clearLine(1);
//     process.stdout.write(infos.progress + '%');
// });
// dl.on('download-end', function() {
//     console.log('', 'Download end');
// });
// dl.on('convert', function(infos) {
//     process.stdout.cursorTo(0);
//     process.stdout.clearLine(1);
//     process.stdout.write(infos.progress + '%');
// });
// dl.on('convert-end', function() {
//     console.log('', 'Convert end');
// });
// dl.on('infos', function(infos) {
//     console.log('New infos received: ', infos);
// });

// alltomp3.guessTrackFromString('Imagine Dragons - On Top of the World - Lyrics').then(function(infos) {
//     console.log(infos);
// });
// alltomp3.guessTrackFromString('C2C - Happy Ft. D.Martin').then(function(infos) {
//     console.log(infos);
// });
// alltomp3.guessTrackFromString('David Guetta - Bang My Head (Official Video) feat Sia & Fetty Wap').then(function(infos) {
//     console.log(infos);
// });
// alltomp3.guessTrackFromString('David Guetta - Hey Mama (Official Video) ft Nicki Minaj, Bebe Rexha & Afrojack').then(function(infos) {
//     console.log(infos);
// });
// alltomp3.guessTrackFromString('hans zimmer no time for caution').then(function(infos) {
//     console.log(infos);
// });

// alltomp3.findLyrics('Radioactive', 'Imagine Dragons').then(function (lyrics) {
//         console.log(lyrics);
// }).catch(function() {
//     console.log('No lyrics');
// });

// alltomp3.getURLsInPlaylist('https://soundcloud.com/20syl/sets/20syl-remixes-2016').then(function(items) {
//     console.log(items);
// });

// alltomp3.getTracksInPlaylist('http://www.deezer.com/album/11111444').then(function(items) {
//     console.log(items);
// });

var urls;
var dl = alltomp3.downloadPlaylistWithURLs("https://www.youtube.com/watch?v=zriAamH8zmw&index=4&list=PLcpfarJLJAJ_aAahG3AB5e8X5nJ7cOPH6", "./mp3/", function (urls) {
    console.log("It's finished: ", urls);
}, 8);
dl.on('search-end', function() {
    console.log('Search end');
});
dl.on('download', function(index) {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(urls[index].progress.download.progress + '%');
});
dl.on('download-end', function() {
    console.log('', 'Download end');
});
dl.on('convert', function(index) {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(urls[index].progress.convert.progress + '%');
});
dl.on('convert-end', function(index) {
    console.log('', 'Convert end');
});
dl.on('error', function(index) {
    console.log('', 'Error with ' + index);
});
dl.on('infos', function(index) {
    // console.log('New infos received: ', infos);
});
dl.on('list', function(urlss) {
    urls = urlss;
    console.log('URLs received: ', urlss);
});
dl.on('begin-url', function(index) {
    console.log('Begin: ', index);
});
dl.on('end-url', function(index) {
    console.log('End: ', index);
});
