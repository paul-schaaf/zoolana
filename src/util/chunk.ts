export const chunk: <T extends Array<any>>(arr: T, perChunk: number) => T[] = (
  arr,
  perChunk
) =>
  arr.reduce((resultArray: any[], item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // start a new chunk
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
