# alltomp3 [![CircleCI Status](https://circleci.com/gh/AllToMP3/alltomp3.svg?style=shield&circle-token=:circle-token)](https://circleci.com/gh/AllToMP3/alltomp3)
Node module to download and convert in MP3 with tags an online video.

Provide several useful methods to get information about a song or to guess the track matching a YouTube video.

## Requirements
- ffmpeg >= 2.8 with lamemp3;
- node-acoutstid requirements (https://github.com/parshap/node-acoustid#installation - https://acoustid.org/chromaprint);
- eyeD3 >= 0.7.10.

## Installation
```
npm install git+https://github.com/AllToMP3/alltomp3
```

```js
const alltomp3 = require('alltomp3');

var dl = alltomp3.findAndDownload("imagine dragons on top of the world", "./", function (infos) {
    console.log("It's finished: ", infos);
});

// {
//     infos: {
//         title: 'On Top Of The World',
//         artistName: 'Imagine Dragons',
//         deezerId: 63510362,
//         itunesId: 555694746,
//         position: 5,
//         duration: 192,
//         deezerAlbum: 6240279,
//         discNumber: 1,
//         album: 'Night Visions',
//         releaseDate: '2012-01-01',
//         nbTracks: 13,
//         genreId: 132,
//         cover: 'http://e-cdn-images.deezer.com/images/cover/7e8314f4280cffde363547a495a260bc/600x600-000000-80-0-0.jpg',
//         genre: 'Pop'
//     },
//     file: './Imagine Dragons - On Top Of The World.mp3'
// }
```

## Methods

Each time a `trackInfos` object is referred, it corresponds to a JavaScript object with the following fields:
- `title`
- `artistName`
- (optional) `album`: name of the album
- (optional) `cover`: URL of an image for the cover
- (optional) `position`: position of the track on the album
- (optional) `nbTracks`: number of tracks on the album
- (optional) `releaseDate`: format YYYY-MM-YY
- (optional) `discNumber`: number of the disc where the track is
- (optional) `genre`: name of the genre
- (optional) `duration`: duration in second
- (optional) `deezerId`: ID of the track on Deezer (http://developers.deezer.com/api/track)
- (optional) `itunesId`: ID of the track on iTunes (https://itunes.apple.com/lookup?id=)
- (optional) `deezerAlbum`: ID of the album on Deezer (http://developers.deezer.com/api/album)
- (optional) `genreId`: ID of the genre on Deezer (http://developers.deezer.com/api/genre)


### downloadAndTagSingleURL(url, outputFolder, callback, title, verbose)
Download, convert and tag the video from `url`. Does not work with playlists, only with single videos.  
The callback function takes one argument, an object containing the following fields:
- `file`: the name of the output file
- `infos`: a `trackInfos` object

If you are looking for specific query and you think `url` correspond to the song you want, you can help the identification and tags with the `title` argument.

#### Emit
##### 'download': the download is in progress
This event is emitted during the download, with an object containing:
- `progress`: the percentage of the download

##### 'download-end': the download end

##### 'convert': the conversion is in progress
This event is emitted during the conversion, with an object containing:
- `progress`: the percentage of the conversion

##### 'infos': infos about the track
This event is emitted every time new information about the track are found, with a `trackInfos` object.

##### 'end': everything is finished
This event is emitted at the end (when the file has been downloaded, converted and tagged) with an object containing the following fields:
- `file`: the name of the output file
- `infos`: a `trackInfos` object

### findAndDownload(query, outputFolder, callback, verbose)
Find a YouTube music video matching the query, download and tag it.  
The callback function takes two arguments, first is an object containing the following fields:
- `file`: the name of the output file
- `infos`: a `trackInfos` object

And second is fill with an error message if any.

#### Emit
##### 'search-end': the search end

##### 'download': the download is in progress
This event is emitted during the download, with an object containing:
- `progress`: the percentage of the download

##### 'download-end': the download end

##### 'convert': the conversion is in progress
This event is emitted during the conversion, with an object containing:
- `progress`: the percentage of the conversion

##### 'infos': infos about the track
This event is emitted every time new information about the track are found, with a `trackInfos` object.

```js
const alltomp3 = require('alltomp3');

var dl = alltomp3.findAndDownload("imagine dragons on top of the world", function (infos) {
    console.log("It's finished: ", infos);
});
dl.on('search-end', function() {
    console.log('Search end');
});
dl.on('download', function(infos) {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(infos.progress + '%');
});
dl.on('download-end', function() {
    console.log('', 'Download end');
});
dl.on('convert', function(infos) {
    process.stdout.cursorTo(0);
    process.stdout.clearLine(1);
    process.stdout.write(infos.progress + '%');
});
dl.on('convert-end', function() {
    console.log('', 'Convert end');
});
dl.on('infos', function(infos) {
    console.log('New infos received: ', infos);
});
```

### findVideo(query, verbose)
Search on YouTube the video which should have an audio corresponding to the `query`. It works best if the query contains the artist and the title of the track.

Returns a **Promise** which is resolved with an ordered array of objects containing:
- `id`: YouTube videoId
- `url`: URL of the video
- `title`: title of the video
- `hd` (boolean): `true` if the quality >= 720p
- `duration`: duration in seconds
- `views`: number of views
- `score`: a high score indicate a high probability of matching with the query. Can be negative

```js
const alltomp3 = require('alltomp3');

alltomp3.findVideo("imagine dragons on top of the world").then(function(results) {
    console.log(results);
});

// [ { id: 'g8PrTzLaLHc',
//     url: 'https://www.youtube.com/watch?v=g8PrTzLaLHc',
//     title: 'Imagine Dragons - On Top of the World -',
//     hd: false,
//     duration: 191,
//     views: '24255381',
//     score: -42.113922489729575 },
//   { id: 'e74VMNgARvY',
//     url: 'https://www.youtube.com/watch?v=e74VMNgARvY',
//     title: 'Imagine Dragons - On Top of the World',
//     hd: true,
//     duration: 196,
//     views: '1695902',
//     score: -62.604333945991385 },
//     ....
// ]

```

### retrieveTrackInformations(title, artistName, exact, verbose)
Retrieve information on the track corresponding to `title` and `artistName`. `exact` is a boolean indicating if the terms can change a little (`true` by default).

Returns a **Promise** with a `trackInfos` object.


### guessTrackFromString(query)
Try to find a title and an artist matching the `query`. Works especially well with YouTube video names.

Returns a **Promise** with an object containing:
- `title`
- `artistName`

```js
const alltomp3 = require('alltomp3');

function l(infos) {
    console.log(infos);
}

alltomp3.guessTrackFromString('Imagine Dragons - On Top of the World - Lyrics').then(l);
alltomp3.guessTrackFromString('C2C - Happy Ft. D.Martin').then(l);
alltomp3.guessTrackFromString('David Guetta - Bang My Head (Official Video) feat Sia & Fetty Wap').then(l);
alltomp3.guessTrackFromString('David Guetta - Hey Mama (Official Video) ft Nicki Minaj, Bebe Rexha & Afrojack').then(l);
alltomp3.guessTrackFromString('hans zimmer no time for caution').then(l);

// { title: 'On Top Of The World', artistName: 'Imagine Dragons' }
// { title: 'Happy', artistName: 'C2C' }
// { title: 'Bang my Head (feat. Sia & Fetty Wap)', artistName: 'David Guetta' }
// { title: 'Hey Mama', artistName: 'David Guetta' }
// { title: 'No Time for Caution', artistName: 'Hans Zimmer' }
```


### findLyrics(title, artistName)
Search lyrics for a song.

Returns a **Promise** with a `string`.

```js
const alltomp3 = require('alltomp3');

alltomp3.findLyrics('Radioactive', 'Imagine Dragons').then(function (lyrics) {
    console.log(lyrics);
}).catch(function() {
    console.log('No lyrics');
});
```


### downloadPlaylistWithURLs(url, outputFolder, callback, maxSimultaneous)
Download the playlist `url` containing URLs (aka YouTube or SoundCloud playlist), convert and tag it in `outputFolder`. `maxSimultaneous` is the maximum number of parallel conversions (default to 1).

#### Emit
#### 'list': the playlist description has been received
This event is emitted when information about the playlist has been received, with an `array(objects)` with the following keys:
- `url`: URL of the video/track
- `title`: title of the video/track
- `image`: image of the video/track
- `progress`: object with:
  - `download`: progression of the download
  - `convert`: progression of the conversion
- `infos`: `trackInfos` object
- `file`: path to the final MP3

**This array is updated as the process progress.**

#### 'begin-url': a new item is processed
This event is emitted when a new item is now processed, with an integer `index` indicating the corresponding track.

##### 'download': the download of an item is in progress
This event is emitted during the download, with an integer `index` indicating the corresponding track.

##### 'download-end': the download end
This event is emitted when the download of an item end, with an integer `index` indicating the corresponding track.

##### 'convert': the conversion is in progress
This event is emitted during the conversion, with an integer `index` indicating the corresponding track.

##### 'infos': infos about the track
This event is emitted every time new information about a track is received, with an integer `index` indicating the corresponding track.

#### 'end-url': the processing of an item is finished
This event is emitted when the processing of an item is finished, with an integer `index` indicating the corresponding track.

##### 'end': everything is finished
This event is emitted at the end, when all items have been processed, with the `list` array.


### downloadPlaylistWithTitles(url, outputFolder, callback, maxSimultaneous)
Download the playlist `url` containing titles (aka Deezer Playlist or Deezer Album), find best matching video on YouTube, convert and tag it in `outputFolder`. `maxSimultaneous` is the maximum number of parallel conversions (default to 1).

#### Emit
#### 'list': the playlist description has been received
This event is emitted when information about the playlist has been received, with an `array(objects)` with the following keys:
- `title`: title of the track
- `artistName`: artist of the track
- `cover`: cover of the track
- `progress`: object with:
  - `download`: progression of the download
  - `convert`: progression of the conversion
- `infos`: `trackInfos` object
- `file`: path to the final MP3

**This array is updated as the process progress.**

#### 'begin-url': a new item is processed
This event is emitted when a new item is now processed, with an integer `index` indicating the corresponding track.

### 'search-end': the search end
This event is emitted when the search of YouTube videos for an item (based on the title) end, with an integer `index` indicating the corresponding track.

##### 'download': the download of an item is in progress
This event is emitted during the download, with an integer `index` indicating the corresponding track.

##### 'download-end': the download end
This event is emitted when the download of an item end, with an integer `index` indicating the corresponding track.

##### 'convert': the conversion is in progress
This event is emitted during the conversion, with an integer `index` indicating the corresponding track.

##### 'infos': infos about the track
This event is emitted every time new information about a track is received, with an integer `index` indicating the corresponding track.

#### 'end-url': the processing of an item is finished
This event is emitted when the processing of an item is finished, with an integer `index` indicating the corresponding track.

##### 'end': everything is finished
This event is emitted at the end, when all items have been processed, with the `list` array.
