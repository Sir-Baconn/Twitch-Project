const {google} = require('googleapis');
const options = require('./options');
var axios = require('axios');

var oauth2Client = null;

function getAuthURL(callback){
    oauth2Client = new google.auth.OAuth2(
        options.storageConfig.youtube.client_id,
        options.storageConfig.youtube.client_secret,
        options.storageConfig.youtube.redirect_url
    );
    var url = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
    
      // If you only need one scope you can pass it as a string
      scope: 'https://www.googleapis.com/auth/youtube',
      prompt: 'consent'
    });

    return callback(url);
}

async function getTokens(code){
     return await oauth2Client.getToken(code);
}

function setCred(tokens){
    oauth2Client.setCredentials(tokens);
}

function getChannelID(token){
    return axios
        .get('https://www.googleapis.com/youtube/v3/channels', {
            params: {
                part: 'id',
                mine: 'true',
                access_token: token
            }
        })
        .then(response => {
            // console.log(response);
            return response.data;
        })
        .catch(error => {
            console.log('<getChannelID>: ' + error);
        });
}

function getChannelVideos(channelID){
    return axios
        .get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                channelId: channelID,
                type: 'video',
                order: 'date',
                key: options.storageConfig.youtube.api_key
            }
        })
        .then(response => {
            // console.log(response);
            return response.data;
        })
        .catch(error => {
            console.log('<getChannelVideos>: ' + JSON.stringify(error.response));
        });
}

module.exports = {
    getAuthURL: getAuthURL,
    getTokens: getTokens,
    getChannelID: getChannelID,
    getChannelVideos: getChannelVideos,
    setCred: setCred
};