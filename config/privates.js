require('dotenv').config();

module.exports.privates = {
    amazonS3: {
        apiKey: process.env.AMAZON_S3_API_KEY,
        apiSecret: process.env.AMAZON_S3_API_SECRET,
        bucketName: process.env.AMAZON_S3_BUCKET_NAME,
    },
};
