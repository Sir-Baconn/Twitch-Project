var fs = require('fs'), configPath = './config/config.json';

var parsed = JSON.parse(fs.readFileSync(configPath, 'UTF-8'));

exports.storageConfig = parsed;