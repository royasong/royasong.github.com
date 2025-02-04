<script>
var audio = document.getElementById("audio-source");
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source = audioCtx.createMediaElementSource(audio);
var gainNode = audioCtx.createGain();

var gainConnected = source.connect(gainNode);
gainConnected.connect(audioCtx.destination);

function play() {
    if (audio.paused) {
        audio.play()
    }
    else {
        audio.pause()
    }
}

function volumeUp() {
    
    if (gainNode.gain.value > 2) {
        gainNode.gain.value = 2
    }
    else {
        gainNode.gain.value += 0.2
    }
}

function volumeDown() {
    
    if (gainNode.gain.value < 0) {
        gainNode.gain.value = 0
    }
    else {
        gainNode.gain.value -= 0.2 
    }
}
</script>
