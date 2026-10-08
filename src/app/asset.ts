/** URL of a file in public/, correct for any deployment base path. */
export const asset = (path: string) => `${import.meta.env.BASE_URL}${path}`;
