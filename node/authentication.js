const bcrypt = require('bcryptjs');
const database = require('./database');

function storeUser(username, password){

    bcrypt.hash(password, 10, function(err, hash) {
        //store username and password in db
        database.insertUser(username, hash, function(success){
            
        });
    });
    
}

function userExists(username, password, callback){
    database.getUser(username, password, function(res){
        return callback(res);
    });
}


module.exports = {
    storeUser: storeUser,
    userExists: userExists
};