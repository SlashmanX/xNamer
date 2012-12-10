var MovieFilenames = [];
var TVFilenames = [];

var func = require('./functions.js');

var async = require('async');

MovieFilenames.push("Let's.Go.To.Prison.2006.DVDRip.Eng.XviD-BTSFilms");
MovieFilenames.push("The.Cabin.in.the.Woods.2012.720p.BRRip.x264.AC3-JYK.mkv");
MovieFilenames.push("Taken[2008]DvDrip-aXXo");
TVFilenames.push("Bobs.Burgers.S03E05.720p.HDTV.X264-DIMENSION");
TVFilenames.push("Castle.2009.S05E09.HDTV.x264-LOL");
TVFilenames.push("Castle.S05E05.Probable.Cause.HDTV.x264-LOL[ettv]");
TVFilenames.push("Castle 2009 S05E04 HDTV x264-LOL[ettv]");

for(var s in MovieFilenames)
{
    func.getMovieTitle(MovieFilenames[s], function(e, title){
        if(e) console.log(title +' : '+ e);
        else console.log('Movie: '+ title);
    });
}

async.forEachSeries(TVFilenames, function(show, cb){
    func.getTVShowInfo(show, function(show){
        console.log(show);
        cb();
    })
    },
    function(err){
        if(err) throw err;
        else
        {
            console.log('Done!');
            process.exit();
        }
    }
);

