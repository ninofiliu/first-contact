export const setupRecording = (canvas: HTMLCanvasElement) => {
  const recorder = new MediaRecorder(canvas.captureStream(), {
    videoBitsPerSecond: 10_000_000,
  });
  recorder.addEventListener("dataavailable", (evt) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(evt.data);
    a.download = "FirstContact.webm";
    a.click();
  });
  document.addEventListener("keydown", (evt) => {
    if (evt.key !== "r") return;
    switch (recorder.state) {
      case "inactive":
        recorder.start();
        break;
      case "recording":
        recorder.stop();
        break;
    }
  });
};
