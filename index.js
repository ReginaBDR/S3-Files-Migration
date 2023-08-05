import axios from "axios";
import { migrateFile, failedUploads } from "./client.js";
import fs from 'fs';

// *
// * Variables
// *
const localTokenUrl = "http://localhost:9080/auth/realms/jhipster/protocol/openid-connect/token"
const localPackagesUrl = "http://localhost:8080/services/productslibraryapp/api/all-products";
const localAttributesUrl = "http://localhost:8080/services/productslibraryapp/api/products";
const localProjectsUrl = "http://localhost:8080/services/projectsapp/api/get-projects-ids-by-product-ids";
// * TeamRed
const redTokenUrl = "https://auth.red.platform-development.infrastructurebuilder.ai/auth/realms/jhipster/protocol/openid-connect/token"
const redPackagesUrl = "https://red.platform-development.infrastructurebuilder.ai/services/productslibraryapp/api/all-products";
const redAttributesUrl = "https://red.platform-development.infrastructurebuilder.ai/services/productslibraryapp/api/products";
const redProjectsUrl = "https://red.platform-development.infrastructurebuilder.ai/services/projectsapp/api/get-projects-ids-by-product-ids";
// * Core2
const core2TokenUrl = "https://auth.core2.platform-development.infrastructurebuilder.ai/auth/realms/jhipster/protocol/openid-connect/token"
const core2PackagesUrl = "https://core2.platform-development.infrastructurebuilder.ai/services/productslibraryapp/api/all-products";
const core2AttributesUrl = "https://core2.platform-development.infrastructurebuilder.ai/services/productslibraryapp/api/products";
const core2ProjectsUrl = "https://core2.platform-development.infrastructurebuilder.ai/services/projectsapp/api/get-projects-ids-by-product-ids";
// * UAT
const uatTokenUrl = "https://auth.platform-uat.infrastructurebuilder.ai/auth/realms/jhipster/protocol/openid-connect/token"
const uatPackagesUrl = "https://platform-uat.infrastructurebuilder.ai/services/productslibraryapp/api/all-products";
const uatAttributesUrl = "https://platform-uat.infrastructurebuilder.ai/services/productslibraryapp/api/products";
const uatProjectsUrl = "https://platform-uat.infrastructurebuilder.ai/services/projectsapp/api/get-projects-ids-by-product-ids";
// * Staging
const stagingTokenUrl = "https://auth.platform-staging.infrastructurebuilder.ai/auth/realms/jhipster/protocol/openid-connect/token"
const stagingPackagesUrl = "https://platform-staging.infrastructurebuilder.ai/services/productslibraryapp/api/all-products";
const stagingAttributesUrl = "https://platform-staging.infrastructurebuilder.ai/services/productslibraryapp/api/products";
const stagingProjectsUrl = "https://platform-staging.infrastructurebuilder.ai/services/projectsapp/api/get-projects-ids-by-product-ids";
// * Production
const prodTokenUrl = "https://auth.platform.infrastructurebuilder.ai/auth/realms/jhipster/protocol/openid-connect/token"
const prodPackagesUrl = "https://platform.infrastructurebuilder.ai/services/productslibraryapp/api/all-products";
const prodAttributesUrl = "https://platform.infrastructurebuilder.ai/services/productslibraryapp/api/products";
const prodProjectsUrl = "https://platform.infrastructurebuilder.ai/services/projectsapp/api/get-projects-ids-by-product-ids";

// *
// * Config
// * Change url variables for each environment
// *
let authToken;
const urlencoded = new URLSearchParams();
urlencoded.append("response_type", "token");
urlencoded.append("client_id", "web_app");
urlencoded.append("username", "admin"); // prod: admin  staging: admin@everest.com
urlencoded.append("password", "USyIBAgyWQIMYI099PCf"); // prod: USyIBAgyWQIMYI099PCf  staging: AdminEverest123
urlencoded.append("grant_type", "password");

const tokenUrl = prodTokenUrl;
const packagesUrl = prodPackagesUrl;
const attributesUrl = prodAttributesUrl;
const projectsUrl= prodProjectsUrl;

// *
// * Script
// *

const saveNewAttributePath = (productId, attributeId, destinationPath) => {
  return axios.patch(
      `${attributesUrl}/${productId}/product-attributes/${attributeId}`,
      destinationPath,
      {headers: {"Content-Type": "application/merge-patch+json"}}
    )
    .then((res) => console.log(`Successfully updated attributeId: ${attributeId} for productId: ${productId} with new value.s3uri: ${destinationPath}`))
    .catch((e) => {
      failedPackages.push({'product': productId, 'attribute': attributeId, 'destinationPath': destinationPath})
      console.error(`Error on package ${productId} attribute ${attributeId} key update: `, e);
    });
};

const allAttributesWithPackage = [];
const allProjectIds = [];
const attributesUpdatePromise = [];
const filesMigrationPromise = [];
const failedPackages = [];

