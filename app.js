var FTPClient   =   require('ftp');
var async       =   require('async');
var XRegExp     =   require('xregexp').XRegExp;

var func        =   require('./functions.js');

var files = [];

var dirsToSearch = [];

var connOptions = {
    host: '192.168.1.38',
    port: 21
};

var userOptions = {
    username: 'admin',
    password: 'pass'
}
var fileRegEx = /(.*?)\.(avi|mkv|mpeg|mpg|mov|mp4)$/i;
var fileExtRegEx = /\.([0-9a-z]+)(?:[\?#]|$)/i;
var tvRegEx = XRegExp("^(.+)\.S([0-9]+)E([0-9]+).*$");

var VIDEO_DIR = '/mnt/usbhost1/Video/';

var conn = new FTPClient(connOptions);


/* TODO: Process to scan, rename + move files
1) Get list of video files using regex in the root directory, also store names of subdirs
2) Each subdir, list + traverse files, use regex to get the video file name push to files[]
3) Each files[], check if movie or tv show (check for SnnEnn, and/or file size) then get all the info. NOTE: If (parent) then use parent folder name to get info.
4) Move files to their appropriate location
5) ??????
6) PROFIT!!
 */
conn.on('connect', function() {
    console.log('connected');
    conn.auth(userOptions.username, userOptions.password, function(e) {
        if (e) throw e;
        console.log('authenticated');
        async.series({
            getFilesAndDirsAtRoot : function(cb){
                conn.cwd(VIDEO_DIR+'Unsorted Downloads', function(e){
                    if(e) throw e;
                    conn.list(function(e, entries) {
                        if (e) throw e;
                        async.forEachSeries(entries, function(entry, callback){
                            if (entry.type === '-') // File
                            {
                                var tmp = fileRegEx.exec(entry.name);
                                if(tmp)
                                {
                                    files.push({
                                        old: {
                                            parent: '',
                                            filename: entry.name,
                                            name: tmp[1]
                                        },
                                        size: parseFloat(entry.size)/1024/1024,
                                        fileExt: fileExtRegEx.exec(entry.name)[1]
                                    });
                                }

                                callback();
                            }
                            else if (entry.type === 'd') // Directory
                            {
                                dirsToSearch.push(entry.name);
                                callback();
                            }
                            else callback();
                        },
                        function(err){
                            if(err) throw err;
                            cb();
                        });
                    });
                })
            },
            getFilesFromSubDirs: function(cb) {
                async.forEachSeries(dirsToSearch, function(dir, callback){
                    conn.cwd(VIDEO_DIR+'Unsorted Downloads/'+dir, function(err){
                        conn.list(function(e, entries) {
                            if (e) throw e;
                            async.forEachSeries(entries, function(entry, cb1){
                                if (entry.type === '-') // File
                                {
                                    var tmp = fileRegEx.exec(entry.name);
                                    if(tmp)
                                    {
                                        files.push({
                                            old: {
                                                parent: dir,
                                                filename: entry.name,
                                                name: tmp[1]
                                            },
                                            size: parseFloat(entry.size)/1024/1024,
                                            fileExt: fileExtRegEx.exec(entry.name)[1]
                                        });
                                    }
                                    cb1();
                                }
                                else cb1();
                            },
                            function(err){
                                if(err) throw err;
                                callback();
                            });
                        });
                    });
                },
                function(err){
                    if(err) throw err;
                    cb();
                });
            },
            getFileInfo: function(cb) {
                async.forEachSeries(files, function(file, callback){
                    var tester = file.old.name;
                    if(file.old.parent.length)
                    {
                        tester = file.old.parent;
                    }
                    if(tvRegEx.exec(tester))
                    {
                        func.getTVShowInfo(tester, function(show){
                            console.log(show);
                            file.tv = show;
                            callback();
                        })
                    }
                    else
                    {
                        func.getMovieTitle(tester, function(movie){
                            console.log('Movie: '+ movie);
                            file.movie = movie;
                            callback();
                        })
                    }
                },
                function(err){
                    if(err) throw err;
                    cb();
                });
            },
            moveFiles: function(cb) {
                async.forEachSeries(files, function(file, callback){
                    var olddir = file.old.parent;
                    var newdir;
                    var newFileName = "";
                    if(file.old.parent.length)
                    {
                        olddir = file.old.parent + '/';
                    }
                    if(file.movie)
                    {
                        newFileName = file.movie;
                        newdir = 'Movies/';
                        conn.rename(VIDEO_DIR+'Unsorted Downloads/'+olddir+file.old.filename, VIDEO_DIR+newdir+newFileName+"."+file.fileExt, function(err){
                            if(err) throw err;
                            callback();
                        });
                    }
                    else if(file.tv)
                    {
                        var show = file.tv;
                        newFileName = show.season +"x"+ show.episode +" - "+ show.episodeName;
                        newdir = "TV Shows/"+ show.name+"/Season "+ parseInt(show.season, 10) +"/";
                        async.series({
                            createSeriesDir: function(cb1){
                                conn.mkdir(VIDEO_DIR+"TV Shows/"+show.name, function(err, newdir){
                                    if(err) throw err;
                                    cb1();
                                })
                            },
                            createSeasonDir: function(cb1){
                                conn.mkdir(VIDEO_DIR+"TV Shows/"+show.name+"/Season "+ parseInt(show.season, 10), function(err, newdir){
                                    if(err) throw err;
                                    cb1();
                                })
                            }
                        },
                        function(err){
                            if(err) throw err;
                            conn.rename(VIDEO_DIR+'Unsorted Downloads/'+olddir+file.old.filename, VIDEO_DIR+newdir+newFileName+"."+file.fileExt, function(err){
                                if(err) throw err;
                                callback();
                            });
                        });
                    }

                },
                function(err)
                {
                    if(err) throw err;
                    cb();
                });
            }
        },
        function(err, results) {
            console.log('Done!');
            conn.end();
            process.exit();
        });
    });
});

conn.connect();