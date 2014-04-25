var fs = require('fs');

exports.encode = function base64_encode(file) {

    var bitmap = fs.readFileSync(file);

    return new Buffer(bitmap).toString('base64');
}


exports.decode = function base64_decode(base64str, file) {

    var bitmap = new Buffer(base64str, 'base64');

    fs.writeFileSync(file, bitmap);
}
