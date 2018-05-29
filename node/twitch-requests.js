var axios = require('axios');
var { URLSearchParams } = require('url');

// Twitch API client id
const CLIENT_ID = 'jjkfx0rdgvk3ddm2y2fd4doq5m1mba';
const CLIENT_SECRET = '73c55kpq9xvtiy4qdi4mgrg5qtnbna';

function getUserFollowersID(token){
    return getUserID(token).then(function(user_id){
        if(user_id == 'error401'){
            return 'error401';
        }
        return getFollowersIDList(user_id).then(function(userFollowers){
            // console.log('FOLLWOERS: ' + JSON.stringify(userFollowers));
            var followersIDList = extractIDs(userFollowers, true);
            return getUsersByIDs(followersIDList).then(function(users){
                return users;
            });
        });
    });
}

function getUserID(token){
    return axios
        .get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        })
        .then(response => {
            return response.data.data[0].id;
        })
        .catch(error => {
            console.log('<getUserID>: ' + error);
            if(error.response.status == 401){
                return 'error401';
            }
        });
}

function getUserIDFromUsername(login){
    return axios
        .get('https://api.twitch.tv/helix/users', {
            headers: {
                'Client-ID': 'jjkfx0rdgvk3ddm2y2fd4doq5m1mba'
            },
            params: {
                login: login
            }
        })
        .then(response => {
            return response.data.data[0];
        })
        .catch(error => {
            console.log('<getUserIDFromUsername>: ' + error);
        });
}

// This will only return the first 20 followers.
// Need to modify it so that we get the response.data.total amount instead of just 20.
// We do this implementing the cursor which is under response.data.pagination.cursor.
// Google search "twitch cursor" and ctrl f cursor.
function getFollowersIDList(user_id){
    return axios.get('https://api.twitch.tv/helix/users/follows', {
        headers: {
            'Client-ID': CLIENT_ID
        },
        params: {
            from_id: user_id
        }
    })
    .then(response => {
        // console.log('response: ' + JSON.stringify(response.data));
        return response.data.data;
    })
    .catch(error => {
        console.log('<getFollowersIDList>: ' + error);
    });
}

function getUserByID(user_id){
    return axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Client-ID': CLIENT_ID
        },
        params: {
            id: user_id
        }
    })
    .then(response => {
        // console.log('the user associated: ' + response.data.data[0].display_name);
        return response.data.data[0];
    })
    .catch(error => {
        console.log('<getUserByID>: ' + error);
    });
}

function getUsersByIDs(user_ids){
    var url = 'https://api.twitch.tv/helix/users?id=' + user_ids[0];
    for (let i = 1; i < user_ids.length; i++) {
        url += '&id=' + user_ids[i];
    }
    
    return axios.get(url, {
        headers: {
            'Client-ID': CLIENT_ID
        }
    })
    .then(response => {
        // console.log('the users associated: ' + response.data.data);
        return response.data.data;
    })
    .catch(error => {
        // console.log(error.response.config);
        console.log('<getUsersByIDs>: ' + error);
    });
}

function getLiveFollowers(followers){
    var followersIDList = extractIDs(followers, false);

    var url = 'https://api.twitch.tv/helix/streams?user_id=' + followersIDList[0];
    for (let i = 1; i < followersIDList.length; i++) {
        url += '&user_id=' + followersIDList[i];
    }

    return axios.get(url, {
        headers: {
            'Client-ID': CLIENT_ID
        }
    })
    .then(response => {
        var liveStreamsIDs = [];
        for(let i = 0; i < response.data.data.length; i++){
            liveStreamsIDs.push(response.data.data[i].user_id);
        }
        return liveStreamsIDs;
    })
    .catch(error => {
        console.log('<getLiveFollowers>: ' + error);
    });

}

function getTwitchClips(user_id){
    var url = 'https://api.twitch.tv/helix/clips';
    
    return axios.get(url, {
        headers: {
            'Client-ID': CLIENT_ID
        },
        params: {
            broadcaster_id: user_id,
            first: '3'
        }
    })
    .then(response => {
        // console.log(response);
        return response.data.data;
    })
    .catch(error => {
        console.log('<getTwitchClips>: ' + error);
    });
}

function getNewToken(refreshToken){
    let url = 'https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token=' + refreshToken + '&client_id=' + CLIENT_ID + '&client_secret=' + CLIENT_SECRET;
    return axios.post(url)
    .then(response => {
        return response.data;
        // response.data has .access_token, .expires_in, .refresh_token
    })
    .catch((error) => {
        console.log('<getToken>: ' + JSON.stringify(error.response.data));
    });
}

/**
 * Helper to extract only the IDs of user objects
 * @param {Array} followers The list of user objects
 * @param {Boolean} isToID If the object in question needs to_id or id property
 */
function extractIDs(followers, isToID){
    var followersIDList = [];
    if(isToID){
        for(let i = 0; i < followers.length; i++){
            followersIDList.push(followers[i].to_id);
        }
    }else{
        for(let i = 0; i < followers.length; i++){
            followersIDList.push(followers[i].id);
        }
    }

    return followersIDList;
}

module.exports = {
    getUserFollowersID: getUserFollowersID,
    getNewToken: getNewToken,
    getUserByID: getUserByID,
    getUserIDFromUsername: getUserIDFromUsername,
    getLiveFollowers: getLiveFollowers,
    getTwitchClips: getTwitchClips
}