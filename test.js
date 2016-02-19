const alltomp3 = require('.');

alltomp3.getInfosWithYoutubeDl('https://soundcloud.com/taylorythm/coda', function(infos) {
    console.log(infos);
});
alltomp3.getInfosWithYoutubeDl('https://www.youtube.com/watch?v=e74VMNgARvY', function(infos) {
    console.log(infos);
});
var dl = alltomp3.downloadSingleURL('https://soundcloud.com/taylorythm/coda', 'test.mp3', '320k');
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
