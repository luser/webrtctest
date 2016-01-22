// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/
/*global RTCPeerConnection, RTCSessionDescription, RTCIceCandidate */
var pc = new RTCPeerConnection();
var localvideo;
var remotevideo;
var otherwin = window.opener || null;
var audio, video, data;

window.addEventListener("DOMContentLoaded", function() {
  localvideo = document.getElementById("local");
  remotevideo = document.getElementById("remote");
  if (!otherwin) {
    document.getElementById("controls").style.display = "";
    document.getElementById("start").onclick = function() {
      if (start()) {
        document.getElementById("controls").style.display = "none";
      }
    };
  } else {
    audio = window.location.search.includes("audio");
    video = window.location.search.includes("video");
    data = window.location.search.includes("data");
  }
});

window.addEventListener("message", function(event) {
  console.log("message: %s", JSON.stringify(event.data));
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

function debug_sdp(sdp) {
  document.getElementById("out").appendChild(document.createTextNode(sdp));
}

pc.onicecandidate = function(event) {
  var c = JSON.stringify(event.candidate);
  console.log("onicecandidate: %s", c);
  if (event.candidate) {
    otherwin.postMessage({"type":"ice", "candidate": c}, "*");
  }
};

pc.onsignalingstatechange = function(event) {
  console.log("onsignalingstatechange: %s", pc.signalingState);
};

// onaddstream is deprecated in favor of ontrack, but addTrack
// is not implemented cross-browser or in adapter.js.
pc.addEventListener("addstream", function(streamevent) {
  console.log("onaddstream: " + streamevent);
  remotevideo.srcObject = streamevent.stream;
});

pc.ondatachannel = function(event) {
  console.log("ondatachannel: %s", event.channel.label);
  addDataChannelListeners(event.channel);
};

function addDataChannelListeners(channel) {
  channel.onmessage = function (event) {
    console.log("data: %s", event.message);
  };
  function channelStateChanged() {
    console.log("data channel is %s", channel.readyState);
  };
  channel.onopen = channelStateChanged;
  channel.onclose = channelStateChanged;
}

function chk(what) {
  return document.getElementById(what).checked;
}

function maybeGetMedia() {
  if (video || audio) {
    return navigator.mediaDevices.getUserMedia({video: video, audio: audio})
      .then(function (stream) {
        console.log("getUserMedia: " + stream);
        pc.addStream(stream);
        localvideo.srcObject = stream;
      });
  }
  return Promise.resolve();
}

function start() {
  video = chk("video");
  audio = chk("audio");
  data = chk("data");
  if (!(video || audio || data)) {
    return false;
  }
  console.log("start: video: %s, audio: %s, data: %s", video, audio, data);
  var what = [];
  if (video) {
    what.push("video");
  }
  if (audio) {
    what.push("audio");
  }
  if (data) {
    what.push("data");
  }
  var url = "webrtctest.html?" + what.join(',');
  otherwin = window.open(url, "webrtctest2", "resizable=yes,scrollbars=yes,toolbar=yes");
  otherwin.onload = function() {
    var p = maybeGetMedia();
    if (data) {
      p = p.then(function () {
        var channel = pc.createDataChannel('mychannel', null);
        addDataChannelListeners(channel);
      });
    }

    p.then(function () {
        return pc.createOffer();
    }).then(function(offer) {
        console.log("offer created");
        debug_sdp(offer.sdp);
        otherwin.postMessage({"type": "offer", "sdp": offer.sdp}, "*");
        pc.setLocalDescription(offer);
      }).catch(function (err) {
        console.error("error: %s", err.message);
      });
  };
  return true;
}

function setOffer(sdp) {
  console.log("setOffer");
  var offer = {type:"offer", sdp:sdp};
  var rtc_offer = new RTCSessionDescription(offer);
  pc.setRemoteDescription(rtc_offer)
    .then(function() {
      console.log("setRemoteDescription");
      return maybeGetMedia();
    })
    .then(function () {
      console.log("createAnswer");
      return pc.createAnswer();
    })
    .then(function(answer) {
      console.log("answer created");
      debug_sdp(answer.sdp);
      pc.setLocalDescription(answer);
      otherwin.postMessage({"type": "answer", "sdp": answer.sdp}, "*");
    }).catch(function (err) { console.error(err); });
};

function setAnswer(sdp) {
  console.log("setAnswer");
  var answer = {type:"answer", sdp:sdp};
  var rtc_answer = new RTCSessionDescription(answer);
  pc.setRemoteDescription(rtc_answer)
    .then(function() {
      console.log("setRemoteDescription");
    })
    .catch(function(e) {
      console.error('setRemoteDescription failed: %s', e);
    });
}

function setice(ice) {
  console.log("setice: %s", JSON.stringify(ice));
  pc.addIceCandidate(new RTCIceCandidate(ice));
}
