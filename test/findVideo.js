const expect = require('chai').expect;
const alltomp3 = require('..');
const _ = require('lodash');

describe('findVideo', function() {
    it('should find YouTube videos for Broken Back by Broken Back', function () {
        this.timeout(20000);
        let artistName = "Broken Back";
        let tracks = [
            {
                song: {
                    title: "Excuses",
                    duration: 224
                },
                videos: ['https://www.youtube.com/watch?v=aBp7s6BpmrM', 'https://www.youtube.com/watch?v=Ogsfvvwu-wU', 'https://www.youtube.com/watch?v=upUWTD6x3dw']
            },
            {
                song: {
                    title: "Halcyon Birds (Radio Edit)",
                    duration: 197
                },
                videos: ['https://www.youtube.com/watch?v=xWlXEGIol9E', 'https://www.youtube.com/watch?v=EGSqjTixIyk', 'https://www.youtube.com/watch?v=gzZ43IEJ8S0', 'https://www.youtube.com/watch?v=2Ggu0m0a8WA']
            },
            {
                song: {
                    title: "Better Run",
                    duration: 176
                },
                videos: ['https://www.youtube.com/watch?v=oEugd8BV_Bs'],
            },
            {
                song: {
                    title: "Happiest Man on Earth (Radio Edit)",
                    duration: 183
                },
                videos: ['https://www.youtube.com/watch?v=j01T8N7wVK0'],
            },
            {
                song: {
                    title: "Got to Go",
                    duration: 218
                },
                videos: ['https://www.youtube.com/watch?v=A2iBEZBxT3s']
            },
            // This last one is curretly too hard
            // {
            //     title: "Young Souls (Album Edit) - Broken Back",
            //     videos: ['https://www.youtube.com/watch?v=LT9kwbunzWc']
            // }
        ];

        let queries = [];
        _.forEach(tracks, t => {
            t.song.artistName = artistName;
            let q = alltomp3.findVideoForSong(t.song).then(v => {
                expect(t.videos).to.include(v[0].url);
                // if (t.videos.indexOf(v[0].url) === -1) {
                //     console.log(t.title, v);
                // }
            });
            queries.push(q);
        });

        return Promise.all(queries);
    });
});
