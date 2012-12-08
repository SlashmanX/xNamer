var FTPClient = require('ftp');

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
    // authenticate as anonymous
    conn.auth(userOptions.username, userOptions.password, function(e) {
        if (e)
            throw e;
        conn.list(function(e, entries) {
            if (e)
                throw e;
            console.log('<start of directory list>');
            for (var i=0,len=entries.length; i<len; ++i) {
                if (typeof entries[i] === 'string')
                    console.log('<raw entry>: ' + entries[i]);
                else {
                    if (entries[i].type === 'l')
                        entries[i].type = 'LINK';
                    else if (entries[i].type === '-')
                        entries[i].type = 'FILE';
                    else if (entries[i].type === 'd')
                        entries[i].type = 'DIR';
                    console.log(' ' + entries[i].type + ' ' + entries[i].size
                        + ' ' + entries[i].date + ' ' + entries[i].name);
                }
            }
            console.log('<end of directory list>');
            conn.end();
        });
    });
});
conn.connect();