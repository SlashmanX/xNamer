var config = require('./config.js');
var MovieDB = require('tmdbv3').init(config.APIKeys.theMovieDB);
var TVRage = require('tvrage-x')();
var TVShow = require('./Models/TVShow.js');

var ent = require('ent');
var async = require('async');

var prompt = require('prompt');

var mongoose = require('mongoose');
var db = mongoose.connect('localhost', 'xNamer', 27017, {user: 'xNamer', pass: 'xNamerPassword'});

var XRegExp = require('xregexp').XRegExp;


(function(exports){

    exports.getMovieTitle = function(input, callback) {
        //var re1 = /(.*?)\.(avi|mkv|mpeg|mpg|mov|mp4)$/i;
        var re2 = /(.*?)(dvdrip|xvid|720[a-z]{2}|1080[a-z]{1}|480[a-z]{1}| cd[0-9]|dvdscr|brrip|divx|[\{\(\[]?[0-9]{4}).*/;
        var re3 = /(.*?)\(.*\)(.*)/;
        var text = input;
        //var text1 = re1.exec(text);
        //if(text1)
        //    text = text1[1];
        //else
        //{
        //    callback('Not a movie', input)
        //    return;
        //}
        text=text.replace(/\./g,' ').toLowerCase();
        text2= re2.exec(text);
        if(text2)
            text =text2[1];
        text3= re3.exec(text);
        if (text3)
            text =text3[1];
        MovieDB.search.movie(text , function(err, res){
            if(err) callback(err, input);
            else if(!res.results.length) callback(err, null);
            else callback(err, res.results[0].title);
        });
    }

    exports.getTVShowInfo = function(input, callback)
    {

        var tvShow = {};

        var tvRegEx = XRegExp("^(.+)\.S([0-9]+)E([0-9]+).*$");
        var text = tvRegEx.exec(input);
        if(text)
        {
            tvShow.origName = input;
            tvShow.name = text[1].replace(/\./g,' ');
            tvShow.season = text[2];
            tvShow.episode = text[3];
        }

       prompt.start();
       async.series({
               getSeriesID : function(cb){
               getSeriesIDFromDB(tvShow.name, function(err, s)
               {
                   if(!s) // Not in DB, search TVDB
                   {
                       TVRage.search(tvShow.name, function(err, data){
                           if(err) throw err;
                           else
                           {
                               if(!data.results.show.length)
                               {
                                   saveSeriesToDB({fileName: tvShow.name, actualName: data.results.show.name, id: data.results.show.showid}, function(err, res){
                                       if(err) throw err;
                                       else {
                                           tvShow.showid = res.id;
                                           tvShow.name = res.actualName;
                                           return cb();
                                       }
                                   });
                               }
                               else
                               {
                                   var msg = "We found "+ data.results.show.length +" matches for "+ tvShow.name +". Please select the correct one from TVDB: \n";
                                   for(var i in data.results.show)
                                   {
                                       msg+= "["+i+"] "+ ent.decode(data.results.show[i].name)+"\n";
                                   }
                                   console.log(msg);
                                   prompt.get('seriesid', function (err, result) {
                                       saveSeriesToDB({fileName: tvShow.name, actualName: ent.decode(data.results.show[parseInt(result.seriesid, 10)].name), id: data.results.show[parseInt(result.seriesid, 10)].showid}, function(err, res){
                                           if(err) throw err;
                                           else {
                                               tvShow.showid = res.id;
                                               tvShow.name = res.actualName;
                                               return cb();
                                           }
                                       });
                                   });
                               }
                           }
                       });
                   }
                   else
                   {
                       tvShow.showid = s.id;
                       tvShow.name = s.actualName;
                       return cb();
                   }
               });
           },
               getEpisodeTitle : function(cb){
               TVRage.getEpisodeInfo({showid: tvShow.showid, season: tvShow.season, episode: tvShow.episode}, function(err, data){
                   tvShow.episodeName = (data.show.episode.title);
                   cb();
               })
           }
        },
        function(err, results) {
            callback(tvShow);
        });
    }
})(typeof exports === 'undefined'? this['functions']={}: exports);

function saveSeriesToDB(series, callback)
{
    TVShow.findOne({fileName: series.fileName},function(err, show){
        if(err) callback(err, null);
        if(!show)
        {
            tmp = new TVShow(series);
            tmp.save(function (err, show) {
                if (err) return callback(err, null);
                else return callback(null, show)
            });
        }
    });
}

function getSeriesIDFromDB(fileName, callback)
{
    TVShow.findOne({fileName: fileName}, function(err, show){
        if(err) return callback(err, null);
        if(show) return callback(null, show);
        else return callback(null, null);
    });
}