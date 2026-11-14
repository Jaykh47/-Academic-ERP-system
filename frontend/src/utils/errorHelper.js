/**
 * Helper to extract descriptive error messages from backend responses
 */
export const formatApiError = (err, fallback = "An error occurred") => {
  if (err?.response?.data?.errors && Array.isArray(err.response.data.errors) && err.response.data.errors.length > 0) {
    return err.response.data.errors.map((e) => e.message).join(". ");
  }
  return err?.response?.data?.message || err?.message || fallback;
};
