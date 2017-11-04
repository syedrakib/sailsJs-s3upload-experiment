'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
    signatureVersion: 'v4',
});
const Sharp = require('sharp');

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const S3_HOSTING_URL = process.env.S3_HOSTING_URL;

exports.handler = function lambdaEventHandler (event, context, callback) {
    const requestedFullKey = event.queryStringParameters.key;
    const match = requestedFullKey.match(/(\d+)x(\d+)\/(.*)/);
    const width = parseInt(match[1], 10);
    const height = parseInt(match[2], 10);
    const objectFilename = match[3];

    S3.getObject({
        Bucket: S3_BUCKET_NAME,
        Key: `originals/${objectFilename}`,
    }).promise()
        .then((data) => {
            return Sharp(data.Body).resize(width, height).toFormat('png').toBuffer();
        })
        .then((buffer) => {
            return S3.putObject({
                Body: buffer,
                Bucket: S3_BUCKET_NAME,
                ContentType: 'image/png',
                Key: requestedFullKey,
            }).promise();
        })
        .then(() => {
            callback(null, {
                statusCode: '301',
                headers: {'location': `${S3_HOSTING_URL}/${requestedFullKey}`},
                body: '',
            });
        })
        .catch((err) => {
            callback(err);
        });
};
