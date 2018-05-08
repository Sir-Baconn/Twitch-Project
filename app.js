// Third party stuff
var bodyParser = require('body-parser');                // Helps get stuff back from form inputs
var express = require('express');                       // Handles page routing
var mysql = require('mysql');                           // Library for interacting with mysql DB
var app = express();                                    
var session = require('express-session');               //Unused right now, don't worry about it
// var cors = require('cors');

var request = require('request');                       // These next 2 are for making api requests, USE AXIOS NOT REQUEST
var axios = require('axios');
var util = require('util');

// Our stuff
// File that handles database stuff
const database = require('./node/database');
// File that handles twitch api requests
const twitchRequests = require('./node/twitch-requests');
// File that handles user authentication
const authenticator = require('./node/authentication');

const youtubeRequests = require('./node/youtube-requests');

const twitterRequests = require('./node/twitter-requests');

const redditRequests = require('./node/reddit-requests');

// Just setup, ignore
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'fdsaafddfdfsfdsfddfs'
}));

// GET /
// This code runs when you either go to / (aka the homepage) or are redirected to /
// app.get('/', function(req, res, next)) is a function that is called when a get request is sent to /
// req is basically what was requested
// res is the response to give after get is done basically what to do next
// next don't worry about
app.get('/', function(req, res, next){
    database.startConnection();
    // This 'if' happens when you go through signing up and linking your twitch because the twitch api puts a 'code' attribute in the query string.
    // After signing up and linking your twitch, look at the url and you will see a 'code' in the url.
    // This code is a code for the given user in order to access that user's data on twitch's side.
    if(req.query.code){

        // Make a post request to the twitch api for an access token for that user to get the user's data
        request.post(
            'https://id.twitch.tv/oauth2/token?client_id=himelq3xvx1icqplgayiw7zh9czhyr&client_secret=ots8plkd9d6qis81yy6oe1kctyb0yl&grant_type=authorization_code&redirect_uri=https://twitch-social.herokuapp.com/&code=' + req.query.code,
            { json: { key: 'value' } },
            function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    // console.log('body: ' + JSON.stringify(body));
                    // If we were successful, get that user's followers and also live followers, then load the home page (index.ejs) while sending the followers
                    // to that ejs file where it will be used to display the followers in a certain way.
                    database.insertUserTwitchTokens(req.session.username, body.access_token, body.refresh_token, function(result){
                        twitchRequests.getUserFollowersID(body.access_token).then(function(followers){
                            twitchRequests.getLiveFollowers(followers).then(function(stuff){
                                for(let i = 0; i < followers.length; i++){
                                    if(stuff.includes(followers[i].id)){
                                        followers[i].stream_status = 'live';
                                    }
                                }
                                res.render('index', {
                                    followers: followers
                                });
                            });
                        });
                    });
                }
            }
        );
    }else{
        // This happens when you first go to the page and do nothing, we just load the landing.ejs file
        // console.log('hello');
        res.render('landing');
        // res.redirect('https://id.twitch.tv/oauth2/authorize?client_id=himelq3xvx1icqplgayiw7zh9czhyr&redirect_uri=http://localhost:3000&response_type=code&scope=user:edit');
    }
    // res.render('landing');
});

app.get('/streamers', function(req, res, next){
    if(req.session.username){
        // This should be a pull from their followers in our database instead of the same api call of getting followers every time
        // api call should only be done when they login, in case they followed someone new

        database.getUserAccessToken(req.session.username, function(token){
            twitchRequests.getUserFollowersID(token.access_token).then(function(followers){
                // If we get an http 401 error, the user's access token expired, we need a new one
                if(followers == 'error401'){
                    twitchRequests.getNewToken(token.refresh_token).then(function(newToken){
                        database.insertUserTwitchTokens(req.session.username, newToken.access_token, newToken.refresh_token, function(result){
                            twitchRequests.getUserFollowersID(newToken.access_token).then(function(followers){
                                twitchRequests.getLiveFollowers(followers).then(function(stuff){
                                    for(let i = 0; i < followers.length; i++){
                                        if(stuff.includes(followers[i].id)){
                                            followers[i].stream_status = 'live';
                                        }
                                    }
                                    res.render('index', {
                                        followers: followers
                                    });
                                });
                            });
                        });
                    });
                }else{
                    // If the user's access token is still valid, just get their followers
                    twitchRequests.getLiveFollowers(followers).then(function(stuff){
                        for(let i = 0; i < followers.length; i++){
                            if(stuff.includes(followers[i].id)){
                                followers[i].stream_status = 'live';
                            }
                        }
                        res.render('index', {
                            followers: followers
                        });
                    });
                }
            }).catch(error => {
                // console.log('errrrrr');
            });
        });
    }
});

// POST /streamers
// This code runs when you are directed to /streamers

