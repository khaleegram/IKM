import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddNewReviewData {
  review_insert: Review_Key;
}

export interface AddNewReviewVariables {
  buyerId?: UUIDString | null;
  productId?: UUIDString | null;
  rating: number;
  reviewText?: string | null;
}

export interface GetProductReviewsData {
  reviews: ({
    id: UUIDString;
    buyerId?: UUIDString | null;
    productId?: UUIDString | null;
    rating: number;
    reviewText?: string | null;
    createdAt: TimestampString;
  } & Review_Key)[];
}

export interface GetProductReviewsVariables {
  productId: UUIDString;
}

export interface ListProductsByCategoryData {
  products: ({
    id: UUIDString;
    productName: string;
    productDescription?: string | null;
    price: number;
    inventoryCount: number;
    imageUrls?: string[] | null;
  } & Product_Key)[];
}

export interface ListProductsByCategoryVariables {
  category: string;
}

export interface OrderItem_Key {
  id: UUIDString;
  __typename?: 'OrderItem_Key';
}

export interface Order_Key {
  id: UUIDString;
  __typename?: 'Order_Key';
}

export interface Product_Key {
  id: UUIDString;
  __typename?: 'Product_Key';
}

export interface Review_Key {
  id: UUIDString;
  __typename?: 'Review_Key';
}

export interface Seller_Key {
  id: UUIDString;
  __typename?: 'Seller_Key';
}

export interface UpdateProductInventoryData {
  product_update?: Product_Key | null;
}

export interface UpdateProductInventoryVariables {
  productId: UUIDString;
  inventoryCount: number;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface AddNewReviewRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddNewReviewVariables): MutationRef<AddNewReviewData, AddNewReviewVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddNewReviewVariables): MutationRef<AddNewReviewData, AddNewReviewVariables>;
  operationName: string;
}
export const addNewReviewRef: AddNewReviewRef;

export function addNewReview(vars: AddNewReviewVariables): MutationPromise<AddNewReviewData, AddNewReviewVariables>;
export function addNewReview(dc: DataConnect, vars: AddNewReviewVariables): MutationPromise<AddNewReviewData, AddNewReviewVariables>;

interface GetProductReviewsRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetProductReviewsVariables): QueryRef<GetProductReviewsData, GetProductReviewsVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetProductReviewsVariables): QueryRef<GetProductReviewsData, GetProductReviewsVariables>;
  operationName: string;
}
export const getProductReviewsRef: GetProductReviewsRef;

export function getProductReviews(vars: GetProductReviewsVariables): QueryPromise<GetProductReviewsData, GetProductReviewsVariables>;
export function getProductReviews(dc: DataConnect, vars: GetProductReviewsVariables): QueryPromise<GetProductReviewsData, GetProductReviewsVariables>;

interface UpdateProductInventoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateProductInventoryVariables): MutationRef<UpdateProductInventoryData, UpdateProductInventoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: UpdateProductInventoryVariables): MutationRef<UpdateProductInventoryData, UpdateProductInventoryVariables>;
  operationName: string;
}
export const updateProductInventoryRef: UpdateProductInventoryRef;

export function updateProductInventory(vars: UpdateProductInventoryVariables): MutationPromise<UpdateProductInventoryData, UpdateProductInventoryVariables>;
export function updateProductInventory(dc: DataConnect, vars: UpdateProductInventoryVariables): MutationPromise<UpdateProductInventoryData, UpdateProductInventoryVariables>;

interface ListProductsByCategoryRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: ListProductsByCategoryVariables): QueryRef<ListProductsByCategoryData, ListProductsByCategoryVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: ListProductsByCategoryVariables): QueryRef<ListProductsByCategoryData, ListProductsByCategoryVariables>;
  operationName: string;
}
export const listProductsByCategoryRef: ListProductsByCategoryRef;

export function listProductsByCategory(vars: ListProductsByCategoryVariables): QueryPromise<ListProductsByCategoryData, ListProductsByCategoryVariables>;
export function listProductsByCategory(dc: DataConnect, vars: ListProductsByCategoryVariables): QueryPromise<ListProductsByCategoryData, ListProductsByCategoryVariables>;

