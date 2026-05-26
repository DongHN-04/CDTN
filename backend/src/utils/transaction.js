const mongoose = require('mongoose');

const isStandaloneTransactionError = (error) => (
  /Transaction numbers are only allowed on a replica set member or mongos/i.test(error?.message || '') ||
  /This MongoDB deployment does not support retryable writes/i.test(error?.message || '')
);

const runWithOptionalTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    try {
      let result;
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error) {
      if (!isStandaloneTransactionError(error)) {
        throw error;
      }

      // Local MongoDB standalone khong ho tro transaction. Fallback nay giup dev local
      // van thao tac duoc; production nen dung replica set/Atlas de dam bao atomic.
      console.warn('MongoDB transaction is not available; running operation without a transaction.');
      return await work(null);
    }
  } finally {
    session.endSession();
  }
};

module.exports = {
  runWithOptionalTransaction,
};
