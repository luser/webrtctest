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

function showVideoStream(stream) {
  if ("mozSrcObject" in v) {
      v.mozSrcObject = stream;
  } else {
      v.src = webkitURL.createObjectURL(stream);
  }
}

pc.onicecandidate = function(event) {
    console.log("onicecandidate");
    otherwin.postMessage({"type":"ice", "candidate": JSON.stringify(event.candidate)}, "*");
};

pc.onaddstream = function(streamevent) {
  console.log("onaddstream: " + streamevent);
  showVideoStream(streamevent.stream);
};

pc.onopen = function() {
  console.log("onopen");
};

pc.onstatechange = function() {
  console.log("onstatechange: " + pc.readyState);
}

function start() {
  console.log("start");
  otherwin = window.open("webrtctest.html", "webrtctest2", "resizable=yes,scrollbars=yes,toolbar=yes");
  otherwin.onload = function() {
    var streams = {video: true};
    function failure(err) {
        console.error("getUserMedia error: " + err.message);
    }
    function gotStream(stream) {
      console.log("getUserMedia: " + stream);
      pc.addStream(stream);
      showVideoStream(stream);
      pc.createOffer(function(offer) {
        console.log("offer created");
        otherwin.postMessage({"type": "offer", "sdp": offer.sdp}, "*");
        pc.setLocalDescription(offer);
      }, function(err) { console.log("createOffer error: " + err.message); });
    }
    if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia(streams, gotStream, failure);
    } else if (navigator.mozGetUserMedia) {
      navigator.mozGetUserMedia(streams, gotStream, failure);
    }
  };
}

function setOffer(sdp) {
  console.log("setOffer");
  var offer = {type:"offer", sdp:sdp};
  var rtc_offer = offer;
  try {
    rtc_offer = new RTCSessionDescription(offer);
  } catch (x) {
    rtc_offer = offer;
  }
  pc.setRemoteDescription(rtc_offer, function() {
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
  var answer = {type:"answer", sdp:sdp};
  var rtc_answer;
  try {
    rtc_answer = new RTCSessionDescription(answer);
  } catch (x) {
    rtc_answer = answer;
  }
  pc.setRemoteDescription(rtc_answer, function() {
    console.log("setRemoteDescription");
  });
}

function setice(ice) {
  console.log("setice");
  pc.addIceCandidate(new RTCIceCandidate(ice));
}
