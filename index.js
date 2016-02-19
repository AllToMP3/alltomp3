const youtubedl = require('youtube-dl');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');

var at3 = {};

/**
 * Download a single video with youtube-dl
 * @param url
 * @param outputFile
 */
at3.downloadWithYoutubeDl = function(url, outputFile) {
    var download = youtubedl(url, ['-f', 'bestaudio']);
    const downloadEmitter = new EventEmitter();

    var size = 0;
    download.on('info', function(info) {
        size = info.size;

        downloadEmitter.emit('download-start', {
            size: size
        });

        download.pipe(fs.createWriteStream(outputFile));
    });

    var pos = 0;
    download.on('data', function data(chunk) {
        pos += chunk.length;

        if (size) {
            var percent = (pos / size * 100).toFixed(2);

            downloadEmitter.emit('download-progress', {
                downloaded: pos,
                progress: percent
            });
        }
    });

    download.on('end', function end() {
        downloadEmitter.emit('download-end');
    });

    return downloadEmitter;
};

/**
 * Convert a outputFile in MP3
 * @param inputFile
 * @param outputFile
 * @param bitrate string
 */
at3.convertInMP3 = function(inputFile, outputFile, bitrate) {
    const convertEmitter = new EventEmitter();

    var convert = ffmpeg(inputFile)
        .audioBitrate(bitrate)
        .audioCodec('libmp3lame')
        .on('codecData', function(data) {
            convertEmitter.emit('convert-start');
        })
        .on('progress', function(progress) {
            convertEmitter.emit('convert-progress', {
                progress: progress.percent
            });
        })
        .on('end', function() {
            fs.unlink(inputFile);
            convertEmitter.emit('convert-end');
        })
        .save(outputFile);

    return convertEmitter;
};

/**
 * Get infos about an online video with youtube-dl
 * @param url
 * @param callback
 */
at3.getInfosWithYoutubeDl = function(url, callback) {
    var infos = youtubedl.getInfo(url, function (err, infos) {
        callback({
            title: infos.title,
            author: infos.uploader,
            picture: infos.thumbnail
        });
    });
};

/**
 * Download a single URL in MP3
 * @param url
 * @param outputFile
 * @param bitrate
 */
at3.downloadSingleURL = function(url, outputFile, bitrate) {
    const progressEmitter = new EventEmitter();
    var tempFile = outputFile + '.video';

    var dl = at3.downloadWithYoutubeDl(url, tempFile);

    dl.on('download-start', function() {
        progressEmitter.emit('start');
    });
    dl.on('download-progress', function(infos) {
        progressEmitter.emit('download', {
            progress: infos.progress
        });
    });

    dl.on('download-end', function() {
        progressEmitter.emit('download-end');

        var convert = at3.convertInMP3(tempFile, outputFile, bitrate);

        convert.on('convert-progress', function(infos) {
            progressEmitter.emit('convert', {
                progress: infos.progress
            });
        });
        convert.on('convert-end', function() {
            progressEmitter.emit('end');
        });
    });

    return progressEmitter;
};

module.exports = at3;
