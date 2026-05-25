export const getAvailableTestQuery = (base: Record<string, any> = {}) => {
  const now = new Date();
  return {
    ...base,
    isActive: true,
    $and: [
      ...(base.$and || []),
      { $or: [{ activeFrom: { $exists: false } }, { activeFrom: null }, { activeFrom: { $lte: now } }] },
      { $or: [{ activeUntil: { $exists: false } }, { activeUntil: null }, { activeUntil: { $gt: now } }] },
    ],
  };
};

export const deactivateExpiredTests = async (TestModel: any) => {
  await TestModel.updateMany(
    { isActive: true, activeUntil: { $ne: null, $lte: new Date() } },
    { $set: { isActive: false } }
  );
};
