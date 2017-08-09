const youtubedl = require('youtube-dl');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events');
const request = require('request-promise');
const requestNoPromise = require('request');
const _ = require('lodash');
const acoustid = require('acoustid');
const EyeD3 = require('eyed3');
var eyed3 = new EyeD3({ eyed3_path: 'eyeD3' });
eyed3.metaHook = (m) => m;
const levenshtein = require('fast-levenshtein');
const randomstring = require('randomstring');
const cheerio = require('cheerio');
const Promise = require('bluebird');
const sharp = require('sharp');
const smartcrop = require('smartcrop-sharp');
const lcs = require('longest-common-substring');

// API keys
const API_ACOUSTID = 'lm59lNN597';
const API_GOOGLE = 'AIzaSyBCshUQSpLKuhmfE5Jc-LEm6vH-sab5Vl8';
const API_SOUNDCLOUD = 'dba290d84e6ca924414c91ac12fc3c8f';
const API_SPOTIFY = 'ODNiZjMzMmQ4MDI1NGNlNzhkNjNkOWM2ZWM2N2M5ZTU6Mzg4OTIxY2M0ZjEyNGEwYWFjM2NiMzIzYTNiZGVlYmU=';

var at3 = {};

// ISO 3166-1 alpha-2 country code of the user (ex: US, FR)
at3.regionCode;

// ISO 639-1 two-letter language code of the user (ex: en, fr)
at3.relevanceLanguage;

// Folder for temporary files
at3.tempFolder = null;

at3.configEyeD3 = function(eyeD3Path, eyeD3PathPythonPath, metaHook) {
  process.env.PYTHONPATH = eyeD3PathPythonPath;
  eyed3 = new EyeD3({ eyed3_path: eyeD3Path });
  if (!metaHook) {
    metaHook = (m) => m;
  }
  eyed3.metaHook = metaHook;
};

at3.FPCALC_PATH = "fpcalc";
at3.setFpcalcPath = function(fpcalcPath) {
  at3.FPCALC_PATH = fpcalcPath;
};

at3.setFfmpegPaths = function(ffmpegPath, ffprobePath) {
  if (ffmpegPath) {
    at3.FFMPEG_PATH = ffmpegPath;
  }
  if (ffprobePath) {
    at3.FFPROBE_PATH = ffprobePath;
  }
};

/**
* Find lyrics for a song
* @param title string
* @param artistName string
* @return Promise
*/
at3.findLyrics = function(title, artistName) {
  var promises = [];

  function textln(html) {
    html.find('br').replaceWith('\n');
    html.find('script').replaceWith('');
    html.find('#video-musictory').replaceWith('');
    html.find('strong').replaceWith('');
    html = _.trim(html.text());
    html = html.replace(/\r\n\n/g, '\n');
    html = html.replace(/\t/g, '');
    html = html.replace(/\n\r\n/g, '\n');
    html = html.replace(/ +/g, ' ');
    html = html.replace(/\n /g, '\n');
    return html;
  }

  function lyricsUrl(title) {
  	return _.kebabCase(_.trim(_.toLower(_.deburr(title))));
  }
  function lyricsManiaUrl(title) {
  	return _.snakeCase(_.trim(_.toLower(_.deburr(title))));
  }
  function lyricsManiaUrlAlt(title) {
    title = _.trim(_.toLower(title));
    title = title.replace("'", '');
    title = title.replace(' ', '_');
    title = title.replace(/_+/g, '_');
    return title;
  }

  var reqWikia = request({
    uri: 'http://lyrics.wikia.com/wiki/' + encodeURIComponent(artistName) + ':' + encodeURIComponent(title),
    transform: function (body) {
      return cheerio.load(body);
    }
  }).then(function($) {
    return textln($('.lyricbox'));
  });

  var reqParolesNet = request({
    uri: 'http://www.paroles.net/' + lyricsUrl(artistName) + '/paroles-' + lyricsUrl(title),
    transform: function (body) {
      return cheerio.load(body);
    }
  }).then(function($) {
    if ($('.song-text').length === 0) {
      return Promise.reject();
    }
    return textln($('.song-text'));
  });

  var reqLyricsMania1 = request({
    uri: 'http://www.lyricsmania.com/' + lyricsManiaUrl(title) + '_lyrics_' + lyricsManiaUrl(artistName) + '.html',
    transform: function (body) {
      return cheerio.load(body);
    }
  }).then(function($) {
    if ($('.lyrics-body').length === 0) {
      return Promise.reject();
    }
    return textln($('.lyrics-body'));
  });

  var reqLyricsMania2 = request({
    uri: 'http://www.lyricsmania.com/' + lyricsManiaUrl(title) + '_' + lyricsManiaUrl(artistName) + '.html',
    transform: function (body) {
      return cheerio.load(body);
    }
  }).then(function($) {
    if ($('.lyrics-body').length === 0) {
      return Promise.reject();
    }
    return textln($('.lyrics-body'));
  });

  var reqLyricsMania3 = request({
    uri: 'http://www.lyricsmania.com/' + lyricsManiaUrlAlt(title) + '_lyrics_' + encodeURIComponent(lyricsManiaUrlAlt(artistName)) + '.html',
    transform: function (body) {
      return cheerio.load(body);
    }
  }).then(function($) {
    if ($('.lyrics-body').length === 0) {
      return Promise.reject();
    }

    return textln($('.lyrics-body'));
  });

  var reqSweetLyrics = request({
    method: 'POST',
    uri: 'http://www.sweetslyrics.com/search.php',
    form: {
      search: 'title',
      searchtext: title
    },
    transform: function (body) {
      return cheerio.load(body);
    }
  }).then(function($) {
    var closestLink, closestScore = -1;
    _.forEach($('.search_results_row_color'), function (e) {
      var artist = $(e).text().replace(/ - .+$/, '');
      var currentScore = levenshtein.get(artistName, artist);
      if (closestScore == -1 || currentScore < closestScore) {
        closestScore = currentScore;
        closestLink = $(e).find('a').last().attr('href');
      }
    });
    if (!closestLink) {
      return Promise.reject();
    }
    return request({
      uri: 'http://www.sweetslyrics.com/' + closestLink,
      transform: function (body) {
        return cheerio.load(body);
      }
    });
  }).then(function($) {
    return textln($('.lyric_full_text'));
  });

  if (/\(.*\)/.test(title) || /\[.*\]/.test(title)) {
    promises.push(at3.findLyrics(title.replace(/\(.*\)/g, '').replace(/\[.*\]/g, ''), artistName));
  }

  promises.push(reqWikia);
  promises.push(reqParolesNet);
  promises.push(reqLyricsMania1);
  promises.push(reqLyricsMania2);
  promises.push(reqLyricsMania3);
  promises.push(reqSweetLyrics);

  return Promise.any(promises).then(function(lyrics) {
    return lyrics;
  });
};

/**
* Returns true if the query corresponds
* to an URL, else false
* @param query string
* @return boolean
*/
at3.isURL = function(query) {
  return /^http(s?):\/\//.test(query);
};

/**
 * Get a fresh access token from Spotify API
 * @return {Promise}
 */
at3.spotifyToken = function() {
  return request.post({
    uri: 'https://accounts.spotify.com/api/token',
    headers: {
      'Authorization': 'Basic ' + API_SPOTIFY
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  }).then(r => {
    return r.access_token;
  });
};

/**
* Download a single video with youtube-dl
* @param url
* @param outputFile
* @return Event
*/
at3.downloadWithYoutubeDl = function(url, outputFile) {
  var download = youtubedl(url, ['-f', 'bestaudio/best', '--no-check-certificate'], {maxBuffer: Infinity});
  const downloadEmitter = new EventEmitter();
  var aborted = false;

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
    if (aborted) {
      abort();
    }
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
    if (aborted) {
      return;
    }
    downloadEmitter.emit('download-end');
  });

  download.on('error', function(error) {
    downloadEmitter.emit('error', new Error(error));
  });

  function abort() {
    aborted = true;
    if (download._source && download._source.stream) {
      download._source.stream.abort();
    }
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }
  }

  downloadEmitter.on('abort', abort);

  return downloadEmitter;
};

