export const chunk: <T>(arr: T[], perChunk: number) => T[][] = (
  arr,
  perChunk
) => {
  type T = typeof arr[0];
  const initial: T[][] = [];

  return arr.reduce((resultArray: T[][], item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, initial);
};
