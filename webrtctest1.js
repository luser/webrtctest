var pc = new webkitRTCPeerConnection(null);
var v = document.getElementById("video");
var input = document.getElementById("input");
var ice = document.getElementById("ice");
var error = null;
var otherwin = null;

window.addEventListener("message", function(event) {
  if (event.data.type == "answer") {
    setAnswer(event.data.sdp);
  } else if (event.data.type == "ice") {
    setice(JSON.parse(event.data.candidate));
  }
});

pc.onicecandidate = function(event) {
    console.log("onicecandidate");
    otherwin.postMessage({"type":"ice", "candidate": JSON.stringify(event.candidate)}, "*");
};

function start() {
  console.log("start");
  otherwin = window.open("webrtctest2.html", "webrtctest2", "resizable=yes,scrollbars=yes,toolbar=yes");
  otherwin.onload = function() {
    navigator.webkitGetUserMedia({video: true}, function(stream) {
      console.log("getUserMedia: " + stream);
      pc.addStream(stream);
      v.src = webkitURL.createObjectURL(stream);
      v.play();
      pc.createOffer(function(offer) {
        console.log("offer created");
        otherwin.postMessage({"type": "offer", "sdp": offer.sdp}, "*");
        pc.setLocalDescription(offer);
      }, function(err) { console.log("createOffer error: " + err.message); error = err; });
    }, function(err) { console.log("getUserMedia error: " + err.message); error = err; });
  };
}

function setAnswer(sdp) {
 console.log("setAnswer");
 var answer = new RTCSessionDescription({type:"answer", sdp:sdp})
 pc.setRemoteDescription(answer, function() {
   console.log("setRemoteDescription");
 });
}

function setice(ice) {
    console.log("setice");
    pc.addIceCandidate(new RTCIceCandidate(ice));
}
