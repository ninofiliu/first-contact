export default <T>(arr: T[]): T => arr[~~(arr.length * Math.random())];
