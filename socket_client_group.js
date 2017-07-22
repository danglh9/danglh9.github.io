var loginInput = document.querySelector('#loginInput'); 
var loginBtn = document.querySelector('#loginBtn'); 	
var btnGetMediaUser = document.querySelector('#btnGetMediaUser'); 	

var otherUsernameInput = document.querySelector('#otherUsernameInput'); 
var connectToOtherUsernameBtn = document.querySelector('#connectToOtherUsernameBtn'); 
var localVideo = document.querySelector('#localVideo'); 
var remoteVideo = document.querySelector('#remoteVideo');

var socket =  io.connect('http://localhost:9092');

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
		case 2:
		onOffer(data.offer, data.name);
		break;
		case 3:
		onAnswer(data.sdpAnswer);
		break;
		case 4:
		onCandidate(data.candidate);
		break;
		case 5:
		onHasCall(data.name);
		break;
	}
	
})

function onLogin(data){
	if(data.success){
		//alert("Đăng nhập thành công!");
		//creating our RTCPeerConnection object 
		
		var configuration = { 
			"iceServers": [{ "url": "stun:stun.1.google.com:19302" }] 
		}; 
		myConnection = new webkitRTCPeerConnection(configuration); 
		console.log("RTCPeerConnection object was created"); 
		console.log(myConnection); 
		
		
		navigator.getUserMedia({ video: true, audio: true }, function (stream) { 
			myConnection.addStream(stream); 
			//inserting our stream to the video tag     
			localVideo.src = window.URL.createObjectURL(stream);
			myConnection.onaddstream = function (e) { 
				remoteVideo.src = window.URL.createObjectURL(e.stream); 
			};
			
		}, function (err) {}); 
		
		//setup ice handling
		//when the browser finds an ice candidate we send it to another peer 
		myConnection.onicecandidate = function (event) { 
			
			if (event.candidate) { 
				var data1 = {name: fromName, candidate: event.candidate }
				var jsonObject = {type:4, data: data1};
				send(jsonObject);
				console.log(event.candidate); 
			}
		}			 			
	}
	else{
		alert("Đăng nhập thất bại!");
	}
}

//when somebody wants to call us 
function onHasCall(name) { 
	//make an offer 
	myConnection.createOffer(function (offer) { 
		console.log(offer); 
		var data1 = {name: name , typeUser: "callee", sdpOffer : offer}
		var jsonObject = {type: 5, data: data1};
		send(jsonObject);			
		myConnection.setLocalDescription(offer); 
		}, function (error) { 
		alert("An error has occurred."); 
	}); 
}


//when somebody wants to call us 
function onOffer(offer, name) { 
	connectedUser = name; 
	myConnection.setRemoteDescription(new RTCSessionDescription(offer)); 
	myConnection.createAnswer(function (answer) { 
		myConnection.setLocalDescription(answer); 
		var data1 = {answer: answer};
		var jsonObject = {type:3, data: data1};
		send(jsonObject);
		}, function (error) { 
		alert("oops...error"); 
	}); 
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

joinRoom.addEventListener("click", function(event){
	toName = otherUsernameInput.value;
	if(toName.length >0){
		console.log("connect click to "+ toName);
		//var data1 = {name:name2};
		//var jsonObject = {type: 10, data: data1};
		//send(jsonObject);
		
		//make an offer 
		myConnection.createOffer(function (offer) { 
			console.log(offer); 
			var data1 = {name: toName , typeUser: "caller", sdpOffer : offer}
			var jsonObject = {type: 2, data: data1};
			send(jsonObject);			
			myConnection.setLocalDescription(offer); 
			}, function (error) { 
			alert("An error has occurred."); 
		}); 
	}
});

btnGetMediaUser.addEventListener("click", function(){
	//enabling video and audio channels 
	var video = document.createElement('video');
	
	var div_video = document.getElementById("div_video");
	div_video.appendChild(video);
	navigator.getUserMedia({ video: true, audio: true }, function (stream) { 
		video.src = window.URL.createObjectURL(stream); 
		video.autoPlay = true;
		//var video1 = document.getElementById('localVideo');
		//video1.src = window.URL.createObjectURL(stream); 
		//inserting our stream to the video tag     
	}, function (err) {}); 
});

function send(object){
	socket.emit("app", object);
	//console.log("send: " + type + " : " + object.data);
};	

