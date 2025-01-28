export const validatePath = (path) => {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw new Error('Invalid path format');
    }
  };
  
  export const handleBatchResponse = (response) => {
    if (response.results?.[0]?.error) {
      throw new PuterError(response.results[0].error);
    }
    return response;
  };