// https://stackoverflow.com/questions/37213316/execute-batch-of-promises-in-series-once-promise-all-is-done-go-to-the-next-bat/64543086#64543086
const promiseAllInBatches = async (task, items, batchSize) => {
  let position = 0;
  let results = [];
  while (position < items.length) {
      const itemsForBatch = items.slice(position, position + batchSize);
      results = [...results, ...await Promise.allSettled(itemsForBatch.map(item => task(...item)))];
      position += batchSize;
  }
  return results;
}

new Promise((resolve, reject) => {
  // * API Authentication
  const authentication = axios
    .post(tokenUrl, urlencoded, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((response) => {
      authToken = response.data.access_token;
      axios.defaults.headers = {
        'Accept': 'application/json',
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      };
      console.log('Login Successfull');
    })
    .catch((e) => {
      console.error("Error on authentication request", e);
    });
  

  Promise.all([authentication])
    .then(() => {
      // * Fetch all attributes with packages from all organizations
      const packageActive = true;
      return axios
        .get(`${packagesUrl}/${packageActive}`)
        .then((res) => {
          console.log("Successfully retrieved all attributes with packages");
          return res.data;
        })
        .then((res) => {return allAttributesWithPackage.push(...res)})
        .catch((e) => {
          console.error("Error on fetch all attributes with packages: ", e);
        });
    })
    .then(() => {
      // * Get project Id for package when is project package type.
       const projectPackageIds = []
       allAttributesWithPackage.map(product => {
        if (product.productTypeId !== 1 && product.productTypeId !== 2) {
          return projectPackageIds.push(product.id);
        }
      });
      return axios.post(projectsUrl, projectPackageIds, {headers: {Authorization: `Bearer ${authToken}`}})
      .then((response) => {
        console.log(`Successfully retrieved projectIds`);
        return allProjectIds.push(response.data);
      })
      .catch(e => console.error('Error on fetch projectIds', e))
    }).then(() => {
      // * For each attribute migrate file and update key
      allAttributesWithPackage.forEach(attribute => {

        const sourcePath = attribute.value.s3uri; // 'productsFiles/Gen 4(2022-03-03 23_00_15)-thumbnail-500(2022-12-06 14:52:24).jpeg'
        const fileName = sourcePath.split(/\/(?=[^/]+$)/)[1];
        const productId = attribute.id.toString();
        let destinationPath;
        // const oldSourcePath = 'productsFiles/' + fileName;  // ! Use only if file upload fails to recover the files.

        if (attribute.productTypeId === 1) {
          destinationPath = `${attribute.tenantId}/package-library/package/${attribute.id}/category/${attribute.key}/${fileName}`;
        }
        if (attribute.productTypeId === 2) { // shared package library
          destinationPath = `${attribute.tenantId}/package-library/package/${attribute?.parentProduct?.id || attribute.id}/category/${attribute.key}/${fileName}`;
        }
        if (attribute.productTypeId === 3) { // cloned library package into project
          const projectId = allProjectIds[0][productId] || null;
          destinationPath = projectId ? `${attribute.tenantId}/project/${projectId}/package/${attribute?.parentProduct?.id || attribute.id}/category/${attribute.key}/${fileName}` : null;
        }
        if (attribute.productTypeId === 4) {
          const projectId = allProjectIds[0][productId] || null;
          destinationPath = projectId ? `${attribute.tenantId}/project/${projectId}/package/${attribute.id}/category/${attribute.key}/${fileName}` : null;
        }
        if (attribute.productTypeId === 5) { // shared project package
          const projectId = allProjectIds[0][productId] || null;
          destinationPath = projectId ? `${attribute.tenantId}/project/${projectId}/package/${attribute?.parentProduct?.id || attribute.id}/category/${attribute.key}/${fileName}` : null;
        }
        
        if (destinationPath !== null) {
          // * Copy all files from the old folder into the new bucket folder.
          filesMigrationPromise.push([sourcePath, destinationPath]);
          // * Update the package attribute with the new file path in field values.s3uri
          attributesUpdatePromise.push([attribute.id, attribute.attributeId, destinationPath]);
        } else {
          failedPackages.push({'product': productId, 'attribute': attribute.attributeId, 'project': allProjectIds[0][productId]})
        }
      })
    }).then(() => {

      // * Migrate files from buckets
      // return filesMigrationPromise.forEach((file) => {
      //   return migrateFile(...file)
      // })

    })
    .then(() => {

      // * Update attributes
      //return promiseAllInBatches(saveNewAttributePath, attributesUpdatePromise, 7);

    }).finally(() => {
      console.info('Migration finished successfully!!!');
      failedPackages.push(failedUploads);
      const text = failedPackages.reduce((txt, cur) => txt + '\n' + JSON.stringify(cur), '');
      fs.writeFileSync('failedPackages', text, 'utf-8');
      console.log('Skipped packages during migration: ', failedPackages);
    })
});