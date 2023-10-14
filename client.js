import AWS from 'aws-sdk';

// *
// * Variables
// *
const localSourceBucket = ""
const localDestinationBucket = "";
const localAccessKeyId = "";
const localSecretAccessKey = "";
// * UAT
const uatSourceBucket = ""
const uatDestinationBucket = "";
const uatAccessKeyId = "";
const uatSecretAccessKey = "";
// * Staging
const stagingSourceBucket = ""
const stagingDestinationBucket = "";
const stagingAccessKeyId = "";
const stagingSecretAccessKey = "";
// * Production
const prodSourceBucket = ""
const prodDestinationBucket = "";
const prodAccessKeyId = "";
const prodSecretAccessKey = "";


// *
// * Update parameters
// *

AWS.config.logger = console;
AWS.config.update({
  maxRetries: 2,
  httpOptions: {
      timeout: 300000,
      connectTimeout: 500000
  }
});

const sourceS3 = new AWS.S3({
    region: "us-east-2",
    accessKeyId: prodAccessKeyId,
    secretAccessKey: prodSecretAccessKey,
});

export const failedUploads = [];

// *
// * Update parameters
// *
export const migrateFile = (sourceKey, destinationKey) => {

sourceS3.copyObject({Bucket: prodDestinationBucket, CopySource: prodSourceBucket + sourceKey, Key: destinationKey}, function (err, data) {
  if (err) {
      console.log(`Error uploading file from ${sourceKey} to ${destinationKey}`, err, err.stack);
      failedUploads.push({'sourceKey': sourceKey, 'destinationKey': destinationKey})
  } else {
      console.log(`Success uploading file from ${sourceKey} to ${destinationKey}`, data);
  }
});
}
