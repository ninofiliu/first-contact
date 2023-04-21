export default () => {
  let fps = 0;
  setInterval(() => {
    console.log(`fps: ${fps}`);
    fps = 0;
  }, 1000);
  const loop = () => {
    fps++;
    requestAnimationFrame(loop);
  };
  loop();
};