// FOLLOWERS NEED TO BE STORED IN DB SO THAT WE DON'T NEED TO KEEP SENDING REQUESTS TO TWITCH, ONLY GET THEM ONCE ON INITIAL LOGIN
app.post('/streamers', function(req, res, next){
    if(req.body.login){
        authenticator.userExists(req.body.username, req.body.password, function(result){
            if(result){
                if(!req.session.username){
                    req.session.username = req.body.username;
                }
                database.getUserAccessToken(req.session.username, function(token){
                    twitchRequests.getUserFollowersID(token.access_token).then(function(followers){
                        // If we get an http 401 error, the user's access token expired, we need a new one
                        if(followers == 'error401'){
                            twitchRequests.getNewToken(token.refresh_token).then(function(newToken){
                                database.insertUserTwitchTokens(req.session.username, newToken.access_token, newToken.refresh_token, function(result){
                                    twitchRequests.getUserFollowersID(newToken.access_token).then(function(followers){
                                        twitchRequests.getLiveFollowers(followers).then(function(stuff){
                                            for(let i = 0; i < followers.length; i++){
                                                if(stuff.includes(followers[i].id)){
                                                    followers[i].stream_status = 'live';
                                                }
                                            }
                                            res.render('index', {
                                                followers: followers
                                            });
                                        });
                                    });
                                });
                            });
                        }else{
                            // If the user's access token is still valid, just get their followers
                            twitchRequests.getLiveFollowers(followers).then(function(stuff){
                                for(let i = 0; i < followers.length; i++){
                                    if(stuff.includes(followers[i].id)){
                                        followers[i].stream_status = 'live';
                                    }
                                }
                                res.render('index', {
                                    followers: followers
                                });
                            });
                        }
                    }).catch(error => {
                        // console.log('errrrrr');
                    });
                });
            }else{
                res.send('nope');
            }
        });
    }else if(req.body.signup){
        // This code gets run when you hit the sign up button on landing (look at landing.ejs for the form where action='/streamers')

        // Use authenticator file to store the user in the db
        authenticator.storeUser(req.body.username, req.body.password);
        req.session.username = req.body.username;

        // After storing the new user in the DB, redirect him to the oauth thing to link twitch account using twitch credentials
        res.redirect('https://id.twitch.tv/oauth2/authorize?client_id=himelq3xvx1icqplgayiw7zh9czhyr&redirect_uri=http://localhost:3000&response_type=code&scope=user:edit');
    }

    // req.body holds what was submitted in the form in json format, in this case it'll be a username and password (see landing.ejs) i.e. use req.body.username for the username
    // the body attributes such as 'username' are defined in the landing.ejs form
    // console.log(JSON.stringify(req.body));
    // authenticator.userExists(req.body.username, req.body.password);
});

// GET /scheduler
// This code runs when you go to /scheduler or are redirected to /scheduler
app.get('/scheduler', function(req, res, next){
    // res.redirect('https://id.twitch.tv/oauth2/authorize?client_id=himelq3xvx1icqplgayiw7zh9czhyr&redirect_uri=http://localhost:3000&response_type=code&scope=user:edit');
    res.render('scheduler');
})

app.get('/login', function(req, res, next){
    res.render('login');
});

app.get('/link_stuff', function(req, res, next){
    if(req.query.code){
        // console.log(req.query);
        youtubeRequests.getTokens(req.query.code).then(function(tokens){
            // console.log(tokens.tokens);
            database.insertUserYoutubeTokens(req.session.username, tokens.tokens.access_token, tokens.tokens.refresh_token, function(result){
                youtubeRequests.getChannelID(tokens.tokens.access_token).then(function(response){
                    database.insertUserYoutubeChannelID(req.session.username, response.items[0].id, function(result){
                        youtubeRequests.getChannelVideos(response.items[0].id).then(function(vids){
                            // console.log(vids.items[0].id.videoId);
                            res.render('link_stuff');
                        });
                    });
                });

            });
        }).catch(error => {
            console.log(error);
        });
    }else{
        res.render('link_stuff');
    }
});

app.get('/link_stuff/youtube', function(req, res, next){
    // console.log('running');
    youtubeRequests.getAuthURL(function(url){
        res.redirect(url);
    });
});

app.get('/link_stuff/twitter', function(req, res, next){

});

app.post('/home', function(req, res, next){
    if(req.body.username){
        database.getYoutubeChannelID(req.body.username, function(channelID){
            youtubeRequests.getChannelVideos(channelID).then(function(vids){
                var videos = [];
                for (let i = 0; i < 3; i++) {
                    videos.push(vids.items[i].id.videoId);
                }
                twitchRequests.getUserIDFromUsername(req.body.username).then(function(twitchInfo){
                    // console.log(twitchID);
                    var clips = [];
                    twitchRequests.getTwitchClips(twitchInfo.id).then(function(rawClips){
                        // console.log(rawClips);
                        for(let i = 0; i < 3; i++){
                            clips.push(rawClips[i].embed_url);
                        }
                        
                        database.getTwitterHandle(req.body.username, function(handle){
                            twitterRequests.createTwitterClient();
                            twitterRequests.getTweetsByUser(handle, 10, true, false, function(tweetURLs){
                                twitterRequests.getEmbedTweets(tweetURLs, 400, false, function(tweetEmbeds){
                                    redditRequests.createRedditClient();
                                    database.getSubreddit(req.body.username, function(subreddit){
                                        redditRequests.getSubredditPosts(subreddit, 3).then(function(posts){
                                            res.render('main', {
                                                twitchName: twitchInfo.login,
                                                twitchDisplayName: twitchInfo.display_name,
                                                twitchImage: twitchInfo.profile_image_url,
                                                youtubeID: channelID,
                                                ytvideos: videos,
                                                clips: clips,
                                                handle: handle,
                                                tweetHTMLs: tweetEmbeds,
                                                subreddit: subreddit,
                                                redditPosts: posts
                                            });
                                        });
                                    });
                                });
                            });
                        });

                    });
                });
            });
        });
    }else{
        // console.log('wat');
    }
});

app.get('/test', function(req, res, next){
    redditRequests.createRedditClient();
    redditRequests.getSubredditPosts('loltyler1', 3).then(function(posts){
        redditRequests.getAllPostEmbeds(posts, function(embeds){
            // console.log(embeds);
            res.send('hy');
        });
    });
});

// This is the server "listening" for a connection
app.listen(process.env.PORT || 3000, function() {
    console.log("Server running on 3000!");
});