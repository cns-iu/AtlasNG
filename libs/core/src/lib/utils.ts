/**
 * Test if the provided storage is available and functional.
 *
 * @param getStorage A function that returns the storage object to test.
 * @returns A boolean indicating whether the storage is available and functional.
 */
export function isStorageAvailable(getStorage: () => Storage): boolean {
  const testKey = '__atlasng_storage_test__';
  let storage: Storage | undefined;

  try {
    storage = getStorage();
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return !!(error instanceof DOMException && error.name === 'QuotaExceededError' && storage && storage.length !== 0);
  }
}
