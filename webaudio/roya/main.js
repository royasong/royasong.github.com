const AudioContext = window.AudioContext || window.webkitAudioContext;

const audioContext = new AudioContext();

//get the audio element
const audioElement = document.querySelector('audio');

//pass it into the audio context
const track = audioContext.createMediaElementSource(audioElement);
// track.connect(audioContext.destination);

//select our play button
const playButton = document.querySelector('button');

playButton.addEventListener('click', function (){
    //check if context is in suspended state (auto policy)
    if(audioContext.state === 'suspended'){
        audioContext.resume();
    }
    console.log("this.dataset : ", this.dataset);
    //play or pause track depending on state
    if(this.dataset.playing === 'false'){
        audioElement.play();
        this.dataset.playing = 'true'
    }else if(this.dataset.playing === 'true'){
        audioElement.pause();
        this.dataset.playing = 'false';
    }
},false);

audioElement.addEventListener('ended', () => {
    playButton.dataset.playing = 'false';
}, false);

const gainNode = audioContext.createGain();
// track.connect(gainNode).connect(audioContext.destination);

const volumeControl = document.querySelector('#volume');

volumeControl.addEventListener('input', function(){
    gainNode.gain.value = this.value
    console.log("(volumeControl) gainNode.gain.value = this.value" + this.value);
	gainNode.gain.setValueAtTime(2.0, audioContext.currentTime);
	// gainNode.gain.value = 2.0;
	track.connect(gainNode);

	let analyserNode = audioContext.createAnalyser();
	analyserNode.fftSize = 2048;
	gainNode.connect(analyserNode);

	let pannerOptions = {
		pan: 0
	};
	let pannerNode = new StereoPannerNode(audioContext, pannerOptions);
	pannerNode.pan.value = 0.5; // range: -1 ~ 1
	gainNode.connect(pannerNode);

}, false);

const pannerOptions = { pan : 0 };
const panner = new StereoPannerNode(audioContext, pannerOptions);

const pannerControl = document.querySelector('#panner');

pannerControl.addEventListener('input', function(){
    //gainNode.gain.value = this.value
    //console.log("(volumeControl) gainNode.gain.value = this.value" + this.value);
	let test_feedForward =   [0.1215955842, 0.2431911684, 0.1215955842];
	let test_feedBackward =  [1.2912769759, -1.5136176632, 0.7087230241];
	const iirfilter = new IIRFilterNode(audioContext, {
	  feedforward: test_feedForward,
	  feedback: test_feedBackward,
	});
	track.connect(iirfilter).connect(audioContext.destination);

    console.log("(pannerControl) panner.pan.value = this.value = this.value" + this.value);
}, false);
track.connect(gainNode).connect(panner).connect(audioContext.destination);
