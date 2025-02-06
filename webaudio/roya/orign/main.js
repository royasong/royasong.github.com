alert("roya - Hello world! (START) ");
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();
const audioElement = document.querySelector('audio');
const track = audioContext.createMediaElementSource(audioElement);
const playButton = document.querySelector('button');
playButton.addEventListener('click', function (){
    if(audioContext.state === 'suspended'){
        audioContext.resume();
    }
    console.log("this.dataset : ", this.dataset);
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
const volumeControl = document.querySelector('#volume');
volumeControl.addEventListener('input', function(){
    gainNode.gain.value = this.value
    alert("roya - volumeControl START ");
	gainNode.gain.setValueAtTime(2.0, audioContext.currentTime);
	track.connect(gainNode);
	let analyserNode = audioContext.createAnalyser();
	analyserNode.fftSize = 2048;
	gainNode.connect(analyserNode);
	let pannerOptions = {
		pan: 0
	};
	let pannerNode = new StereoPannerNode(audioContext, pannerOptions);
	pannerNode.pan.value = 0.5;
	gainNode.connect(pannerNode);

}, false);

const pannerOptions = { pan : 0 };
const panner = new StereoPannerNode(audioContext, pannerOptions);

const pannerControl = document.querySelector('#panner');

pannerControl.addEventListener('input', function(){
	alert("roya - pannerControl START ");
	let test_feedForward =   [0.1215955842, 0.2431911684, 0.1215955842];
	let test_feedBackward =  [1.2912769759, -1.5136176632, 0.7087230241];
	const iirfilter = new IIRFilterNode(audioContext, {
	  feedforward: test_feedForward,
	  feedback: test_feedBackward,
	});
	track.connect(iirfilter).connect(audioContext.destination);
}, false);
track.connect(gainNode).connect(panner).connect(audioContext.destination);
