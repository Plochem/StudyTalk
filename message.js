var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http); // the server
var messages =[]; // message history
var nicknames = new Map(); //maps client ID to nickname
var donators = new Map(); // maps client ID to # of clicks
var currentIDS = []; //current IDS
var currentUsers = []; // current nickanmes in use
var numOfClients = 0;
let newUser = ""; // nickname of most recently connected client
app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html'); //display html of nickname page
});
app.get('/chat',function(req,res){
  res.sendFile(__dirname + '/chat.html'); //display html of chat room
});
http.listen(8080, function(){
  console.log("############## CHAT LOG ##############");
});
console.log("Running at Port 8080");

io.sockets.on('connection', function(socket){ // when client connects
 	let clientID = "";

 	socket.on('nickname', function(nickname){ //when server receives the nickname
    	newUser = escapeHTML(nickname);
   	});

   	if(newUser == ""){ // default is "". basically checks if user is trying to access the chatroom without having a nickname
    	clientID = socket.id; // tells me which client to emit the redirect to
    	setTimeout(redirect,200); // browser only redirects to nickname apge after some time
 	} else {
  		clientID = socket.id;
  		if(currentUsers.indexOf(newUser) > -1){ //nickname is already used
   			setTimeout(redirect,200); //todo: add error message
  		} else {
   			numOfClients++;
   			nicknames.set(clientID, newUser); //maps clientid to username. removes html stuff from username
   			donators.set(clientID, 0); // maps clientid to num of clicks
   			setTimeout(FetchData,200);
  		}
 	}

 	function escapeHTML(text){ // escapes html
  		return text
   		.replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
 	}

 	function redirect(){ //redirects user
  		var destination = '/';
  		io.to(clientID).emit('redirect', destination); //redirects to login area (the user tries to access chatroom w/o nickname or refreshes in chatroom)
  		clientID = ""; // resets id
 	}

   	function FetchData(){
    	let date = new Date();
  		let hours = date.getHours();
  		let min = date.getMinutes();
  		io.to(clientID).emit('topright', "Welcome, " + newUser + "! <a href='/'> Leave the chat</a>"); // emits the welcome message for new user (topright)
  		currentUsers.push(newUser); // adds to current user list
  		io.emit('clearlist', ""); // clears the list to prevent double listing
  		for(i = 0; i < currentUsers.length; i++){
   			io.emit('onlineuser', currentUsers[i]); // emits the whole array of current users to the client
  		}
    	io.emit('clientDisplay', "There are currently " + numOfClients + " users  connected!"); // update client count
  		for(i = 0; i < messages.length; i++){ // server sends previous messages to newly connected clients.
    		io.to(clientID).emit('chat', messages[i]);
    	}
    	updateLB(); //shows click leaderboard to include newly connected clients
    	if(newUser !== ""){ // prevents announcing the connection when user joins w/o nickname
     		let welcomemsg = "<hr><p><b>(" + hours + ":" + min + ")<i> " + newUser + " has connected to the chat!</i></b></p><hr>";
     		io.emit('chat', welcomemsg); // announce new user has joined
     		messages.push(welcomemsg); // puts it in history
     		console.log("(" + hours + ":" + min + ") " + newUser + " has connected to the chat!"); // logs that ^
    	}
    	newUser = ""; // reset to default. to check if next person tries to refresh or access chatroom w/o nickname
   	}

   	socket.on('disconnect', function(){ // when disconnect
 		let date = new Date();
 		let hours = date.getHours();
 		let min = date.getMinutes();
 		if(clientID != ""){ // prevents sending the disconnect message when user tries to join chatroom w/o nickname or refreshes
  			let leavemsg = "<hr><p><b>(" + hours + ":" + min + ") <i>"+ nicknames.get(clientID) +" has disconnected from the chat!</i></b></p><hr>";

  			io.emit('chat', leavemsg); // show diconnect message in chatbox
  			messages.push(leavemsg); // puts it in history
  			console.log("(" + hours + ":" + min + ") "+ nicknames.get(clientID) +" has disconnected from the chat!");
  			let idx = currentUsers.indexOf(nicknames.get(clientID)); //finds where the nickname is in the user list
  			currentUsers.splice(idx, 1); // removes the nickname from user list
  			//updates current user list
  			io.emit('clearlist', ""); // clears the list to prevent double listing
  			for(i = 0; i < currentUsers.length; i++){
   				io.emit('onlineuser', currentUsers[i]); // emits the whole array to the client
  			}
  			nicknames.delete(clientID); // deletes clientID and nickname from map when disconnect
  			donators.delete(clientID); // deletes clientID and num of Clicks from map when disconnect
  			numOfClients--;
  			io.emit('clientDisplay', "There are currently " + numOfClients + " users connected!"); //sends the updated client count to all clients
  			updateLB(); // update click leaderboard for everyone
 		}
   	});

   	socket.on('chat', function(msg, color){ // when server receives a message
    	let date = new Date();
  		let hours = date.getHours();
  		let min = date.getMinutes();
     	if(msg === "/clear"){
      		let clearmessage = "<hr><p><b>(" + hours + ":" + min + ")<i> The chat has been cleared by " + nicknames.get(clientID) + "!</i></b></p><hr>";
     		console.log("(" + hours + ":" + min + ") The chat has been cleared by " + nicknames.get(clientID));
      		messages = []; // clear the array so new clients cant see msg history
      		io.emit('chat', msg); // server sends /clear to all clients
      		io.emit('chat', clearmessage); //sends the message that chat has been cleared to all clients
      		return;
     	}
     	msg = escapeHTML(msg); // escapes html
   		msg = msg.replace(msg, "<span class=" + color + ">" + msg + "</span>"); // change color of message
     	msg = "<p>(" + hours + ":" + min + ") " + "<b>" + nicknames.get(clientID) + "</b>" + ": " + msg + "</p>"; //building the message to include time
     	console.log(msg.replace(/<[^>]*>/g, '')); // logs messages without displaying html tags
     	io.emit('chat', msg); // server sends message to all clients
      	messages.push(msg); // adds message to history
   	});
   	// vvvvv donate button server handling vvvvv \\
   	socket.on('donateHandler', function(num){
   		donators.set(clientID, donators.get(clientID) + 1); //update click count for the clicker
   		updateLB();
   	});

   	function updateLB(){
   		currentIDS = Object.keys(io.sockets.sockets); // get all currently connected client IDs
   		io.emit('clearDonate', "");
   		for(i= 0; i < currentIDS.length; i++){
   			io.emit('donateHandler', "<p>" + nicknames.get(currentIDS[i]) + " — " + donators.get(currentIDS[i]) + "</p>");  // sends the nickname and num of clicks  			
   		}
   	}
});