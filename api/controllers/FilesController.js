/**
 * FilesController
 *
 * @description :: Server-side logic for managing files
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

function index (request, response) {
    response.writeHead(200, {'content-type': 'text/html'});
    response.end(
        '<form action="/files/upload" enctype="multipart/form-data" method="post">\n' +
        '\t<label>Username: </label><input type="text" name="username"><br />\n' +
        '\t<label>Avatar: </label><input type="file" name="avatar"><br />\n' +
        '\t<input type="submit" value="Upload" />\n' +
        '</form>'
    );
};

module.exports = {
    index: index,
};
