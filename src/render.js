// Video Element
const videoElement = document.querySelector("video");
//Buttons
const startRecBtn = document.getElementById("startRecBtn");
const stopRecBtn = document.getElementById("stopRecBtn");
const videoSourceBtn = document.getElementById("videoSourceBtn");
videoSourceBtn.onclick = getAllVideoSources;
let mediaRecorder;
const recordedChunks = [];

const mimeType = "video/webm; codecs=vp9";

const { desktopCapturer, remote } = require("electron");
const { Menu } = remote;
async function getAllVideoSources(){
  const inputSources = await desktopCapturer.getSources({
    types: ["window", "screen"]
  });

  const videoMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      }
    })
  );
  videoMenu.popup();
}


async function selectSource(source){
  videoSourceBtn.innerText = source.name;

  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id
      }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  videoElement.srcObject = stream;
  videoElement.play();

  const options = {mimeType: mimeType};
  mediaRecorder = new MediaRecorder(stream, options);

  // Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(d){
  recordedChunks.push(d.data)
}

const {dialog } = remote;
const {writeFile} = require("fs");
async function handleStop(d){
  const blob = new Blob(recordedChunks, {
    type: mimeType
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Video speichern',
    defaultPath: `vid-${Date.now()}.webm`
  });
  if(filePath){
    writeFile(filePath, buffer, () => console.log("Saved Video to: "+ filePath));
  }else{
    console.log(filePath);
  }
  
};

// Button actions
stopRecBtn.onclick = e => {
  mediaRecorder.stop();
  startRecBtn.classList.remove('is-danger');
  startRecBtn.innerText = 'Start';
};
startRecBtn.onclick = e => {
  mediaRecorder.start();
  startRecBtn.classList.add('is-danger');
  startRecBtn.innerText = 'Recording';
};