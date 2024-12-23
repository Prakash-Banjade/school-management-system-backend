import { SelectQueryBuilder } from "typeorm";

/**
 * @param {SelectQueryBuilder<T>} queryBuilder - The TypeORM query builder instance.
 * @param {string | undefined} branchId - The branch id.
 * @returns {SelectQueryBuilder<T>} The updated query builder.
 * 
 * @description This function is used to apply a filter to the query builder based on the branch id.
 */
export default function applyBranchFilter<T>(queryBuilder: SelectQueryBuilder<T>, branchId: string | undefined): SelectQueryBuilder<T> {
    if (branchId) queryBuilder.andWhere('account.branchId = :branchId', { branchId });

    return queryBuilder;
}