import AWS from 'aws-sdk';

// *
// * Variables
// *
const localSourceBucket = "platform-products-library-files-local"
const localDestinationBucket = "platform-filemanager-files-development";
const localAccessKeyId = "AKIA3RCXEM4J6JMTVAKM";
const localSecretAccessKey = "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";
// * TeamRed
const redSourceBucket = "platform-products-library-files-red"
const redDestinationBucket = "platform-filemanager-files-red";
const redAccessKeyId = "AKIA3RCXEM4J6JMTVAKM";
const redSecretAccessKey = "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";
// * Core2
const core2SourceBucket = "platform-products-library-files-core2"
const core2DestinationBucket = "platform-filemanager-files-core2";
const core2AccessKeyId = "AKIA3RCXEM4J6JMTVAKM";
const core2SecretAccessKey = "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";
// * UAT
const uatSourceBucket = "platform-products-library-files-uat"
const uatDestinationBucket = "platform-filemanager-files-uat";
const uatAccessKeyId = "AKIA3RCXEM4J6JMTVAKM";
const uatSecretAccessKey = "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";
// * Staging
const stagingSourceBucket = "platform-products-library-files-staging"
const stagingDestinationBucket = "platform-filemanager-files-staging";
const stagingAccessKeyId = "AKIA3RCXEM4JS5YZ5AOF";
const stagingSecretAccessKey = "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";
// * Production
const prodSourceBucket = "platform-products-library-files-prod"
const prodDestinationBucket = "platform-filemanager-files-prod";
const prodAccessKeyId = "AKIA3RCXEM4JRPZ4ZVVI";
const prodSecretAccessKey = "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";


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

sourceS3.copyObject({Bucket: "platform-filemanager-files-prod", CopySource: "/platform-products-library-files-prod/" + sourceKey, Key: destinationKey}, function (err, data) {
  if (err) {
      console.log(`Error uploading file from ${sourceKey} to ${destinationKey}`, err, err.stack);
      failedUploads.push({'sourceKey': sourceKey, 'destinationKey': destinationKey})
  } else {
      console.log(`Success uploading file from ${sourceKey} to ${destinationKey}`, data);
  }
});
}
