export default <T>(x: T | undefined | null): T => {
  if (!x) throw new Error("should not be nullish");
  return x;
};
