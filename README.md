# sailsJs-s3upload-lambdaRetrieve-experiment

Uses [SailsJS](http://sailsjs.org) to upload an image to Amazon S3 bucket and then uses AWS Lambda and Amazon API Gateway to generate resized versions of that image on-the-fly upon request.

---

### Synopsis

The resized versions will not be produced right away after uploading the image - they will be generated on-the-fly only upon request, thus, not taking up essential S3 space.

The resized images will be automatically deleted from S3 based on the lifecycle/expiration rules specified for the S3 bucket.

If the resized versions are requested again (after they got automatically deleted), the images will be regenerated again on-the-fly.

There are no lifecycle/expiration rules specified for any of the original images; so they are designed to stay in the S3 bucket forever.

---

### Available routes:

* The usual **CRUD** APIs for `/images` endpoint are available automatically from SailsJS out-of-the-box.
  * **GET /images**
  * **GET /images/:id**
  * **POST /images**
  * **PUT /images/:id**
  * **DELETE /images/:id**
  * These routes ONLY affect the model/database records of images in the application
* Additional customized routes have been added as part of the solution
  * **GET /images/upload** - presents an HTML view containing a form to upload an image
  * **POST /images/upload** - called by the upload form to perform the actual upload of the image
  * **GET /images/view/:imgFilename** - presents an HTML view with all the resized versions of the image specified by `:imgFilename`.

---

### Application pre-requisites

As the images will be uploaded to a S3 bucket, it is important to define 3 important environment variables which will be used by the SailsJS app to authenticate with S3:

* AMAZON_S3_API_KEY
* AMAZON_S3_API_SECRET
* AMAZON_S3_BUCKET_NAME

All these environment variables are pre-templated in a `.env.tmplt` file. It is expected to copy-paste this file to a `.env` file (on the same path as the `.env.tmplt` file) which is used by the `dotenv` NPM package when the node service is launched.

---

### Full behavior

* Upon submitting the form to upload an image, the image will be uploaded to `<s3_bucket>/originals/<image_name>.jpg`.
* To view a resized version of the image, a customized path will be requested: `<s3_bucket>/r/<width>x<height>/<image_name>.jpg`.
  * Upon first request, S3 will respond with a **404 Not Found** response.
  * However, a redirection rule is defined in the s3 bucket to redirect all 404 requests out to an Amazon API Gateway via a **307 Temporary Redirect** response.
  * The Amazon API Gateway is configured to invoke a lambda function.
  * The lambda function is a NodeJS based function.
    * it will perform a `s3:getObject` on `/originals/<image_name>.jpg`;
    * it will resize the image to the requested `/<width>x<height>/` dimensions;
    * it will perform a `s3:putObject` on `/r/<width>x<height>/<image_name>.jpg`;
    * then it will return a **301 Moved Permanently** response redirecting to `<s3_bucket>/r/<width>x<height>/<image_name>.jpg`.
  * The 301 response of AWS Lambda will be subsequently emitted back as a 301 response of the Amazon API Gateway.
* This 301 response from the Amazon API Gateway received by the browser, will cause the browser to re-fetch `<s3_bucket>/r/<width>x<height>/<image_name>.jpg`.
* This time, the request will respond with a **200 OK** as opposed to the **404 Not Found** response earlier - because by now the AWS lambda has put the respective image in that path already.
* For all subsequent requests to `<s3_bucket>/r/<width>x<height>/<image_name>.jpg` it will respond with a **200 OK** as the respective image object is now available in that path.

---

### Lifecycle rules
  * The S3 bucket has been configured with a Lifecycle Rule which will cause all objects under the  `<s3_bucket>/r/*` path older than 1 day to be deleted automatically, thus, reclaiming essential S3 storage space.
  * After the object has been automatically deleted, if the object at `<s3_bucket>/r/<width>x<height>/<image_name>.jpg` is requested again, the **Full behavior** stated above will execute again like usual and the object at `<s3_bucket>/r/*` will be re-generated and retrieved successfully.
  * No lifecycle rules have been put in place for objects under the `<s3_bucket>/originals/*` path - so these original images are designed to stay in the S3 bucket forever.

---

### Designed for failure

This approach of resizing images on-the-fly has been designed for failure. In the event that an image could not be resized due to any network (or any other) issues, any subsequent requests to the same path will cause the **Full behavior** stated above to execute again and the image will be ready again.

In contrast, consider an approach which expects images to be resized immediately upon upload. If (in any case) the resize operation did not complete successfully upon uploading, then all subsequent requests to fetch the resized image will also fail as the resized image was never produced on the first place.

---

### Citation

The solution presented in this project has been partly inspired by the article from **AWS Compute Blog** at https://aws.amazon.com/blogs/compute/resize-images-on-the-fly-with-amazon-s3-aws-lambda-and-amazon-api-gateway/

---
