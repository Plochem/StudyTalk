$(document).ready(function() {
	$("#submitmsg").click(function(){ // click send button
		sendMessage();
	});

	$(document).on('keyup keypress', 'form input', function(e) { 
  		if(e.which === 13) {// when press enter key
    		e.preventDefault(); // prevents submitting
    		sendMessage();
    		return false;
  		}		
	});

	function sendMessage(){
		let date = new Date();
		let hours = date.getHours(); 
		let min = date.getMinutes();
		let username;
		if($("#usermsg").val() !== ""){
			if($("#namemsg").val() !== ""){
				username = $("#namemsg").val();
			} else {
				return;
			}
				let msg = $("#usermsg").val();

				$("#chatbox").append("<p><b>(" + hours + ":" + min + ")</b> " + username + ": " + msg + "</p>");	// client side msg display
				$("#usermsg").val("");
				$("#chatbox").scrollTop($("#chatbox")[0].scrollHeight); //auto scroll
				
		} 
	}

}); 
//http://www.oracle.com/webfolder/technetwork/tutorials/obe/cloud/apaas/node-webSocket/nodecloud-websocket.html

      // var user;
      // var socket;
      // function connectToChat() { //when join
      //   socket = new WebSocket(url);
      //   user = document.getElementById("name").value;
      //   socket.onmessage = function (msg) {
      //     var chatBox = document.getElementById("chatBox");
      //     var message = JSON.parse(msg.data);
      //     chatBox.innerHTML = "<b>" + message.user + "</b>:" + message.text + "<br>" + chatBox.innerHTML;
      //   };
      //   socket.onopen = function () {
      //     var message = {};
      //     message.user = user;
      //     message.text = "<b>Joined the chat</b>";
      //     socket.send(JSON.stringify(message));
      //   };
      //   document.getElementById("chat").setAttribute("style", "");
      //   document.getElementById("welcome").setAttribute("style", "display:none");
      // }

      // function sendMessage() {
      //   var message = {};
      //   message.user = user;
      //   message.text = document.getElementById("message").value;
      //   socket.send(JSON.stringify(message));
      //   document.getElementById("message").value = "";
      // }