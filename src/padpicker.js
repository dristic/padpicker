$(function(){
   var pad = padpicker.create('firepad', 'userlist');

   $(document).on("file-picked", function(e, fpfile){
	pad.setFile(fpfile);
   });
});

var padpicker = {};
padpicker.interval = 1000 * 5;
padpicker.create = function(id, userListId){
  var userId = Math.floor(Math.random() * 9999999999).toString();
   return new padpicker.PadPicker(id, userListId, userId);
};

padpicker.PadPicker = function(id, userListId, userId) {
  this.userId = userId;
   this.firebase = new Firebase("padpicker.firebaseIO.com");
   var fbid = window.location.hash.replace("#","");
   this.firebase = this.firebase.child(fbid);

   this.codeMirror = CodeMirror(document.getElementById(id), { lineWrapping: true });
   this.firepad = Firepad.fromCodeMirror(this.firebase, this.codeMirror,
          { richTextShortcuts: true, richTextToolbar: true, userId: this.userId });

   // Setup the user list with the given userId.
    this.firepadUserList = FirepadUserList.fromDiv(this.firebase.child('users'),
        document.getElementById(userListId), this.userId);

   this.firepad.on('ready', function(){
	//handle making sure we don't call set file until ready
   });
   this.listenForChange();
   var curr = this;
   this.firebase.child("file").on("value", function(snapshot){
	curr.file = snapshot.val();
   });
};

padpicker.PadPicker.prototype.setFile = function(fpfile) {
   this.firepad.setText("Loading "+fpfile.filename + "...");
   this.file = fpfile;
   this.firebase.child("file").set(this.file);
   var curr = this;
   filepicker.read(fpfile, {asText: true}, function(data){
       curr.last = data;
       curr.firepad.setText(data);
   });
};

padpicker.PadPicker.prototype.listenForChange = function(){
   var curr = this;
   this.timer = setInterval(function(){curr.check.apply(curr)}, padpicker.interval);
};

padpicker.PadPicker.prototype.check = function(){
   if (!this.file) { console.log("no file"); return; } 
   var curr = this.firepad.getText();
   //TODO - add check for reading from file, determining conflicts?
   if (this.last != curr) {
	if (this.last) { 
		filepicker.write(this.file, curr);
  	}
	this.last = curr;
   }
};
