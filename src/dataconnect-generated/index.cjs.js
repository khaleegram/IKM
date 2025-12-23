const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'ikm',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const addNewReviewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewReview', inputVars);
}
addNewReviewRef.operationName = 'AddNewReview';
exports.addNewReviewRef = addNewReviewRef;

exports.addNewReview = function addNewReview(dcOrVars, vars) {
  return executeMutation(addNewReviewRef(dcOrVars, vars));
};

const getProductReviewsRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetProductReviews', inputVars);
}
getProductReviewsRef.operationName = 'GetProductReviews';
exports.getProductReviewsRef = getProductReviewsRef;

exports.getProductReviews = function getProductReviews(dcOrVars, vars) {
  return executeQuery(getProductReviewsRef(dcOrVars, vars));
};

const updateProductInventoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateProductInventory', inputVars);
}
updateProductInventoryRef.operationName = 'UpdateProductInventory';
exports.updateProductInventoryRef = updateProductInventoryRef;

exports.updateProductInventory = function updateProductInventory(dcOrVars, vars) {
  return executeMutation(updateProductInventoryRef(dcOrVars, vars));
};

const listProductsByCategoryRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListProductsByCategory', inputVars);
}
listProductsByCategoryRef.operationName = 'ListProductsByCategory';
exports.listProductsByCategoryRef = listProductsByCategoryRef;

exports.listProductsByCategory = function listProductsByCategory(dcOrVars, vars) {
  return executeQuery(listProductsByCategoryRef(dcOrVars, vars));
};
