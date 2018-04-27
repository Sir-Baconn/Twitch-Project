var Twitter = require('twitter');
 
var client;

function createTwitterClient(){
    client = new Twitter({
        consumer_key: 'YKxlMDtbiRgqcIYNOBXqEtnPS',
        consumer_secret: '5vQZF1AzZtYAHf0Y7nMfNlxuQFUjONsMFJsf5uZFDnQq3xbnNy',
        access_token_key: '362744597-LIWGJe22UR2J14s8pKAyt0OB4u49nM2Q88wr8Y2o',
        access_token_secret: 'NpGwPWn2Y1f4ExdINhTKPjPBx0Giz1QC9swqNnQCLTUja'
    });
}

// We want the text, user.screen_name, user.profile_image_url, retweet_count, and favorite_count
function searchTweets(q, lang, result_type, callback){
    client.get('search/tweets', {q: q, lang: lang, result_type: result_type}, function(error, tweets, response) {
        if(!error){
            var tweetsArray = [];
            for(var i = 0; i < tweets.statuses.length; i++){
                var theTweet = tweets.statuses[i];
                var tImportantStuff = {
                    text: theTweet.text,
                    screen_name: theTweet.user.screen_name,
                    profile_image_url: theTweet.user.profile_image_url,
                    retweet_count: theTweet.retweet_count,
                    favorite_count: theTweet.favorite_count
                };
                // console.log(theTweet);
                tweetsArray.push(tImportantStuff);
            }
            // console.log(tweets.statuses[0]);
            return callback(tweetsArray);
        }else{
            console.log(error);
        }
    });    
}

function getTweetsByUser(screen_name, count, exclude_replies, include_rts, callback){
    client.get('/statuses/user_timeline', {screen_name: screen_name, count: count, exclude_replies: exclude_replies, include_rts: include_rts}, function(error, tweets, response){
        if(!error){
            var tweetURLs = [];
            for(var i = 0; i < tweets.length; i++){
                // console.log(tweets[i].id_str);
                tweetURLs.push('https://twitter.com/' + screen_name + '/status/' + tweets[i].id_str);
            }
            return callback(tweetURLs);
        }else{
            console.log('<getTweetsByUser>: ' + error);
            return error;
        }
    });
}

function getEmbedTweets(urls, maxwidth, hide_media, callback){
    var htmls = [];
    for(var i = 0; i < urls.length; i++){
        client.get('/statuses/oembed', {url: encodeURI(urls[i]), maxwidth: maxwidth, hide_media: hide_media}, function(error, tweet, response){
            if(!error){
                htmls.push(tweet.html);
            }else{
                console.log('<getEmbedTweets>: ' + error);
                return error;
            }

            if(htmls.length == urls.length){
                // These are out of order because of the asynchronous, no way to really sort by date because it just gives the html
                return callback(htmls);
            }
        });
    }
}

module.exports = {
    createTwitterClient: createTwitterClient,
    searchTweets: searchTweets,
    getTweetsByUser: getTweetsByUser,
    getEmbedTweets: getEmbedTweets
};