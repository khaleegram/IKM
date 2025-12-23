import { AddNewReviewData, AddNewReviewVariables, GetProductReviewsData, GetProductReviewsVariables, UpdateProductInventoryData, UpdateProductInventoryVariables, ListProductsByCategoryData, ListProductsByCategoryVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAddNewReview(options?: useDataConnectMutationOptions<AddNewReviewData, FirebaseError, AddNewReviewVariables>): UseDataConnectMutationResult<AddNewReviewData, AddNewReviewVariables>;
export function useAddNewReview(dc: DataConnect, options?: useDataConnectMutationOptions<AddNewReviewData, FirebaseError, AddNewReviewVariables>): UseDataConnectMutationResult<AddNewReviewData, AddNewReviewVariables>;

export function useGetProductReviews(vars: GetProductReviewsVariables, options?: useDataConnectQueryOptions<GetProductReviewsData>): UseDataConnectQueryResult<GetProductReviewsData, GetProductReviewsVariables>;
export function useGetProductReviews(dc: DataConnect, vars: GetProductReviewsVariables, options?: useDataConnectQueryOptions<GetProductReviewsData>): UseDataConnectQueryResult<GetProductReviewsData, GetProductReviewsVariables>;

export function useUpdateProductInventory(options?: useDataConnectMutationOptions<UpdateProductInventoryData, FirebaseError, UpdateProductInventoryVariables>): UseDataConnectMutationResult<UpdateProductInventoryData, UpdateProductInventoryVariables>;
export function useUpdateProductInventory(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateProductInventoryData, FirebaseError, UpdateProductInventoryVariables>): UseDataConnectMutationResult<UpdateProductInventoryData, UpdateProductInventoryVariables>;

export function useListProductsByCategory(vars: ListProductsByCategoryVariables, options?: useDataConnectQueryOptions<ListProductsByCategoryData>): UseDataConnectQueryResult<ListProductsByCategoryData, ListProductsByCategoryVariables>;
export function useListProductsByCategory(dc: DataConnect, vars: ListProductsByCategoryVariables, options?: useDataConnectQueryOptions<ListProductsByCategoryData>): UseDataConnectQueryResult<ListProductsByCategoryData, ListProductsByCategoryVariables>;
