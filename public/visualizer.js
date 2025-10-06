const fileInput = document.getElementById('file');
const playBtn = document.getElementById('play');
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
let audio, audioCtx, analyser, source, dataArray;

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = (canvas.clientHeight || 400) * devicePixelRatio;
}
window.addEventListener('resize', resize);
resize();

function setupAudioFromFile(file) {
  if (audio) {
    audio.pause();
    audio = null;
  }
  audio = new Audio();
  audio.src = URL.createObjectURL(file);
  audio.crossOrigin = "anonymous";
  audio.controls = true;
  audio.loop = false;
  return setupContext(audio);
}

function setupContext(a) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (source) source.disconnect();
  source = audioCtx.createMediaElementSource(a);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  return { analyser, bufferLength };
}

function draw() {
  requestAnimationFrame(draw);
  if (!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0,0,w,h);

  const barWidth = (w / dataArray.length) * 2.5;
  let x = 0;
  for (let i = 0; i < dataArray.length; i++) {
    const v = dataArray[i] / 255;
    const barHeight = v * h;
    const hue = i / dataArray.length * 360;
    ctx.fillStyle = `hsl(${hue}, 90%, ${Math.round(30 + v*50)}%)`;
    ctx.fillRect(x, h - barHeight, barWidth, barHeight);
    x += barWidth + 1;
  }
}
draw();

playBtn.addEventListener('click', async () => {
  if (!fileInput.files[0]) {
    alert('Please choose an audio file first');
    return;
  }
  const f = fileInput.files[0];
  const { analyser } = setupAudioFromFile(f);
  audio.play();
  if (audioCtx && audioCtx.state === 'suspended') await audioCtx.resume();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) {
    playBtn.textContent = 'Play';
  }
});

