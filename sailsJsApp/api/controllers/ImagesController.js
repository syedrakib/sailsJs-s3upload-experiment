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

function _determineFileNameToBeSavedAs (currentFile, callback) {
    const filename = _generateRandomFilename();
    const fileextension = _determineFileExtension(currentFile.filename);
    callback(null, `${filename}${fileextension}`);
}

function uploadForm (request, response) {
    return response.view('imageUploadForm');
};

function doImageUpload (request, response) {
    request.file('awesome_image').upload({
        adapter: require('skipper-s3'),
        key: sails.config.privates.amazonS3.apiKey,
        secret: sails.config.privates.amazonS3.apiSecret,
        bucket: sails.config.privates.amazonS3.bucketName,
        saveAs: _determineFileNameToBeSavedAs,
        dirname: 'originals',
    }, function onImageUpload (err, uploadedFiles) {
        if (err) {
            return response.negotiate(err);
        } else {
            const filePathSavedAs = uploadedFiles[0].fd;
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
                        fileMetadata: uploadedFiles[0],
                    });
                }
            });
        }
    });
};

module.exports = {
    uploadForm: uploadForm,
    doImageUpload: doImageUpload,
};
