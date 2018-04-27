var mysql = require('mysql');
const bcrypt = require('bcryptjs');
const options = require('./options');

// Global variable - gives access to mysql db connection
var db;

function startConnection() {
    db = mysql.createPool({
        connectionLimit: 10,
        host: options.storageConfig.database.host,
        user: options.storageConfig.database.user,
        password: options.storageConfig.database.password,
        database: options.storageConfig.database.database,
        multipleStatements: true
    });
}

// Closes the connection, call this whenever done using the DB connection
function closeConnection() {
    if (db !== "undefined")
        db.end();
}

function insertUser(username, password, callback){
    var user = {
        username: username,
        password: password
    };

    var query = 'INSERT INTO twitch_social.users SET ?';
    db.query(query, user, function(err, result){
        if(err){
            if(err.code === "ER_DUP_ENTRY"){
                // Someone tried to make an account with the same username as someone else
                // Handle that here
            }else if(err.code === "ER_ACCESS_DENIED_ERROR"){
                console.log('<insertUser>: Access denied, check if password is blank.');
            }
        }
        return callback(result);
    });
}

function insertUserTwitchTokens(username, access_token, refresh_token, callback){
    var data = {
        access_token: access_token,
        refresh_token: refresh_token
    };
    var alldata = [data, username];
    var query = "UPDATE `twitch_social`.`users` SET ? WHERE username= ?";
    db.query(query, alldata, function(err, result){
        if(err) throw err;
        return callback(result);
    });
}

function insertUserYoutubeTokens(username, access_token, refresh_token, callback){
    var data = {
        access_token: access_token,
        refresh_token: refresh_token,
        username: username
    };

    var query = "INSERT INTO twitch_social.youtube_info SET ?";
    db.query(query, data, function(err, result){
        if(err) throw err;
        return callback(result);
    });
}

function insertUserYoutubeChannelID(username, channelID, callback){
    var alldata = [channelID, username];
    var query = "UPDATE twitch_social.youtube_info SET channel_id= ? WHERE username= ?";
    db.query(query, alldata, function(err, result){
        if(err) throw err;
        return callback(result);
    });
}

function getUser(username, password, callback){
    var query = 'SELECT password FROM twitch_social.users WHERE username = ?';
    db.query(query, username, function(err, result){
        if(err) throw err;
        if(typeof result[0] === "undefined"){
            return callback(false);
        }
        bcrypt.compare(password, result[0].password, function(err, doesMatch){
            if (doesMatch){
                return callback(true);
            }else{
                return callback(false);
            }
        });
    });
}

function getUserAccessToken(username, callback){
    var query = 'SELECT access_token, refresh_token FROM twitch_social.users WHERE username = ?';
    db.query(query, username, function(err, result){
        if(err) throw err;
        return callback(result[0]);
    });
}

function getYoutubeChannelID(username, callback){
    var query = "SELECT channel_id FROM twitch_social.youtube_info WHERE username = ?";
    db.query(query, username, function(err, result){
        if(err) throw err;
        return callback(result[0].channel_id);
    })
}

function getTwitterHandle(username, callback){
    var query = 'SELECT handle FROM twitch_social.twitter_info WHERE username= ?';
    db.query(query, username, function(err, result){
        if(err) throw err;
        return callback(result[0].handle);
    });
}

function getSubreddit(username, callback){
    var query = 'SELECT subreddit FROM twitch_social.reddit_info WHERE username= ?';
    db.query(query, username, function(err, result){
        if(err) throw err;
        return callback(result[0].subreddit);
    });
}

module.exports = {
    startConnection: startConnection,
    closeConnection: closeConnection,

    insertUser: insertUser,
    insertUserTwitchTokens: insertUserTwitchTokens,
    insertUserYoutubeTokens: insertUserYoutubeTokens,
    insertUserYoutubeChannelID: insertUserYoutubeChannelID,

    getUser: getUser,
    getUserAccessToken: getUserAccessToken,
    getYoutubeChannelID: getYoutubeChannelID,
    getTwitterHandle: getTwitterHandle,
    getSubreddit: getSubreddit
};