/**
* Convert a outputFile in MP3
* @param inputFile
* @param outputFile
* @param bitrate string
* @return Event
*/
at3.convertInMP3 = function(inputFile, outputFile, bitrate) {
  const convertEmitter = new EventEmitter();
  var aborted = false;
  var started = false;

  var convert = ffmpeg(inputFile);
  if (at3.FFMPEG_PATH) {
    convert.setFfmpegPath(at3.FFMPEG_PATH);
  }
  if (at3.FFPROBE_PATH) {
    convert.setFfprobePath(at3.FFPROBE_PATH);
  }
  convert.audioBitrate(bitrate)
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
    fs.unlinkSync(inputFile);
    convertEmitter.emit('convert-end');
  })
  .on('error', e => {
    if (!aborted) {
      convertEmitter.emit('error', e);
    } else {
      if (fs.existsSync(inputFile)) {
        fs.unlink(inputFile, () => {});
      }
      if (fs.existsSync(outputFile)) {
        fs.unlink(outputFile, () => {});
      }
    }
  })
  .on('start', () => {
    started = true;
    if (aborted) {
      abort();
    }
  })
  .save(outputFile);

  function abort() {
    aborted = true;
    if (started) {
      convert.kill();
    }
  }

  convertEmitter.on('abort', abort);

  return convertEmitter;
};

/**
* Get infos about an online video with youtube-dl
* @param url
* @return Promise
*/
at3.getInfosWithYoutubeDl = function(url) {
  return new Promise(function (resolve, reject) {
    youtubedl.getInfo(url, ['--no-check-certificate'], function (err, infos) {
      if (err || infos === undefined) {
        reject();
      } else {
        resolve({
          title: infos.title,
          author: infos.uploader,
          picture: infos.thumbnail
        });
      }
    });
  });
};

/**
* Download a single URL in MP3
* @param url
* @param outputFile
* @param bitrate
* @return Event
*/
at3.downloadSingleURL = function(url, outputFile, bitrate) {
  const progressEmitter = new EventEmitter();
  var tempFile = outputFile + '.video';
  var downloadEnded = false;
  var convert;

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
    downloadEnded = true;
    progressEmitter.emit('download-end');

    convert = at3.convertInMP3(tempFile, outputFile, bitrate);

    convert.on('convert-progress', function(infos) {
      progressEmitter.emit('convert', {
        progress: infos.progress
      });
    });
    convert.on('convert-end', function() {
      progressEmitter.emit('end');
    });
  });

  dl.on('error', function(error) {
    progressEmitter.emit('error', new Error(error));
  });

  progressEmitter.on('abort', () => {
    if (!downloadEnded) {
      dl.emit('abort');
    } else {
      convert.emit('abort');
    }
  });

  return progressEmitter;
};

