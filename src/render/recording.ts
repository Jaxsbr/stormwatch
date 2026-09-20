/** Opt-in review capture. Records the live canvas without changing simulation state. */
export function attachRecording(canvas: HTMLCanvasElement): () => void {
  const panel = document.createElement("div");
  panel.className = "review-recording";
  panel.innerHTML =
    '<button type="button">Record 20s of battlefield</button><a hidden>Download battlefield clip</a><span>Canvas only · normal gameplay</span>';
  document.body.append(panel);
  const button = panel.querySelector("button")!;
  const link = panel.querySelector("a")!;
  let recorder: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let url: string | undefined;
  let clip: Blob | undefined;
  const localSave = document.createElement("button");
  localSave.textContent = "Save clip to review folder";
  localSave.hidden = true;
  if (location.hostname === "127.0.0.1" && location.port === "4176")
    panel.append(localSave);
  localSave.onclick = async () => {
    if (!clip) return;
    localSave.disabled = true;
    try {
      const response = await fetch("/__review/capture", {
        method: "POST",
        body: clip,
      });
      if (!response.ok) throw new Error("Review save failed");
      const result = (await response.json()) as { path: string };
      localSave.textContent = `Saved: ${result.path}`;
    } catch {
      localSave.textContent = "Save failed — retry";
      localSave.disabled = false;
    }
  };
  if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
    button.disabled = true;
    button.textContent = "Recording unavailable in this browser";
  }
  button.onclick = () => {
    if (url) URL.revokeObjectURL(url);
    link.hidden = true;
    localSave.hidden = true;
    localSave.disabled = false;
    localSave.textContent = "Save clip to review folder";
    stream = canvas.captureStream(30);
    const mimeType = ["video/webm;codecs=vp9", "video/webm"].find((type) =>
      MediaRecorder.isTypeSupported(type),
    );
    recorder = new MediaRecorder(
      stream,
      mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined,
    );
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream?.getTracks().forEach((track) => track.stop());
      if (!panel.isConnected) return;
      clip = new Blob(chunks, { type: recorder!.mimeType });
      url = URL.createObjectURL(clip);
      localSave.hidden = false;
      link.href = url;
      link.download = "stormwatch-normal-gameplay.webm";
      link.hidden = false;
      button.disabled = false;
      button.textContent = "Record another 20s";
    };
    recorder.start();
    button.disabled = true;
    button.textContent = "Recording battlefield…";
    timer = setTimeout(() => recorder?.stop(), 20_000);
  };
  return () => {
    panel.remove();
    clearTimeout(timer);
    if (recorder?.state === "recording") recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    if (url) URL.revokeObjectURL(url);
  };
}
