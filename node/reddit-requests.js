var axios = require('axios');

const snoowrap = require('snoowrap');
var r;
function createRedditClient(){
    r = new snoowrap({
      userAgent: 'ts332',
      clientId: '4mu5-wYni8CNvw',
      clientSecret: '-G5Y4cVRMTWUWpmJE5GHDqyHkkk',
      username: 'Sir-Baconnn',
      password: 'rutgers332ts'
    });
}

// r.getHot().map(post => post.title).then(console.log);

function getSubredditPosts(subreddit, numPosts){
    return r.getHot(subreddit, {limit: numPosts}).then(function (posts) {
    
        // posts.forEach(function (post) {
        //   console.log(post.permalink);
        // });
        return posts;
    });
}

function getPostEmbeds(url){
    return axios
        .get('https://www.reddit.com/oembed', {
            params: {
                url: encodeURI('https://www.reddit.com' + url),
                maxwidth: 300
            }
        })
        .then(response => {
            return response.data.html;
        })
        .catch(error => {
            console.log('<getPostEmbeds>: ' + error);
            return error;
        });
}

function getAllPostEmbeds(posts, callback){
    var embeds = [];
    for(var i = 0; i < 3; i++){
        getPostEmbeds(posts[i].permalink).then(function(embed){
            embeds.push(embed);
            if(embeds.length == 3){
                return callback(embeds);
            }
        });
    }
}

module.exports = {
    createRedditClient: createRedditClient,
    getSubredditPosts: getSubredditPosts,
    getPostEmbeds: getPostEmbeds,
    getAllPostEmbeds: getAllPostEmbeds
}