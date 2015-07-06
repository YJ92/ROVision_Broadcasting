
var imageData = "";

var startimage = document.getElementById('startimage');
var endimage = document.getElementById('endimage');

var sendChannel, receiveChannel;

var startButton = document.getElementById("startButton");
var sendButton = document.getElementById("sendButton");

startButton.disabled = false;
sendButton.disabled = true;

startButton.onclick = createConnection;
sendButton.onclick = sendData;

function trace(text) {
  console.log((performance.now() / 1000).toFixed(3) + ": " + text);
}

function createConnection() {
  var servers = null;
  window.localPeerConnection = new webkitRTCPeerConnection(servers,
    {optional: []});
  trace('Created local peer connection object localPeerConnection');

  try {
    sendChannel = localPeerConnection.createDataChannel("sendDataChannel",
      {reliable: true});
    trace('Created send data channel');
  } catch (e) {
    trace('createDataChannel() failed with exception: ' + e.message);
  }
  localPeerConnection.onicecandidate = gotLocalCandidate;
  sendChannel.onopen = handleSendChannelStateChange;
  sendChannel.onclose = handleSendChannelStateChange;
  window.remotePeerConnection = new webkitRTCPeerConnection(servers,
    {optional: []});
  trace('Created remote peer connection object remotePeerConnection');

  remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
  remotePeerConnection.ondatachannel = gotReceiveChannel;

  localPeerConnection.createOffer(gotLocalDescription, null);
  startButton.disabled = true;
}

function sendData() {
  trace("Sending data");
  sendButton.disabled = true;
  var canvas = document.createElement('canvas');
  canvas.width = startimage.width;
  canvas.height = startimage.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(startimage, 0, 0, startimage.width, startimage.height);

  var delay = 10;
  var charSlice = 10000;
  var terminator = "\n";
  var data = canvas.toDataURL("image/jpeg");
  var dataSent = 0;
  var intervalID = 0;

  intervalID = setInterval(function(){
    var slideEndIndex = dataSent + charSlice;
    if (slideEndIndex > data.length) {
      slideEndIndex = data.length;
    }
    sendChannel.send(data.slice(dataSent, slideEndIndex));
    dataSent = slideEndIndex;
    if (dataSent + 1 >= data.length) {
      trace("All data chunks sent.");
      sendChannel.send("\n");
      clearInterval(intervalID);
    }
  }, delay);
}

function closeDataChannels() {
  trace('Closing data channels');
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  localPeerConnection.close();
  remotePeerConnection.close();
  localPeerConnection = null;
  remotePeerConnection = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
}

function gotLocalDescription(desc) {
  localPeerConnection.setLocalDescription(desc);
  trace('Offer from localPeerConnection \n' + desc.sdp);
  remotePeerConnection.setRemoteDescription(desc);
  remotePeerConnection.createAnswer(gotRemoteDescription, null);
}

function gotRemoteDescription(desc) {
  remotePeerConnection.setLocalDescription(desc);
  trace('Answer from remotePeerConnection \n' + desc.sdp);
  localPeerConnection.setRemoteDescription(desc);
}

function gotLocalCandidate(event) {
  trace('local ice callback');
  if (event.candidate) {
    remotePeerConnection.addIceCandidate(event.candidate);
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

function gotRemoteIceCandidate(event) {
  trace('remote ice callback');
  if (event.candidate) {
    localPeerConnection.addIceCandidate(event.candidate);
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function gotReceiveChannel(event) {
  trace('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = handleMessage;
  receiveChannel.onopen = handleReceiveChannelStateChange;
  receiveChannel.onclose = handleReceiveChannelStateChange;
}

function handleMessage(event) {
  if (event.data == "\n") {
    endimage.src = imageData;
    trace("Received all data. Setting image.");
  } else {
    imageData += event.data;
    //trace("Data chunk received");
  }
}

function handleSendChannelStateChange() {
  var readyState = sendChannel.readyState;
  trace('Send channel state is: ' + readyState);
  if (readyState == "open") {
    sendButton.disabled = false;
  } else {
    sendButton.disabled = true;
  }
}

function handleReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
  trace('Receive channel state is: ' + readyState);
}