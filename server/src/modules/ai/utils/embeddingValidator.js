const validateEmbedding = (vector, expectedDimension) => {
  if (!vector) {
    throw new Error('Vector does not exist');
  }
  
  if (!Array.isArray(vector)) {
    throw new Error('Vector is not an array');
  }
  
  if (vector.length !== expectedDimension) {
    throw new Error(`Vector dimension mismatch. Expected ${expectedDimension}, got ${vector.length}`);
  }
  
  for (let i = 0; i < vector.length; i++) {
    if (vector[i] === null) {
      throw new Error(`Vector contains null value at index ${i}`);
    }
    if (Number.isNaN(vector[i])) {
      throw new Error(`Vector contains NaN value at index ${i}`);
    }
  }
  
  return true;
};

module.exports = {
  validateEmbedding
};
