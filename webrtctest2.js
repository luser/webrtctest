var pc = new webkitRTCPeerConnection(null);
var v = document.getElementById("video");
var input = document.getElementById("input");
var ice = document.getElementById("ice");
var otherwin = window.opener;

window.addEventListener("message", function(event) {
  if (otherwin == null)
    otherwin = event.source;
  if (event.data.type == "offer") {
    setOffer(event.data.sdp);
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

function setOffer(sdp) {
  console.log("setOffer");
  var offer = new RTCSessionDescription({type:"offer", sdp:sdp})
  pc.setRemoteDescription(offer, function() {
    console.log("setRemoteDescription");
    pc.createAnswer(function(answer) {
      console.log("answer created");
      pc.setLocalDescription(answer);
      otherwin.postMessage({"type": "answer", "sdp": answer.sdp}, "*");
    });
  });
};

function setice(ice) {
    console.log("setice");
    pc.addIceCandidate(new RTCIceCandidate(ice));
}
