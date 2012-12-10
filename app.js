var FTPClient = require('ftp');
var async = require('async');

var func = require('./functions.js');

var dirsToSearch = [];

var connOptions = {
    host: '192.168.1.38',
    port: 9999
};

var userOptions = {
    username: 'admin',
    password: 'pass'
}

var conn = new FTPClient(connOptions);
conn.on('connect', function() {
    console.log('connected');
    conn.auth(userOptions.username, userOptions.password, function(e) {
        if (e) throw e;
        console.log('authenticated');
        conn.cwd('/Video/Unsorted Downloads', function(e){
            if(e) throw e;
            conn.list(function(e, entries) {
                if (e) throw e;
                for (var i=0,len=entries.length; i<len; ++i) {
                    if (typeof entries[i] === 'string')
                        console.log('<raw entry>: ' + files[j]);
                    else {
                        if (entries[i].type === 'l')
                            entries[i].type = 'LINK';
                        else if (entries[i].type === '-')
                        {
                            entries[i].type = 'FILE';
                            func.getMovieTitle(entries[i].name, function(e, title){
                                if(e) console.log(title +' : '+ e);
                                else console.log('Movie: '+ title);
                            })
                        }
                        else if (entries[i].type === 'd')
                        {
                            entries[i].type = 'DIR';
                            console.log('./'+entries[i].name);
                            dirsToSearch.push(entries[i].name);
                        }
                    }
                }
                console.log('<end of directory list>');
                getSubDirs(conn);
            });
        });
    });
});
conn.connect();

function getSubDirs(conn) {
    var k = 0;
    var kLength = dirsToSearch.length;

    async.whilst(
        function() { return k < kLength},
        function(callback){
            conn.list('./'+dirsToSearch[k], false, function(e, files){
                if(e) throw e;
                for (var j=0,lent=files.length; j<lent; ++j) {
                    if (typeof files[j] === 'string')
                        console.log('<raw entry>: ' + files[j]);
                    else {
                        if (files[j].type === '-')
                        {
                            files[j].type = 'FILE';
                            func.getMovieTitle(files[j].name, function(e, title){
                                if(e) console.log(title +' : '+ e);
                                else console.log('Movie: '+ title);
                            })
                        }
                    }
                }
                k++;
                callback();
            })
        },
        function(err){
            if(err) throw err;
            conn.end();
        }
    )
}