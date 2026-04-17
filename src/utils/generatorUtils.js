/**
 * Common logic for generating unique items with a limit on attempts and UI-friendly yielding
 */
export async function generateUniqueItems({
  count,
  generateItem,
  getKey,
  isValid = () => true,
  maxAttemptsFactor = 10,
}) {
  const items = [];
  const seen = new Set();
  const maxAttempts = count * maxAttemptsFactor;
  let attempts = 0;

  while (items.length < count && attempts < maxAttempts) {
    attempts++;
    const item = generateItem();
    
    if (!isValid(item)) continue;

    const key = getKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      items.push(item);
      
      // Yield to keep UI responsive every 50 items
      if (items.length % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }
  return items;
}