/**
* Try to find to title and artist from a string
* (example: a YouTube video title)
* @param query string
* @param exact boolean Can the query be modified or not
* @param last boolean Last call
* @param v boolean Verbose
* @return Promise
*/
at3.guessTrackFromString = function(query, exact, last, v) {
  // [TODO] Replace exact by a level of strictness
  // 0: no change at all
  // 4: remove every thing useless
  if (exact === undefined) {
    exact = false;
  }
  if (last === undefined) {
    last = false;
  }
  if (v === undefined) {
    v = false;
  }

  if (v) {
    console.log("Query: ", query);
  }

  var searchq = query;
  if (!exact) {
    searchq = searchq.replace(/\(.*\)/g, '');
    searchq = searchq.replace(/\[.*\]/g, '');
    searchq = searchq.replace(/lyric(s?)|parole(s?)/ig, '');
    searchq = searchq.replace(/^'/, '');
    searchq = searchq.replace(/ '/g, ' ');
    searchq = searchq.replace(/' /g, ' ');
    searchq = searchq.replace(/Original Motion Picture Soundtrack/i, '');
    searchq = searchq.replace(/bande originale/i, '');
  }

  var requests = [];
  var infos = {
    title: null,
    artistName: null,
  };

  // We search on Deezer and iTunes
  // [TODO] Adding Spotify

  // Deezer
  var requestDeezer = request({
    url: 'https://api.deezer.com/2.0/search?q=' + encodeURIComponent(searchq),
    json: true
  }).then(function (body) {
    var title, artistName, tempTitle;
    _.forEach(body.data, function (s) {
      if (!title) {
        if (vsimpleName(searchq,exact).replace(new RegExp(vsimpleName(s.artist.name), 'ig'))) {
          if (delArtist(s.artist.name, searchq, exact).match(new RegExp(vsimpleName(s.title_short), 'ig')) || vsimpleName(s.title_short).match(new RegExp(delArtist(s.artist.name, searchq, exact), 'ig'))) {
            artistName = s.artist.name;
            title = s.title;
          } else if(!artistName) {
            artistName = s.artist.name;
            tempTitle = s.title;
          }
        }
      }
    });
    if (title && artistName) {
      infos.title = title;
      infos.artistName = artistName;
    }
    if (v) {
      console.log("Deezer answer: ", title, '-', artistName);
    }
  });

  // iTunes
  var requestiTunes = request({
    url: 'https://itunes.apple.com/search?media=music&term=' + encodeURIComponent(searchq),
    json: true
  }).then(function (body) {
    var title, artistName, tempTitle;
    _.forEach(body.results, function (s) {
      if (!title) {
        if (vsimpleName(searchq, exact).match(new RegExp(vsimpleName(s.artistName), 'gi'))) {
          if(delArtist(s.artistName, searchq, exact).match(new RegExp(vsimpleName(s.trackCensoredName), 'gi'))) {
            artistName = s.artistName;
            title = s.trackCensoredName;
          } else if (delArtist(s.artistName, searchq, exact).match(new RegExp(vsimpleName(s.trackName), 'gi'))) {
            artistName = s.artistName;
            title = s.trackName;
          } else if (!artistName) {
            artistName = s.artistName;
            temp_title = s.trackName;
          }
        }
      }
    });
    if (title && artistName) {
      infos.title = title;
      infos.artistName = artistName;
    }
    if (v) {
      console.log("iTunes answer: ", title, '-', artistName);
    }
  });

  requests.push(requestDeezer);
  requests.push(requestiTunes);

  return Promise.all(requests).then(function() {
    if (!last && (!infos.title || !infos.artistName)) {
      searchq = searchq.replace(/f(ea)?t(\.)? [^-]+/ig,' ');
      return at3.guessTrackFromString(searchq, false, true, v);
    }
    return infos;
  });

};

/**
* Try to guess title and artist from mp3 file
* @param file
* @return Promise
*/
at3.guessTrackFromFile = function (file) {
  return new Promise(function (resolve, reject) {
    acoustid(file, { key: API_ACOUSTID, fpcalc: { command: at3.FPCALC_PATH } }, function (err, results) {
      if (err || results.length === 0 || !results[0].recordings || results[0].recordings.length === 0 || !results[0].recordings[0].artists || results[0].recordings[0].artists.length === 0) {
        resolve({});
        return;
      }
      resolve({
        title: results[0].recordings[0].title,
        artistName: results[0].recordings[0].artists[0].name
      });
    });
  });
};


/**
* Retrieve informations about a track from artist and title
* @param title
* @param artistName
* @param exact boolean Exact search or not
* @param v boolean Verbose
* @return Promise
*/
at3.retrieveTrackInformations = function (title, artistName, exact, v) {
  if (exact === undefined) {
    exact = false;
  }
  if (v === undefined) {
    v = false;
  }

  if (!exact) {
    title = title.replace(/((\[)|(\())?radio edit((\])|(\)))?/ig, '');
  }

  var infos = {
    title: title,
    artistName: artistName
  };

  var requests = [];

  var requestDeezer = request({
    url: 'https://api.deezer.com/2.0/search?q=' + encodeURIComponent(artistName + ' ' + title),
    json: true
  }).then(function (body) {
    var deezerInfos;
    _.forEach(body.data, function (s) {
      if(!infos.deezerId && imatch(vsimpleName(title), vsimpleName(s.title)) && imatch(vsimpleName(artistName), vsimpleName(s.artist.name))) {
        infos.deezerId = s.id;
        deezerInfos = _.clone(s);
      }
    });
    if (infos.deezerId) {
      infos.artistName = deezerInfos.artist.name;
      infos.title = deezerInfos.title;

      return at3.getDeezerTrackInfos(infos.deezerId, v).then(function (deezerInfos) {
        infos = deezerInfos;
      }).catch(function () {

      });
    }
  });

  var requestiTunes = request({
    url: 'https://itunes.apple.com/search?media=music&term=' + encodeURIComponent(artistName + ' ' + title),
    json: true
  }).then(function (body) {
    var itunesInfos;
    _.forEach(body.results, function (s) {
      if (!infos.itunesId && (imatch(vsimpleName(title), vsimpleName(s.trackName)) || imatch(vsimpleName(title), vsimpleName(s.trackCensoredName))) && imatch(vsimpleName(artistName), vsimpleName(s.artistName))) {
        infos.itunesId = s.trackId;
        itunesInfos = _.clone(s);
      }
    });
    if (!infos.deezerId && itunesInfos) {
      infos.artistName = itunesInfos.artistName;
      if (imatch(vsimpleName(infos.title), vsimpleName(itunesInfos.trackName))) {
        infos.title = itunesInfos.trackName;
      } else {
        infos.title = itunesInfos.trackCensoredName;
      }
      infos.itunesAlbum = itunesInfos.collectionId;
      infos.position = itunesInfos.trackNumber;
      infos.nbTracks = itunesInfos.trackCount;
      infos.album = itunesInfos.collectionName;
      infos.releaseDate = itunesInfos.releaseDate.replace(/T.+/, '');
      infos.cover = itunesInfos.artworkUrl100.replace('100x100', '200x200');
      infos.genre = itunesInfos.primaryGenreName;
      infos.discNumber = itunesInfos.discNumber;
      infos.duration = itunesInfos.trackTimeMillis/1000;
    }

    if (v) {
      console.log("iTunes infos: ", itunesInfos);
    }
  });

  requests.push(requestDeezer);
  requests.push(requestiTunes);

  return Promise.all(requests).then(function () {
    return infos;
  });
};

/**
* Retrieve detailed infos about a Deezer Track
* @param trackId
* @param v boolean Verbosity
* @return Promise(trackInfos)
*/
at3.getDeezerTrackInfos = function(trackId, v) {
  var infos = {
    deezerId: trackId
  };

  return request({
    url: 'https://api.deezer.com/2.0/track/' + infos.deezerId,
    json: true
  }).then(function (trackInfos) {
    if (trackInfos.error) {
      return Promise.reject();
    }

    infos.title = trackInfos.title;
    infos.artistName = trackInfos.artist.name;
    infos.position = trackInfos.track_position;
    infos.duration = trackInfos.duration;
    infos.deezerAlbum = trackInfos.album.id;
    infos.discNumber = trackInfos.disk_number;

    return request({
      url: 'https://api.deezer.com/2.0/album/' + infos.deezerAlbum,
      json: true
    });
  }).then(function (albumInfos) {
    infos.album = albumInfos.title;
    infos.releaseDate = albumInfos.release_date;
    infos.nbTracks = albumInfos.tracks.data.length;
    infos.genreId = albumInfos.genre_id;
    infos.cover = albumInfos.cover_big;

    return request({
      url: 'https://api.deezer.com/2.0/genre/' + infos.genreId,
      json: true
    });
  }).then(function (genreInfos) {
    infos.genre = genreInfos.name;

    if (v) {
      console.log("Deezer infos: ", infos);
    }

    return infos;
  });
};

/**
 * Get complete information (title, artist, release date, genre, album name...)
 * for a Spotify track
 * @param {trackId} string The Spotify track id
 * @param {v} boolean The verbosity
 * @return Promise
 */
at3.getSpotifyTrackInfos = function (trackId, v) {
  let infos = {
    spotifyId: trackId
  };
  let token;

  return at3.spotifyToken().then(t => {
    token = t;

    // 1. Get track object
    // 2. Get album object
    return request({
      uri: 'https://api.spotify.com/v1/tracks/' + trackId,
      json: true,
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }).then(trackInfos => {
    infos.title = trackInfos.name;
    infos.artistName = trackInfos.artists[0].name;
    infos.duration = Math.ceil(trackInfos.duration_ms/1000);
    infos.position = trackInfos.track_number;
    infos.discNumber = trackInfos.disc_number;
    infos.spotifyAlbum = trackInfos.album.id;

    return request({
      uri: 'https://api.spotify.com/v1/albums/' + trackInfos.album.id,
      json: true,
      headers: {
        Authorization: 'Bearer ' + token
      }
    });
  }).then(albumInfos => {
    infos.album = albumInfos.name;
    infos.cover = albumInfos.images[0].url;
    infos.genre = albumInfos.genres[0] || '';
    infos.nbTracks = albumInfos.tracks.total;
    infos.releaseDate = albumInfos.release_date;

    return infos;
  });
};

/**
* Add tags to MP3 file
* @param file
* @param infos
* @return Promise
*/
at3.tagFile = function (file, infos) {
  var meta = {
    title: infos.title,
    artist: infos.artistName
  };
  if (infos.album) {
    meta.album = infos.album;
  }
  if (infos.position) {
    meta.track = infos.position;
  }
  if (infos.nbTracks) {
    meta.trackTotal = infos.nbTracks;
  }
  if (infos.discNumber) {
    meta.disc = infos.discNumber;
  }
  if (infos.lyrics) {
    meta.lyrics = infos.lyrics;
  }
  if (infos.releaseDate) {
    meta.year = (/[0-9]{4}/.exec(infos.releaseDate))[0];
  }
  if (infos.genre) {
    meta.genre = infos.genre.replace(/\/.+/g, '');
  }

  return new Promise(function (resolve, reject) {
    eyed3.updateMeta(file, eyed3.metaHook(meta), function (err) {
      if (err) {
        return reject(err);
      }
      if (infos.cover) {
        var coverPath = file + '.cover.jpg';

        requestNoPromise(infos.cover, function () {

          // Check that the cover is a square
          const coverFile = sharp(coverPath);
          coverFile.metadata().then(metadata => {
            if (metadata.width != metadata.height) {
              // In that case we will crop the cover to get a square
              const tempCoverPath = file + '.cover.resized.jpg';
              return smartcrop.crop(coverPath, {width: 100, height: 100}).then(function(result) {
                var crop = result.topCrop;
                return coverFile
                .extract({width: crop.width, height: crop.height, left: crop.x, top: crop.y})
                .toFile(tempCoverPath);
              }).then(() => {
                fs.renameSync(tempCoverPath, coverPath);
              });
            }
          }).then(() => {
            eyed3.updateMeta(file, eyed3.metaHook({image: coverPath}), function (err) {
              fs.unlinkSync(coverPath);

              if (err) {
                return reject(err);
              }

              resolve();
            });
          });
        }).pipe(fs.createWriteStream(coverPath));
      } else {
        resolve();
      }
    });
  });

};

/**
* Search and return complete information about a single video url
* @param url
* @param v boolean Verbosity
* @return Promise(object)
*/
at3.getCompleteInfosFromURL = function(url, v) {
  var infosFromString;
  // Try to find information based on video title
  return at3.getInfosWithYoutubeDl(url).then(function(videoInfos) {
    infosFromString = {
      title: videoInfos.title,
      artistName: videoInfos.author,
      cover: videoInfos.picture.replace('hqdefault', 'mqdefault'), // [TODO]: getting a better resolution and removing the black borders
      originalTitle: videoInfos.title
    };

    if (v) {
      console.log("Video infos: ", infosFromString);
    }

    // progressEmitter.emit('infos', _.clone(infosFromString));

    return at3.guessTrackFromString(videoInfos.title, false, false, v);
  }).then(function (guessStringInfos) {
    if (guessStringInfos.title && guessStringInfos.artistName) {
      return at3.retrieveTrackInformations(guessStringInfos.title, guessStringInfos.artistName, false, v);
    } else {
      return Promise.resolve();
    }
  }).then(function (guessStringInfos) {
    if (guessStringInfos) {
      guessStringInfos.originalTitle = infosFromString.originalTitle;
      infosFromString = guessStringInfos;
      // progressEmitter.emit('infos', _.clone(infosFromString));
      if (v) {
        console.log("guessStringInfos: ", guessStringInfos);
      }
    } else {
      if (v) {
        console.log('Cannot retrieve detailed information from video title');
      }
    }

    return infosFromString;
  }).catch(function(error) {
    // The download must have failed to, and emit an error
  });
};

/**
* Identify the song from a file and then search complete information about it
* @param file string
* @param v boolean Verbosity
* @return Promise(object)
*/
at3.getCompleteInfosFromFile = function(file, v) {
  return at3.guessTrackFromFile(file).then(function (guessFileInfos) {
    if (guessFileInfos.title && guessFileInfos.artistName) {
      return at3.retrieveTrackInformations(guessFileInfos.title, guessFileInfos.artistName, false, v);
    } else {
      return Promise.resolve();
    }
  }).then(function (guessFileInfos) {
    if (guessFileInfos) {
      if (v) {
        console.log("guessFileInfos: ", guessFileInfos);
      }
      return guessFileInfos;
    } else {
      if (v) {
        console.log('Cannot retrieve detailed information from MP3 file');
      }
    }
  });
};

/**
* Simplify a string so it works well as a filename
* @param {String} string
* @return {String}
*/
at3.escapeForFilename = (string) => {
    return _.startCase(_.toLower(_.deburr(string)))
        .replace(/^\.+/, '')
        .replace(/\.+$/, '');
};

/**
* Return a correctly formatted filename for a song.
* Example: "02 - On Top Of The World"
* @param title string Title of the song
* @param artist string Artist
* @param position int Position on the disk
* @return string
*/
at3.formatSongFilename = function (title, artist, position) {
  let filename = at3.escapeForFilename(artist) + ' - ';
  if (position) {
  if (position < 10) {
    filename += "0";
  }
    filename += position + " - ";
  }

  filename += at3.escapeForFilename(title);

  return filename;
};

/**
* Create necessary folders for a subpath
* @param baseFolder {string} The path of the outputfolder
* @param subPathFormat {string} The subPath format: {artist}/{title}/
* @param title {string} Title
* @param artist {string} Artist
* @return {String} The complete path
*/
at3.createSubPath = function (baseFolder, subPathFormat, title, artist) {
  subPathFormat = subPathFormat.replace(/\{artist\}/g, at3.escapeForFilename(artist));
  subPathFormat = subPathFormat.replace(/\{title\}/g, at3.escapeForFilename(title));

  let p = path.join(baseFolder, subPathFormat);
  if (p.charAt(p.length-1) != path.sep) {
    p += path.sep;
  }

  let folders = subPathFormat.split(path.sep);
  let currentFolder = baseFolder;
  folders.forEach(f => {
    currentFolder = path.join(currentFolder, f);
    if (!fs.existsSync(currentFolder)) {
      fs.mkdirSync(currentFolder);
    }
  });

  return p;
};

/**
* Download and convert a single URL,
* retrieve and add tags to the MP3 file
* @param url
* @param outputFolder
* @param callback Callback function
* @param title string Optional requested title
* @param infos object Basic infos to tag the file
* @param v boolean Verbosity
* @return Event
*/
at3.downloadAndTagSingleURL = function (url, outputFolder, callback, title, v, infos) {
  if (v === undefined) {
    v = false;
  }
  if (callback === undefined) {
    callback = function() {};
  }
  if (outputFolder.charAt(outputFolder.length-1) != path.sep) {
    outputFolder += path.sep;
  }
  title = title || '';

  const progressEmitter = new EventEmitter();

  var tempFile = (at3.tempFolder || outputFolder) + randomstring.generate(10) + '.mp3';

  // Download and convert file
  var dl = at3.downloadSingleURL(url, tempFile, '256k');
  dl.on('download', function(infos) {
    progressEmitter.emit('download', infos);
  });
  dl.on('download-end', function() {
    progressEmitter.emit('download-end');
  });
  dl.on('convert', function(infos) {
    progressEmitter.emit('convert', infos, infos);
  });
  dl.on('error', function(error) {
    callback(null, 'error');
    progressEmitter.emit('error', new Error(error));
  });
  progressEmitter.on('abort', () => {
    dl.emit('abort');
  });

  var infosFromString, infosFromFile, infosRequests = [];

  if (infos && infos.deezerId) {
    // If deezer track id is provided, with fetch more information
    var getMoreInfos = at3.getDeezerTrackInfos(infos.deezerId, v).then(function (inf) {
      infosFromString = inf;
    }).catch(function () {
      infosFromString = {
        title: infos.title,
        artistName: infos.artistName
      }
    });

    infosRequests.push(getMoreInfos);
  } else if (infos && infos.spotifyId) {
    // If spotify track id is provided, with fetch more information
    let getMoreInfos = at3.getSpotifyTrackInfos(infos.spotifyId, v).then(function (inf) {
      infosFromString = inf;
    }).catch(function () {
      infosFromString = {
        title: infos.title,
        artistName: infos.artistName
      }
    });
    infosRequests.push(getMoreInfos);
  } else {
    // Try to find information based on video title
    var getStringInfos = at3.getCompleteInfosFromURL(url, v).then(function(inf) {
      if (title === undefined) {
        title = inf.originalTitle;
      }
      infosFromString = inf;
      progressEmitter.emit('infos', _.clone(infosFromString));
    }).catch(function() {
      // The download must have failed to, and emit an error
    });

    infosRequests.push(getStringInfos);
  }

  // Try to find information based on MP3 file when dl is finished
  dl.once('end', function() {
    progressEmitter.emit('convert-end');

    if (!infos || (!infos.deezerId && !infos.spotifyId)) {
      var getFileInfos = at3.getCompleteInfosFromFile(tempFile, v).then(function(inf) {
        infosFromFile = inf;
        if (infosFromFile && infosFromFile.title && infosFromFile.artistName) {
          progressEmitter.emit('infos', _.clone(infosFromFile));
        }
      });

      infosRequests.push(getFileInfos);
    }

    // [TODO] Improve network issue resistance
    Promise.all(infosRequests).then(function() {
      // ça on peut garder
      var infos = infosFromString;
      if (infosFromFile) {
        var scoreFromFile = Math.min(
          levenshtein.get(simpleName(infosFromFile.title + ' ' + infosFromFile.artistName), simpleName(title)),
          levenshtein.get(simpleName(infosFromFile.artistName + ' ' + infosFromFile.title), simpleName(title))
        );
        var scoreFromString = Math.min(
          levenshtein.get(simpleName(infosFromString.title + ' ' + infosFromString.artistName), simpleName(title)),
          levenshtein.get(simpleName(infosFromString.artistName + ' ' + infosFromString.title), simpleName(title))
        );

        if (v) {
          console.log("Infos from file score: ", scoreFromFile);
          console.log("Infos from string score: ", scoreFromString);
        }

        if (infosFromFile.cover && scoreFromFile < (scoreFromString + Math.ceil(simpleName(title).length/10.0))) {
          infos = infosFromFile;
        }
      }

      progressEmitter.emit('infos', _.clone(infos));

      if (v) {
        console.log('Final infos: ', infos);
      }

      at3.findLyrics(infos.title, infos.artistName).then(function(lyrics) {
        return new Promise((resolve, reject) => {
          fs.writeFile(tempFile + '.lyrics', lyrics, (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }).then(function() {
        infos.lyrics = tempFile + '.lyrics';
      }).catch(function() {
        // no lyrics
      }).finally(function() {
        return at3.tagFile(tempFile, infos);
      }).then(function() {
        var finalFile = outputFolder;
        finalFile += at3.formatSongFilename(infos.title, infos.artistName, infos.position) + '.mp3';
        fs.moveSync(tempFile, finalFile, { overwrite: true });
        if (infos.lyrics) {
          fs.unlinkSync(tempFile + '.lyrics');
        }
        var finalInfos = {
          infos: infos,
          file: finalFile
        };
        progressEmitter.emit('end', finalInfos);
        callback(finalInfos);
      }).catch(err => {
        progressEmitter.emit('error', err);
      });
    });
  });

  return progressEmitter;
};

/**
* Search a query on YouTube and return the detailed results
* @param query string
* @param regionCode string ISO 3166-1 alpha-2 country code (ex: FR, US)
* @param relevanceLanguage string ISO 639-1 two-letter language code (ex: en: fr)
* @param v boolean Verbosity
* @return Promise
*/
at3.searchOnYoutube = function(query, regionCode, relevanceLanguage, v) {
  if (v === undefined) {
    v = false;
  }
  if (regionCode === undefined && relevanceLanguage === undefined) {
    regionCode = 'US';
  }

  /**
  * Remove useless information in the title
  * like (audio only), (lyrics)...
  * @param title string
  * @return string
  */
  function improveTitle(title) {
    var useless = [
      'audio only',
      'audio',
      'paroles/lyrics',
      'lyrics/paroles',
      'with lyrics',
      'w/lyrics',
      'w / lyrics',
      'avec paroles',
      'avec les paroles',
      'avec parole',
      'lyrics',
      'paroles',
      'parole',
      'radio edit.',
      'radio edit',
      'radio-edit',
      'shazam version',
      'shazam v...',
      'music video',
      'clip officiel',
      'officiel',
      'new song',
      'official video',
      'official'
    ];

    _.forEach(useless, function (u) {
      title = title.replace(new RegExp('((\\\(|\\\[)?)( ?)' + u + '( ?)((\\\)|\\\])?)', 'gi'), '');
    });

    title = title.replace(new RegExp('(\\\(|\\\[)( ?)hd( ?)(\\\)|\\\])', 'gi'), '');
    title = title.replace(new RegExp('hd','gi'), '');
    title = _.trim(title);

    return title;
  }

  /**
  * Returns an ISO 8601 Time as PT3M6S (=3min and 6seconds)
  * in seconds
  */
  function parseTime(time) {
    time = time.replace('PT','');
    time = time.replace('S', '');
    if (/M/.test(time)) {
      time = time.split('M');
      return (parseInt(time[0])*60 + (parseInt(time[1]) || 0));
    } else {
      return parseInt(time[0]);
    }
  }

  var results = [];

  // We simply search on YouTube
  let localePart;
  if (regionCode) {
    localePart = '&regionCode=' + regionCode;
  } else if (relevanceLanguage) {
    localePart = '&relevanceLanguage=' + relevanceLanguage;
  }
  return request({
    url: 'https://www.googleapis.com/youtube/v3/search?part=snippet&key=' + API_GOOGLE + localePart + '&maxResults=15&q=' + encodeURIComponent(query),
    json: true
  }).then(function (body) {
    if (!body.items || body.items.length === 0) {
      return Promise.reject();
    }

    var requests = [];

    _.forEach(body.items, function (s) {
      if (!s.id.videoId) {
        return;
      }

      var req = request({
        url: 'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&key=' + API_GOOGLE + '&id=' + s.id.videoId,
        json: true
      }).then(function (video) {
        video = video.items[0];
        var ratio = 1.0;
        if (!video.statistics) {
          return;
        }
        if (video.statistics.dislikeCount > 0) {
          ratio = video.statistics.likeCount / video.statistics.dislikeCount;
        }
        if (ratio === 0) {
          ratio = 1;
        }
        var realLike = (video.statistics.likeCount - video.statistics.dislikeCount) * ratio;

        results.push({
          id: video.id,
          url: 'https://www.youtube.com/watch?v=' + video.id,
          title: improveTitle(video.snippet.title),
          hd: (video.contentDetails.definition == 'hd'),
          duration: parseTime(video.contentDetails.duration),
          views: parseInt(video.statistics.viewCount),
          realLike: realLike
        });
      });

      requests.push(req);
    });
    return Promise.all(requests);
  }).then(function() {
    return results;
  });
};

/**
* @param song Object Searched song
* @param videos Array List of videos
* @param v boolean Verbosity
*/
at3.findBestVideo = function(song, videos, v) {
  if (v === undefined) {
    v = false;
  }

  /**
  * Returns the score of a video, comparing to the request
  * @param song Object Searched song
  * @param video object
  * @param largestRealLike
  * @param largestViews
  * @return Object
  */
  function score(song, video, largestRealLike, largestViews) {
    // weight of each argument
    let weights = {
      title: 30,
      hd: 0.3,
      duration: 20,
      views: 10,
      realLike: 15
    };

    let duration = song.duration || video.duration;

    // Score for title
    let videoTitle = ' ' + _.lowerCase(video.title) + ' ';
    let songTitle = ' ' + _.lowerCase(song.title) + ' '; // we add spaces to help longest-common-substring
    let songArtist = ' ' + _.lowerCase(song.artistName) + ' '; // (example: the artist "M")

    // for longest-common-substring, which works with arrays
    let videoTitlea = videoTitle.split('');
    let songTitlea = songTitle.split('');
    let songArtista = songArtist.split('');

    let videoSongTitle = lcs(videoTitlea, songTitlea);
    if (videoSongTitle.length > 0 && videoSongTitle.startString2 === 0 && videoTitle[videoSongTitle.startString1 + videoSongTitle.length - 1] == ' ') { // The substring must start at the beginning of the song title, and the next char in the video title must be a space
      videoTitle = videoTitle.substring(0, videoSongTitle.startString1) + ' ' + videoTitle.substring(videoSongTitle.startString1 + videoSongTitle.length);
      videoTitlea = videoTitle.split('');
    }
    let videoSongArtist = lcs(videoTitlea, songArtista);
    if (videoSongArtist.length > 0 && videoSongArtist.startString2 === 0 && videoTitle[videoSongArtist.startString1 + videoSongArtist.length - 1] == ' ') { // The substring must start at the beginning of the song title, and the next char in the video title must be a space
      videoTitle = videoTitle.substring(0, videoSongArtist.startString1) + videoTitle.substring(videoSongArtist.startString1 + videoSongArtist.length);
    }


    videoTitle = _.lowerCase(videoTitle);
    let sTitle = videoTitle.length + (songTitle.length - videoSongTitle.length) + (songArtist.length - videoSongArtist.length);

    let videoScore = {
      title: sTitle*weights.title,
      hd: video.hd*weights.hd,
      duration: Math.sqrt(Math.abs(video.duration - duration))*weights.duration,
      views: (video.views/largestViews)*weights.views,
      realLike: (video.realLike/largestRealLike)*weights.realLike || -50 // video.realLike is NaN when the likes has been deactivated, which is a very bad sign
    };
    video.videoScore = videoScore;

    let preVideoScore = videoScore.views + videoScore.realLike - videoScore.title - videoScore.duration;
    preVideoScore = preVideoScore + Math.abs(preVideoScore)*videoScore.hd;

    return preVideoScore;
  }

  var largestRealLike = _.reduce(videos, function (v, r) {
    if (r.realLike > v) {
      return r.realLike;
    }
    return v;
  }, 0);
  var largestViews = _.reduce(videos, function (v, r) {
    if (r.views > v) {
      return r.views;
    }
    return v;
  }, 0);

  _.forEach(videos, function(r) {
    r.score = score(song, r, largestRealLike, largestViews);
  });

  return _.reverse(_.sortBy(videos, 'score'));
};


/**
* Try to find the best video matching a song
* @param song Object Searched song
* @param v boolean Verbosity
* @return Promise
*/
at3.findVideoForSong = function(song, v) {
  if (v === undefined) {
    v = false;
  }

  let query = song.title + ' - ' + song.artistName;
  return at3.searchOnYoutube(query, at3.regionCode, at3.relevanceLanguage, v).then(youtubeResults => {
    return at3.findBestVideo(song, youtubeResults, v);
  });
};

// [TODO] we could also add a method that just take the first youtube video and download it
/**
* Try to find the best video matching a song request
* @param query string
* @param v boolean Verbosity
* @return Promise
*/
at3.findVideo = function(query, v) {
  if (v === undefined) {
    v = false;
  }

  // We try to find the song
  return at3.guessTrackFromString(query, true, false, v).then(guessStringInfos => {
    if (guessStringInfos.title && guessStringInfos.artistName) {
      return at3.retrieveTrackInformations(guessStringInfos.title, guessStringInfos.artistName, true, v);
    } else {
      return Promise.reject({error: "No song corresponds to your query"});
    }
  }).then(song => {
    return at3.findVideoForSong(song, v);
  });
};

/**
* Find a song from a query, then download the corresponding video,
* convert and tag it
* @param query string
* @param outputFolder
* @param callback Callback function
* @param v boolean Verbosity
* @return Event
*/
at3.findAndDownload = function(query, outputFolder, callback, v) {
  if (v === undefined) {
    v = false;
  }
  const progressEmitter = new EventEmitter();

  at3.findVideo(query).then(function(results) {
    if (results.length === 0) {
      progressEmitter.emit('error', new Error("Cannot find any video matching"));
      return callback(null, "Cannot find any video matching");
    }
    var i = 0;
    progressEmitter.emit('search-end');
    var dl = at3.downloadAndTagSingleURL(results[i].url, outputFolder, callback, query);
    dl.on('download', function(infos) {
      progressEmitter.emit('download', infos);
    });
    dl.on('download-end', function() {
      progressEmitter.emit('download-end');
    });
    dl.on('convert', function(infos) {
      progressEmitter.emit('convert', infos);
    });
    dl.on('convert-end', function() {
      progressEmitter.emit('convert-end');
    });
    dl.on('infos', function(infos) {
      progressEmitter.emit('infos', infos);
    });
    dl.on('error', function(error) {
      // [TODO]: try to download the next video, in case of youtube-dl error only
      // if (i < results.length) {
      //     dl = at3.downloadAndTagSingleURL(results[i++].url, outputFolder, callback, query);
      // } else {
        progressEmitter.emit('error', new Error(error));
      // }
    });
  }).catch(function() {
    progressEmitter.emit('error', new Error("Cannot find any video matching"));
    return callback(null, "Cannot find any video matching");
  });

  return progressEmitter;
};

/**
* Find videos for a track, and download it
* @param track trackInfos
* @param outputFolder
* @param callback Callback function
* @param v boolean Verbosity
* @return Event
*/
at3.downloadTrack = function(track, outputFolder, callback, v) {
  if (v === undefined) {
    v = false;
  }
  const progressEmitter = new EventEmitter();
  var aborted = false;

  at3.findVideoForSong(track, v).then(function(results) {
    if (aborted) {
      return;
    }
    if (results.length === 0) {
      progressEmitter.emit('error', new Error("Cannot find any video matching"));
      return callback(null, "Cannot find any video matching");
    }
    let i = 0;
    progressEmitter.emit('search-end');
    const dlNext = () => {
      if (i >= results.length) {
        progressEmitter.emit('error', new Error("Cannot find any video matching"));
        return;
      }
      if (v) {
        console.log("Will be downloaded:", results[i].url);
      }
      let aborted = false;
      let dl = at3.downloadAndTagSingleURL(results[i].url, outputFolder, callback, '', v, track);
      dl.on('download', function(infos) {
        progressEmitter.emit('download', infos);
      });
      dl.on('download-end', function() {
        progressEmitter.emit('download-end');
      });
      dl.on('convert', function(infos) {
        progressEmitter.emit('convert', infos);
      });
      dl.on('convert-end', function() {
        progressEmitter.emit('convert-end');
      });
      dl.on('infos', function(infos) {
        progressEmitter.emit('infos', infos);
      });
      dl.on('end', finalInfos => {
        progressEmitter.emit('end', finalInfos);
      });
      dl.on('error', function(error) {
        i += 1;
        aborted = true;
        dlNext();
      });
      progressEmitter.on('abort', () => {
        if (!aborted) {
          dl.emit('abort');
        }
      });
    };
    dlNext();
  }).catch(function() {
    progressEmitter.emit('error', new Error("Cannot find any video matching"));
    return callback(null, "Cannot find any video matching");
  });

  progressEmitter.on('abort', () => {
    aborted = true;
  });

  return progressEmitter;
};

/**
* Return URLs contained in a playlist (YouTube or SoundCloud)
* @param url
* @return Promise(object)
*/
at3.getPlaylistURLsInfos = function(url) {
  var type = at3.guessURLType(url);

  if (type == 'youtube') {
    var playlistId = url.match(/list=([0-9a-zA-Z_-]+)/);
    playlistId = playlistId[1];
    let playlistInfos = {};
    let playlistq = request({
      url: 'https://www.googleapis.com/youtube/v3/playlists?part=snippet&key=' + API_GOOGLE + '&id=' + playlistId,
      json: true
    }).then(function (playlistDetails) {
      let snippet = playlistDetails.items[0].snippet;
      playlistInfos.title = snippet.title;
      playlistInfos.artistName = snippet.channelTitle;
      playlistInfos.cover = snippet.thumbnails.medium.url;
    });
    let playlistItemsq = request({
      url: 'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=' + API_GOOGLE + '&maxResults=50&playlistId=' + playlistId,
      json: true
    }).then(function (playlistDetails) {
      let playlistItems = [];

      _.forEach(playlistDetails.items, function (item) {
        if (!item.snippet || !item.snippet.thumbnails) {
          // Video unavailable, like cbixLt0WBQs
          return;
        }
        var highestUrl;
        _.forEach(['maxres', 'standart', 'high', 'medium', 'default'], function (res) {
          if (!highestUrl && item.snippet.thumbnails[res]) {
            highestUrl = item.snippet.thumbnails[res].url;
          }
        });
        playlistItems.push({
          url: 'http://youtube.com/watch?v=' + item.snippet.resourceId.videoId,
          title: item.snippet.title,
          cover: highestUrl
        });
      });

      playlistInfos.items = playlistItems;
    });
    return Promise.all([playlistItemsq, playlistq]).then(() => {
      return playlistInfos;
    });
  } else if (type == 'soundcloud') {
    return request({
      url: 'http://api.soundcloud.com/resolve?client_id=' + API_SOUNDCLOUD + '&url=' + url,
      json: true
    }).then(function (playlistDetails) {
      let playlistInfos = {
        title: playlistDetails.title,
        artistName: playlistDetails.user.username,
        cover: playlistDetails.artwork_url
      };
      let items = [];

      _.forEach(playlistDetails.tracks, function (track) {
        items.push({
          url: track.permalink_url,
          title: track.title,
          cover: track.artwork_url,
          artistName: track.user.username
        });
      });

      playlistInfos.items = items;

      return playlistInfos;
    });
  }
};

/**
* Returns info (title, cover, songs) about a playlist (Deezer or Spotify)
* @param url
* @return Promise(object)
*/
at3.getPlaylistTitlesInfos = function(url) {
  // Deezer Playlist
  // Deezer Album
  // Deezer Loved Tracks [TODO]
  // Spotify playlist
  // Spotify Album
  var type = at3.guessURLType(url);

  var regDeezerPlaylist = /playlist\/([0-9]+)/;
  var regDeezerAlbum = /album\/([0-9]+)/;

  var regSpotifyPlaylist = /user\/([0-9a-zA-Z_.-]+)\/playlist\/([0-9a-zA-Z]+)/;
  var regSpotifyAlbum = /album\/([0-9a-zA-Z]+)/;

  if (type == 'deezer') {
    // Deezer Playlist
    if (regDeezerPlaylist.test(url)) {
      var playlistId = url.match(regDeezerPlaylist)[1];

      return request({
        url: 'https://api.deezer.com/playlist/' + playlistId,
        json: true
      }).then(function (playlistDetails) {
        let playlist = {};
        let items = [];

        playlist.title = playlistDetails.title;
        playlist.artistName = playlistDetails.creator.name;
        playlist.cover = playlistDetails.picture_big;

        _.forEach(playlistDetails.tracks.data, function (track) {
          items.push({
            title: track.title,
            artistName: track.artist.name,
            deezerId: track.id,
            album: track.album.title,
            cover: track.album.cover
          });
        });

        playlist.items = items;

        return playlist;
      });
    } else if (regDeezerAlbum.test(url)) { // Deezer Album
      let albumId = url.match(regDeezerAlbum)[1];
      let albumInfos = {};

      return request({
        url: 'https://api.deezer.com/album/' + albumId,
        json: true
      }).then(function (ralbumInfos) {
        albumInfos.cover = ralbumInfos.cover_big;
        albumInfos.title = ralbumInfos.title;
        albumInfos.artistName = ralbumInfos.artist.name;

        return request({
          url: 'https://api.deezer.com/album/' + albumId + '/tracks',
          json: true
        });
      }).then(function (albumTracks) {
        let items = [];

        _.forEach(albumTracks.data, function (track) {
          items.push({
            title: track.title,
            artistName: track.artist.name,
            deezerId: track.id,
            album: albumInfos.title,
            cover: albumInfos.cover,
            duration: track.duration
          });
        });

        albumInfos.items = items;

        return albumInfos;
      });
    }
  } else if (type == 'spotify') {
    // Spotify Playlist
    if (regSpotifyPlaylist.test(url)) {
      let userId = url.match(regSpotifyPlaylist)[1];
      let playlistId = url.match(regSpotifyPlaylist)[2];

      return at3.spotifyToken().then(token => {
        return request({
          url: 'https://api.spotify.com/v1/users/' + userId + '/playlists/' + playlistId,
          json: true,
          headers: {
            Authorization: 'Bearer ' + token
          }
        });
      }).then(function (playlistDetails) {
        let playlist = {};
        let items = [];

        playlist.title = playlistDetails.name;
        playlist.artistName = userId;
        playlist.cover = playlistDetails.images[0].url;

        playlistDetails.tracks.items.forEach(t => {
          let track = t.track;
          items.push({
            title: track.name,
            artistName: track.artists[0].name,
            spotifyId: track.id,
            album: track.album.name,
            cover: track.album.images[0].url,
            duration: Math.ceil(track.duration_ms/1000)
          });
        });

        playlist.items = items;

        return playlist;
      });
    } else if (regSpotifyAlbum.test(url)) { // Spotify Album
      let albumId = url.match(regSpotifyAlbum)[1];
      let albumInfos = {};

      return at3.spotifyToken().then(token => {
        return request({
          url: 'https://api.spotify.com/v1/albums/' + albumId,
          json: true,
          headers: {
            Authorization: 'Bearer ' + token
          }
        });
      }).then(ralbumInfos => {
        albumInfos.title = ralbumInfos.name;
        albumInfos.artistName = ralbumInfos.artists[0].name;
        albumInfos.cover = ralbumInfos.images[0].url;

        let items = [];

        ralbumInfos.tracks.items.forEach(track => {
          items.push({
            title: track.name,
            artistName: track.artists[0].name,
            spotifyId: track.id,
            album: albumInfos.title,
            cover: albumInfos.cover,
            duration: Math.ceil(track.duration_ms/1000)
          });
        });

        albumInfos.items = items;

        return albumInfos;
      });
    }
  }
};

/**
* Download a playlist containing URLs
* @param url {string}
* @param outputFolder {string}
* @param callback {Function}
* @param maxSimultaneous {number} Maximum number of simultaneous track processing
* @param subPathFormat {string} The format of the subfolder: {artist}/{title}/
* @return {Event}
*/
at3.downloadPlaylistWithURLs = function(url, outputFolder, callback, maxSimultaneous, subPathFormat) {
  if (maxSimultaneous === undefined) {
    maxSimultaneous = 1;
  }
  if (subPathFormat === undefined) {
    subPathFormat = '';
  }

  const emitter = new EventEmitter();
  var running = 0;
  var lastIndex = 0;
  var aborted = false;

  at3.getPlaylistURLsInfos(url).then(function (playlistInfos) {
    if (aborted) {
      return;
    }

    outputFolder = at3.createSubPath(outputFolder, subPathFormat, playlistInfos.title, playlistInfos.artistName);

    emitter.emit('playlist-infos', playlistInfos);

    downloadNext(playlistInfos.items, 0);
  });

  function downloadNext(urls, currentIndex) {
    if (aborted) {
      return;
    }
    if (urls.length == currentIndex) {
      if (running === 0) {
        emitter.emit('end');
        callback(urls);
      }
      return;
    }
    running++;
    if (currentIndex > lastIndex) {
      lastIndex = currentIndex;
    }

    var currentUrl = urls[currentIndex];

    currentUrl.progress = {};

    emitter.emit('begin-url', currentIndex);

    var dl = at3.downloadAndTagSingleURL(currentUrl.url, outputFolder, function(infos, error) {
      if (infos) {
        currentUrl.file = infos.file;
        currentUrl.infos = infos.infos;
      }
      running--;

      emitter.emit('end-url', currentIndex);

      if (running < maxSimultaneous) {
        downloadNext(urls, lastIndex+1);
      }
    });

    emitter.on('abort', () => {
      aborted = true;
      dl.emit('abort');
    });

    dl.on('download', function(infos) {
      currentUrl.progress.download = infos;
      emitter.emit('download', currentIndex);
    });
    dl.on('download-end', function() {
      emitter.emit('download-end', currentIndex);
      if (running < maxSimultaneous) {
        downloadNext(urls, lastIndex+1);
      }
    });
    dl.on('convert', function(infos) {
      currentUrl.progress.convert = infos;
      emitter.emit('convert', currentIndex);
    });
    dl.on('convert-end', function() {
      emitter.emit('convert-end', currentIndex);
    });
    dl.on('infos', function(infos) {
      currentUrl.infos = infos;
      emitter.emit('infos', currentIndex);
    });
    dl.on('error', function() {
      emitter.emit('error', new Error(currentIndex));
      if (running < maxSimultaneous) {
        downloadNext(urls, lastIndex+1);
      }
    });
  }

  emitter.on('abort', () => {
    aborted = true;
  });

  return emitter;
};

/**
* Download a playlist containing titles
* @param url {string}
* @param outputFolder {string}
* @param callback {Function}
* @param maxSimultaneous {number} Maximum number of simultaneous track processing
* @param subPathFormat {string} The format of the subfolder: {artist}/{title}/
* @return {Event}
*/
at3.downloadPlaylistWithTitles = function(url, outputFolder, callback, maxSimultaneous, subPathFormat) {
  if (maxSimultaneous === undefined) {
    maxSimultaneous = 1;
  }
  if (subPathFormat === undefined) {
    subPathFormat = '';
  }

  const emitter = new EventEmitter();
  var running = 0;
  var lastIndex = 0;
  var aborted = false;

  at3.getPlaylistTitlesInfos(url).then(function (playlistInfos) {
    if (aborted) {
      return;
    }

    outputFolder = at3.createSubPath(outputFolder, subPathFormat, playlistInfos.title, playlistInfos.artistName);

    emitter.emit('playlist-infos', playlistInfos);

    downloadNext(playlistInfos.items, 0);
  });

  function downloadNext(urls, currentIndex) {
    if (aborted) {
      return;
    }
    if (urls.length == currentIndex) {
      if (running === 0) {
        emitter.emit('end');
        callback(urls);
      }
      return;
    }
    running++;
    if (currentIndex > lastIndex) {
      lastIndex = currentIndex;
    }

    var currentTrack = urls[currentIndex];

    currentTrack.progress = {};

    emitter.emit('begin-url', currentIndex);

    at3.findVideoForSong(currentTrack).then(function (videos) {
      if (aborted) {
        return;
      }
      emitter.emit('search-end', currentIndex);

      function downloadFinished(infos, error) {
        if (!infos || error) {
          return;
        }
        currentTrack.file = infos.file;
        currentTrack.infos = infos.infos;
        running--;

        emitter.emit('end-url', currentIndex);

        if (running < maxSimultaneous) {
          downloadNext(urls, lastIndex+1);
        }
      }

      let i = 0;
      handleDl(at3.downloadAndTagSingleURL(videos[i].url, outputFolder, downloadFinished, undefined, false, currentTrack));

      function handleDl(dl) {
        dl.on('download', function(infos) {
          currentTrack.progress.download = infos;
          emitter.emit('download', currentIndex);
        });
        dl.on('download-end', function() {
          emitter.emit('download-end', currentIndex);
          if (running < maxSimultaneous) {
            downloadNext(urls, lastIndex+1);
          }
        });
        dl.on('convert', function(infos) {
          currentTrack.progress.convert = infos;
          emitter.emit('convert', currentIndex);
        });
        dl.on('convert-end', function() {
          emitter.emit('convert-end', currentIndex);
        });
        dl.on('infos', function(infos) {
          currentTrack.infos = infos;
          emitter.emit('infos', currentIndex);
        });
        dl.on('error', function() {
          if (i < videos.length) {
            i++;
            handleDl(at3.downloadAndTagSingleURL(videos[i].url, outputFolder, downloadFinished, undefined, false, currentTrack));
          } else {
            emitter.emit('error', new Error(currentIndex));
            if (running < maxSimultaneous) {
              downloadNext(urls, lastIndex+1);
            }
          }
        });
        emitter.on('abort', () => {
          aborted = true;
          dl.emit('abort');
        });
      }
    });
  }

  emitter.on('abort', () => {
    aborted = true;
  });

  return emitter;
};

/**
* Download a playlist containing urls or titles
* @param url {string}
* @param outputFolder {string}
* @param callback {Function}
* @param maxSimultaneous {number} Maximum number of simultaneous track processing
* @return {Event}
*/
at3.downloadPlaylist = function(url, outputFolder, callback, maxSimultaneous, subPathFormat) {
  var type = at3.guessURLType(url);
  var sitesTitles = ['deezer', 'spotify'];
  var sitesURLs = ['youtube', 'soundcloud'];

  if (sitesTitles.indexOf(type) >= 0) {
    return at3.downloadPlaylistWithTitles(url, outputFolder, callback, maxSimultaneous, subPathFormat);
  } else if (sitesURLs.indexOf(type) >= 0) {
    return at3.downloadPlaylistWithURLs(url, outputFolder, callback, maxSimultaneous, subPathFormat);
  } else {
    callback(null, 'Website not supported yet');
    return (new EventEmitter()).emit('error', new Error('Website not supported yet'));
  }
};

/**
* Download a track from an URL
* @param url
* @param outputFolder
* @param callback
* @param v boolean Verbose
* @return Event
*/
at3.downloadTrackURL = function(url, outputFolder, callback, v) {
  if (v === undefined) {
    v = false;
  }
  var type = at3.guessURLType(url);
  const emitter = new EventEmitter();

  if (type === 'spotify') {
    let trackId = url.match(/\/track\/([0-9a-zA-Z]+)$/)[1];
    at3.spotifyToken().then(token => {
      return request({
        url: 'https://api.spotify.com/v1/tracks/' + trackId,
        json: true,
        headers: {
          Authorization: 'Bearer ' + token
        }
      });
    }).then(trackInfos => {
      let track = {
        title: trackInfos.name,
        artistName: trackInfos.artists[0].name,
        duration: Math.ceil(trackInfos.duration_ms/1000),
        spotifyId: trackId,
        cover: trackInfos.album.images[0].url
      };
      let e = at3.downloadTrack(track, outputFolder, callback, v);

      at3.forwardEvents(e, emitter);
    });
  } else if (type === 'deezer') {
    let trackId = url.match(/\/track\/([0-9]+)/)[1];
    at3.getDeezerTrackInfos(trackId, v).then(trackInfos => {
      let e = at3.downloadTrack(trackInfos, outputFolder, callback, v);

      at3.forwardEvents(e, emitter);
    });
  }


  return emitter;
};

/**
 * Forward any classical event from e1 to e2, and abort from e2 to e1
 * @param e1 Event The source
 * @param e2 Event the destination
 * @return e2
 */
at3.forwardEvents = function(e1, e2) {
  let events = ['download', 'download-end', 'convert', 'convert-end', 'infos', 'error', 'playlist-infos', 'begin-url', 'end-url', 'end', 'search-end'];
  events.forEach(e => {
    e1.on(e, data => {
      e2.emit(e, data);
    });
  });
  e2.on('abort', () => {
    e1.emit('abort');
  });
  return e2;
};

/**
* Return the suggested songs for the query
* @param query string
* @param limit number
* @return Promise<array<trackInfos>> Array of potential songs
*/
at3.suggestedSongs = function(query, limit) {
  if (!limit) {
    limit = 5;
  }

  return request({
    uri: 'https://api.deezer.com/search?limit=' + limit + '&q=' + query,
    json: true
  }).then(results => {
    return _.map(results.data, r => {
      return {
      title: r.title,
      artistName: r.artist.name,
      duration: r.duration,
      cover: r.album.cover_medium,
      deezerId: r.id
      };
    });
  });
}

/**
* Return the suggested albums for the query
* @param query string
* @param limit number
* @return Promise<array<Object>> Array of potential albums
*/
at3.suggestedAlbums = function(query, limit) {
  if (!limit) {
    limit = 5;
  }

  return request({
    uri: 'https://api.deezer.com/search/album?limit=' + limit + '&q=' + query,
    json: true
  }).then(results => {
    return _.map(results.data, r => {
      return {
      title: r.title,
      artistName: r.artist.name,
      cover: r.cover_medium,
      deezerId: r.id,
      link: r.link,
      nbTracks: r.nb_tracks
      };
    });
  });
}

/**
* Return the type of the query
* @param query string
* @return string: text, single-url, playlist-url, track-url, not-supported
*/
at3.typeOfQuery = function(query) {
  if (!at3.isURL(query)) {
    return 'text';
  }
  var type = at3.guessURLType(query);
  if (!type) {
    return 'not-supported';
  }

  if (type == 'youtube' && /list=([0-9a-zA-Z_-]+)/.test(query)) {
    return 'playlist-url';
  } else if (type == 'deezer') {
    if (/\/(playlist|album)\//.test(query)) {
      return 'playlist-url';
    } else if (/\/track\//.test(query)) {
      return 'track-url';
    }
    return 'not-supported';
  } else if (type == 'soundcloud' && /\/sets\//.test(query)) {
    return 'playlist-url';
  } else if (type == 'spotify') {
    if (/\/(playlist|album)\//.test(query)) {
      return 'playlist-url';
    } else if (/\/track\//.test(query)) {
      return 'track-url';
    }
    return 'not-supported';
  }

  return 'single-url';
};

/**
* Return URL type
* @param url
* @return string
*/
at3.guessURLType = function(url) {
  if (/^(https?:\/\/)?((www|m)\.)?((youtube\.([a-z]{2,4}))|(youtu\.be))/.test(url)) {
    return 'youtube';
  } else if (/^(https?:\/\/)?(((www)|(m))\.)?(soundcloud\.([a-z]{2,4}))/.test(url)) {
    return 'soundcloud';
  } else if (/^(https?:\/\/)?(www\.)?(deezer\.([a-z]{2,4}))\//.test(url)) {
    return 'deezer';
  } else if (/^(https?:\/\/)?((open|play)\.)?spotify\.([a-z]{2,4})/.test(url)) {
    return 'spotify';
  }
};

function imatch(textSearched, text) {
  // [TODO] Improve this function (use .test and espace special caracters + use it everywhere else)
  return text.match(new RegExp(textSearched, 'gi'));
}
function vsimpleName(text, exact) {
  if (exact === undefined) {
    exact = false;
  }
  text = text.toLowerCase();
  if (!exact) {
    // text = text.replace('feat', '');
  }
  text = text.replace(/((\[)|(\())?radio edit((\])|(\)))?/ig, '');
  text = text.replace(/[^a-zA-Z0-9]/ig, '');
  return text;
}
function delArtist(artist, text, exact) {
  if (exact === undefined) {
    exact = false;
  }
  if(vsimpleName(artist).length <= 2) { // Artist with a very short name (Mathieu Chedid - M)
    return vsimpleName(text, exact);
  } else {
    // [TODO] Improve, escape regex special caracters in vsimpleName(artist)
    return vsimpleName(text, exact).replace(new RegExp(vsimpleName(artist),'ig'), '');
  }
}
function simpleName(text) {
  return text.replace(/\(.+\)/g, '');
}

module.exports = at3;
