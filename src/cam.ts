export default async () => {
  const video = document.createElement("video");
  video.style.transform = "scaleX(-1)";
  video.autoplay = true;
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
  document.body.append(video);
};
