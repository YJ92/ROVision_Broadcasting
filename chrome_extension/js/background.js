// winodw on load
chrome.contextMenus.create({
  "title" : "Broadcast this video",
  "onclick" : clickHandler,
  "id" : "screen_capturing"
});


window.onload = function(){
  localStorage["capturing_my_tab"] = "off";
}

// WebRTC
var socket = socket = io.connect("https://rovision.openlabs.kr:443");
var send_data = null;
var myVideoStream = null;

var peerConn_local = null;
var remote_id = null;
var pc_config = {
  'iceServers': [{
    'url' : 'stun:stun.l.google.com:19302'
  },{
    'url' : 'turn:ROVision_Broadcasting@52.69.163.163',
    'credential' : '1q3w2e4'
  }]  
};

var local_id = null;
var busy_state = false;
var accept_id = null;

var media_constraint = null;

var LocalPeer_list = [];

// On click
function clickHandler(){
  var currentMode = localStorage["capturing_my_tab"];

  // toggle the button
  var newMode = currentMode === "on" ? "off" : "on";

  // start capture
  if (newMode === "on"){
  // Alert server to make room
    local_id = Date.now()+"-"+Math.round(Math.random()*10000); // Random unique id
    socket.emit("makeRoom",local_id);

    // Get screen capture stream
    chrome.tabs.query({active:true,lastFocusedWindow:true},function(tabs){

      var MediaStreamConstraint = {
                  audio: false,
                  video: true,
                  videoConstraints: {
                      mandatory: {
                          //chromeMediaSource: 'tab',
                          //maxWidth: screen.width > 160 ? screen.width : 160,
                          //maxHeight: screen.height > 90 ? screen.height : 90,
                          minAspectRatio: 1.77,
                          //googLeakyBucket: true,
                          //googTemporalLayeredScreencast: true
                      }
                  }
              };

      chrome.tabCapture.capture(MediaStreamConstraint,function(stream){
        myVideoStream = stream;

        stream.onended = function(){
          disconnect();
          local_id = null;
        }
      });
    });    
  // stop capture
  }else if(newMode === "off"){
    myVideoStream.stop();
  }

  // Change state

  localStorage["capturing_my_tab"] = newMode;
  var title = newMode === "on" ? "Stop broadcasting" : "Broadcast this video";
  chrome.contextMenus.update("screen_capturing",{
    "title" : title,
    "onclick" : clickHandler
  });
	
};


// Socket zone ==========================================================================//

       socket.on('Message',function(data){           
         if(data.type == "start"){
           peerConn_local = new RTCPeerConnection(pc_config);
           remote_id = data.remote_id;
           LocalPeer_list.push({peerConn_local : peerConn_local, remote_id : remote_id});
           var remote_id_list = [];
             for(var i=0;i<LocalPeer_list.length;i++)
               remote_id_list.push(LocalPeer_list[i].remote_id);
             var Send_data = {
               type : 'update_user',
               local_id : local_id,
               remote_id_list : remote_id_list
             }
             socket.emit('Message',Send_data);
           peerConn_local.onicecandidate = function(event){
           if(event.candidate){
             console.log('Send ICE candidate to Remote peer');
             var Send_data = {
               type : "local_sending_candidate",
               remote_id : remote_id,
               local_id : local_id,
               sdpMLineIndex: event.candidate.sdpMLineIndex,
               sdpMid : event.candidate.sdpMid,
               candidate : event.candidate.candidate
             };
             socket.emit('Message',Send_data);
         }
       }
           peerConn_local.addStream(myVideoStream);
           console.log("Add localStream to localPeerConnection");
           peerConn_local.createOffer(setLocalAndSendMessage);
         }else if(data.type == "answer"){
           var sessionDescription = new RTCSessionDescription({sdp : data.sdp, type : data.type});
           peerConn_local.setRemoteDescription(sessionDescription);
         }else if(data.type == "remote_sending_candidate"){
           var candidate = new RTCIceCandidate({sdpMLineIndex: data.sdpMLineIndex, sdpMid: data.sdpMid, candidate: data.candidate});
           peerConn_local.addIceCandidate(candidate,sucessConnection, failConnection);
         }else if(data.type == "are-you-busy"){
           if(busy_state == false){
             busy_state = true;
             data.type = "accept_connect";
             socket.emit('Message',data);
           }
         }else if(data == "stop" && LocalPeer_list.length != 0){
             for(var i=0;i<LocalPeer_list.length;i++)
               LocalPeer_list[i].peerConn_local.close();
             LocalPeer_list = [];
             busy_state = false;
         }else if(data.type == "disconnect"){
           var delete_id_num = FindDeletingId(data.remote_id);
           if(delete_id_num != null){
             LocalPeer_list[delete_id_num].peerConn_local.close();
             LocalPeer_list.splice(delete_id_num,1);
             var remote_id_list = [];
             for(var i=0;i<LocalPeer_list.length;i++)
               remote_id_list.push(LocalPeer_list[i].remote_id);
             var Send_data = {
               type : 'update_user',
               local_id : local_id,
               remote_id_list : remote_id_list
             }
             socket.emit('Message',Send_data);
           }
         }
      });

// Function zone ==================================================================//

       function FindDeletingId(id){
         if(LocalPeer_list.length != 0){
           for(var i=0;i<LocalPeer_list.length;i++)
             if(LocalPeer_list[i].remote_id == id)
               return i;
         }
         return null;
       }

       function sucessConnection(){
         console.log('Sucess!');
         busy_state = false;
       }

       function failConnection(err){
         console.log('Fail!');
       }

       function setLocalAndSendMessage(sessionDescription){
     console.log("Offer from localPeer");
     peerConn_local.setLocalDescription(sessionDescription);
     var Send_data = {
       type : sessionDescription.type,
       sdp : sessionDescription.sdp,
       remote_id : remote_id,
       local_id : local_id
     }
     socket.emit('Message',Send_data);
   };

   function disconnect(){
    socket.emit('dis_connect',local_id);
   }
