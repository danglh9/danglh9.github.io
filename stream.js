var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 	
var btnGetMediaUser = document.querySelector('#btnGetMediaUser'); 	
var btnStream = document.querySelector('#btnStream'); 	

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var btnView = document.querySelector('#btnView'); 
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo');

var socket =  io.connect('https://vivulive.com:9092');

btnStream.disabled = true;
btnView.disabled = true;

socket.on('connect', function() {
	console.log("connection");
});

socket.on('app', function(data){
	var type = data.type;
	var data = data.data;
	console.log(data);
	switch(type){
		case 1:
		onLogin(data);
		
		break;
		case 3:
		onAnswer(data.sdpAnswer);
		break;
		case 4:
		onCandidate(data.candidate);
		break;
		
	}
	
})

function onLogin(data){
	if(data.success){
		console.log("Đăng nhập thành công!");
		//alert("Đăng nhập thành công!");
		var configuration = { 
			"iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
		}; 
		myConnection = new webkitRTCPeerConnection(configuration); 
		console.log("RTCPeerConnection object was created"); 
		console.log(myConnection); 
		
		
		myConnection.onicecandidate = function (event) { 
			
			if (event.candidate) { 
				var data1 = {name: fromName, candidate: event.candidate }
				var jsonObject = {type:4, data: data1};
				send(jsonObject);
				console.log(event.candidate); 
			}
		}	
		btnStream.disabled = false;
		btnView.disabled = false;
		loginBtn.disabled = true;
	}
	else{
		alert("Đăng nhập thất bại!");
		console.log("Đăng nhập thất bại!");
	}
}

function onAnswer(answer) { 
	myConnection.setRemoteDescription(new RTCSessionDescription(answer)); 
} 

//when we got ice candidate from another user 
function onCandidate(candidate) { 
	var candidate = new RTCIceCandidate(candidate);
	console.log('---candidate receive start----');
	console.log(candidate);
	console.log('---candidate receive end----');
	myConnection.addIceCandidate(candidate); 
}	

//when a user clicks the login button 
loginBtn.addEventListener("click", function(event){ 
	//console.log("loginBtn");
	fromName = loginInput.value; 
	if(fromName.length > 0){ 
		var data1 = {name:fromName};
		var jsonObject = {type: 1, data: data1};
		console.log(jsonObject);
		send( jsonObject);
	} 
	
});

btnView.addEventListener("click", function(event){
	toName = otherUsernameInput.value;
	if(toName.length >0){
		
		myConnection.onaddstream = function (e) { 
			remoteVideo.src = window.URL.createObjectURL(e.stream); 
			console.log("onaddstream"+ e.stream);
		};
		
		var offerOption = {
			offerToReceiveAudio: 1,
		offerToReceiveVideo: 1};
		//make an offer 
		myConnection.createOffer(function (offer) { 
			console.log(offer); 
			var data1 = {name: toName ,sdpOffer : offer}
			var jsonObject = {type: 3, data: data1};
			send(jsonObject);			
			myConnection.setLocalDescription(offer); 
			}, function (error) { 
			alert("An error has occurred."); 
		},offerOption ); 
	}
});

btnStream.addEventListener("click", function(){
	console.log("Click btnStream");
	
	navigator.getUserMedia({ video: true, audio: true }, function (stream) { 
		myConnection.addStream(stream); 
		//inserting our stream to the video tag     
		localVideo.src = window.URL.createObjectURL(stream);
		myConnection.onaddstream = function (e) { 
			remoteVideo.src = window.URL.createObjectURL(e.stream); 
		};
		
		//make an offer 
		myConnection.createOffer(function (offer) { 
			console.log(offer); 
			var data1 = { sdpOffer : offer}
			var jsonObject = {type: 2, data: data1};
			send(jsonObject);			
			myConnection.setLocalDescription(offer); 
			}, function (error) { 
			alert("An error has occurred."); 
		}); 
		btnStream.disabled = true;
		
	}, function (err) {}); 
	
	
	
}
);

btnGetMediaUser.addEventListener("click", function(){
	//enabling video and audio channels 
	navigator.getUserMedia({ video: true, audio: true }, function (stream) { 
		var video = document.querySelector('video'); 
		
		//inserting our stream to the video tag     
		video.src = window.URL.createObjectURL(stream); 
	}, function (err) {}); 
});

function send(object){
	socket.emit("app", object);
	//console.log("send: " + type + " : " + object.data);
};	

