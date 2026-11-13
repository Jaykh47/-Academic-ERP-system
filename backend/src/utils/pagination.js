/**
 * PAGINATION UTILITY
 *
 * Almost every list endpoint in the system needs pagination.
 * This helper standardises how we:
 *   1. Read page/limit from query parameters
 *   2. Apply them to Mongoose queries
 *   3. Build the metadata object in every list response
 *
 * Usage inside a controller:
 *
 *   const { page, limit, skip } = getPaginationParams(req.query);
 *   const total = await Model.countDocuments(filter);
 *   const docs  = await Model.find(filter).skip(skip).limit(limit);
 *   res.json(new ApiResponse(200, "Fetched", {
 *     items: docs,
 *     pagination: buildPaginationMeta(page, limit, total),
 *   }));
 */

/**
 * Extracts and sanitises page/limit from query params.
 * Applies safe defaults and hard caps so a client can't request 10,000 records.
 *
 * @param {object} query - req.query object
 * @returns {{ page, limit, skip }}
 */
export const getPaginationParams = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10)); // cap at 100
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds the pagination metadata object included in every list response.
 *
 * @param {number} page       - current page
 * @param {number} limit      - items per page
 * @param {number} total      - total matching documents
 * @returns {object}
 */
export const buildPaginationMeta = (page, limit, total) => ({
  currentPage:  page,
  itemsPerPage: limit,
  totalItems:   total,
  totalPages:   Math.ceil(total / limit),
  hasNextPage:  page < Math.ceil(total / limit),
  hasPrevPage:  page > 1,
});

