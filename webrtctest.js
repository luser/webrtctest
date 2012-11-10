function createPeerConnection() {
  if (window.mozRTCPeerConnection)
    return new mozRTCPeerConnection();
  if (window.webkitRTCPeerConnection)
    return new webkitRTCPeerConnection(null);
  return null;
}

var pc = createPeerConnection();
var v = document.getElementById("video");
var otherwin = window.opener || null;

if (otherwin == null) {
    window.addEventListener("load", start, false);
}

window.addEventListener("message", function(event) {
  if (otherwin == null)
    otherwin = event.source;
  if (event.data.type == "offer") {
    setOffer(event.data.sdp);
  } else if (event.data.type == "answer") {
    setAnswer(event.data.sdp);
  } else if (event.data.type == "ice") {
    setice(JSON.parse(event.data.candidate));
  }
});

pc.onicecandidate = function(event) {
    console.log("onicecandidate");
    otherwin.postMessage({"type":"ice", "candidate": JSON.stringify(event.candidate)}, "*");
};

pc.onaddstream = function(streamevent) {
  console.log("onaddstream: " + streamevent);
  v.src = webkitURL.createObjectURL(streamevent.stream);
  v.play();
};

function start() {
  console.log("start");
  otherwin = window.open("webrtctest.html", "webrtctest2", "resizable=yes,scrollbars=yes,toolbar=yes");
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

function setOffer(sdp) {
  console.log("setOffer");
  var offer = new RTCSessionDescription({type:"offer", sdp:sdp});
  pc.setRemoteDescription(offer, function() {
    console.log("setRemoteDescription");
    pc.createAnswer(function(answer) {
      console.log("answer created");
      pc.setLocalDescription(answer);
      otherwin.postMessage({"type": "answer", "sdp": answer.sdp}, "*");
    });
  });
};

function setAnswer(sdp) {
 console.log("setAnswer");
 var answer = new RTCSessionDescription({type:"answer", sdp:sdp});
 pc.setRemoteDescription(answer, function() {
   console.log("setRemoteDescription");
 });
}

function setice(ice) {
    console.log("setice");
    pc.addIceCandidate(new RTCIceCandidate(ice));
}
