const sails = require('sails');
const uuid = require('uuid4');

/**
 * ImagesController
 *
 * @description :: Server-side logic for managing images
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

function _generateRandomFilename () {
    return uuid();
}

function _determineFileExtension (filename) {
    if (filename.indexOf('.') > -1) {
        return `.${filename.substr(filename.indexOf('.') + 1).toLowerCase()}`;
    } else {
        return '';
    }
}

function index (request, response) {
    response.writeHead(200, {'content-type': 'text/html'});
    response.end(
        '<form action="/images/upload" enctype="multipart/form-data" method="post">\n' +
        '\t<label>Username: </label><input type="text" name="username"><br />\n' +
        '\t<label>Avatar: </label><input type="file" name="avatar" accept="image/*"><br />\n' +
        '\t<input type="submit" value="Upload" />\n' +
        '</form>'
    );
};

function s3upload (request, response) {
    let filenameToBeSavedAs;
    request.file('avatar').upload({
        adapter: require('skipper-s3'),
        key: sails.config.privates.amazonS3.apiKey,
        secret: sails.config.privates.amazonS3.apiSecret,
        bucket: sails.config.privates.amazonS3.bucketName,
        saveAs: function determineFileNameToBeSavedAs (currentFile, callback) {
            const filename = _generateRandomFilename();
            const fileextension = _determineFileExtension(currentFile.filename);
            filenameToBeSavedAs = `${filename}${fileextension}`;
            callback(null, filenameToBeSavedAs);
        },
        dirname: 'originals',
    }, function callbackOnS3Upload (err, filesUploaded) {
        if (err) {
            return response.negotiate(err);
        } else {
            const filePathSavedAs = filesUploaded[0].fd;
            // eslint-disable-next-line no-undef
            Images.create({
                filename: filePathSavedAs.substr(filePathSavedAs.lastIndexOf('/') + 1),
            }).exec(function onModelCreate (err, newModelRecord) {
                if (err) {
                    return response.negotiate(err);
                } else {
                    return response.ok({
                        message: 'Image uploaded successfully!',
                        newModelRecord: newModelRecord,
                        fileMetadata: filesUploaded[0],
                    });
                }
            });
        }
    });
};

module.exports = {
    index: index,
    upload: s3upload,
};
