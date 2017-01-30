const expect = require('chai').expect;
const alltomp3 = require('..');
const _ = require('lodash');

function testTracks(tracks, artistName) {
    let queries = [];
    _.forEach(tracks, t => {
        t.song.artistName = artistName;
        let q = alltomp3.findVideoForSong(t.song).then(v => {
            if (t.videos.indexOf(v[0].url) === -1) {
                console.log(t.title, v);
            }
            expect(t.videos).to.include(v[0].url);
        });
        queries.push(q);
    });

    return Promise.all(queries);
}

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
            // This last one is currently too hard
            // {
            //     title: "Young Souls (Album Edit) - Broken Back",
            //     videos: ['https://www.youtube.com/watch?v=LT9kwbunzWc']
            // }
        ];

        return testTracks(tracks, artistName);
    });

    it('should find YouTube videos for Night Visions by Imagine Dragons', function () {
        this.timeout(20000);
        let artistName = "Imagine Dragons";

        let tracks = [
            {
                "song": {
                    "title": "Radioactive",
                    "duration": 186
                },
                "videos": ['https://www.youtube.com/watch?v=ktvTqknDobU', 'https://www.youtube.com/watch?v=iO_WxYC34eM', 'https://www.youtube.com/watch?v=Thbsg9i2mZ0', 'https://www.youtube.com/watch?v=y_8Mgn30xRU']
            },
            {
                "song": {
                    "title": "Tiptoe",
                    "duration": 194
                },
                "videos": ['https://www.youtube.com/watch?v=ajjj4pLnjz8', 'https://www.youtube.com/watch?v=UB96k1arlTk', 'https://www.youtube.com/watch?v=211bk6ctXM4']
            },
            {
                "song": {
                    "title": "It's Time",
                    "duration": 240
                },
                "videos": ['https://www.youtube.com/watch?v=sENM2wA_FTg', 'https://www.youtube.com/watch?v=IOatp-OCw3E', 'https://www.youtube.com/watch?v=qFqMy0ewYFQ']
            },
            {
                "song": {
                    "title": "Demons",
                    "duration": 177
                },
                "videos": ['https://www.youtube.com/watch?v=mWRsgZuwf_8', 'https://www.youtube.com/watch?v=GFQYaoiIFh8', 'https://www.youtube.com/watch?v=LqI78S14Wgg', 'https://www.youtube.com/watch?v=lxUXvOUKM_Q']
            },
            {
                "song": {
                    "title": "On Top Of The World",
                    "duration": 192
                },
                "videos": ['https://www.youtube.com/watch?v=w5tWYmIOWGk', 'https://www.youtube.com/watch?v=g8PrTzLaLHc', 'https://www.youtube.com/watch?v=Nwvil057g-g', 'https://www.youtube.com/watch?v=e74VMNgARvY']
            },
            {
                "song": {
                    "title": "Amsterdam",
                    "duration": 241
                },
                "videos": ['https://www.youtube.com/watch?v=TKtPXO5iEnA', 'https://www.youtube.com/watch?v=s6Nc4qEI3k4', 'https://www.youtube.com/watch?v=dboQYGddEC8', 'https://www.youtube.com/watch?v=j-tfNaBcyes']
            },
            {
                "song": {
                    "title": "Hear Me",
                    "duration": 235
                },
                "videos": ['https://www.youtube.com/watch?v=1Yr683VLxes', 'https://www.youtube.com/watch?v=EkB2eJfF3W8', 'https://www.youtube.com/watch?v=u0Q3r4ywA34']
            },
            {
                "song": {
                    "title": "Every Night",
                    "duration": 217
                },
                "videos": ['https://www.youtube.com/watch?v=6RVxzeBiBJU', 'https://www.youtube.com/watch?v=kuijhOvKyYg', 'https://www.youtube.com/watch?v=f6CQ3ATP_6Y', 'https://www.youtube.com/watch?v=k4ESylzBW4M']
            },
            {
                "song": {
                    "title": "Bleeding Out",
                    "duration": 223
                },
                "videos": ['https://www.youtube.com/watch?v=jNFgynmVmx0', 'https://www.youtube.com/watch?v=gJEoxeW7JvQ', 'https://www.youtube.com/watch?v=Hq6kn87NpKw', 'https://www.youtube.com/watch?v=Tyjt1Ff4m7k']
            },
            {
                "song": {
                    "title": "Underdog",
                    "duration": 209
                },
                "videos": ['https://www.youtube.com/watch?v=JCUV43T7HZ0', 'https://www.youtube.com/watch?v=USeEyhodZqk', 'https://www.youtube.com/watch?v=KoX80w5b8ps', 'https://www.youtube.com/watch?v=m4SBGLtJvPo']
            },
            {
                "song": {
                    "title": "Nothing Left To Say / Rocks (Medley)",
                    "duration": 537
                },
                "videos": ['https://www.youtube.com/watch?v=Bn7eYibzmTs', 'https://www.youtube.com/watch?v=bSBkYqbdOKc', 'https://www.youtube.com/watch?v=B4z7loNm_kw', 'https://www.youtube.com/watch?v=Q6zqH6qKaTU']
            },
            {
                "song": {
                    "title": "Cha-Ching (Till We Grow Older)",
                    "duration": 249
                },
                "videos": ['https://www.youtube.com/watch?v=rmqyXQf8jkU', 'https://www.youtube.com/watch?v=vhSvfxtlUQc', 'https://www.youtube.com/watch?v=wO0ohGn-x3E', 'https://www.youtube.com/watch?v=IgC8yZpMRqc']
            },
            {
                "song": {
                    "title": "Working Man",
                    "duration": 235
                },
                "videos": ['https://www.youtube.com/watch?v=m4SBGLtJvPo', 'https://www.youtube.com/watch?v=2d-GIw-pBMs', 'https://www.youtube.com/watch?v=NARf6QW3KYA', 'https://www.youtube.com/watch?v=31YTMhD4NYs', 'https://www.youtube.com/watch?v=mhXoXYbmCz4', 'https://www.youtube.com/watch?v=2d-GIw-pBMs', 'https://www.youtube.com/watch?v=aW8_7M8e5CQ']
            }
        ];

        return testTracks(tracks, artistName);
    });

    it('should find YouTube videos for single letter artist M', function () {
        this.timeout(10000);

        let artistName = "M";
        let tracks = [
            {
                song: {
                    title: "Je dis aime",
                    duration: 236
                },
                videos: ['https://www.youtube.com/watch?v=6hV-UnrC9tU', 'https://www.youtube.com/watch?v=QYWV67qgHvg', 'https://www.youtube.com/watch?v=ORam68OtcmY']
            },
            {
                song: {
                    title: "Mama Sam",
                    duration: 195
                },
                videos: ['https://www.youtube.com/watch?v=avZTCTR6e9k', 'https://www.youtube.com/watch?v=HRez3YiXxJw']
            }
        ];

        return testTracks(tracks, artistName);
    });
});
