$(function(){
   //Checking hash to see if we need to show welcome
   var hash = getHash();
   if (!hash) {
       $(document).trigger("show-welcome");
       hash = createGuid();
       window.location.hash = hash;
   }
   var pad = padpicker.create({
	editor_id: 'firepad',
	userlist_id: 'userlist',
	firebase_id: hash
	});

   $(document).on("file-picked", function(e, fpfile){
	pad.setFile(fpfile);
   });

   var last = hash;
   $(window).on("hashchange", function(){
        hash = getHash();
	if (!hash) {
            window.location.hash = last; 
	} else if (hash != last) { 
	    pad.reload(hash);
        }
	last = hash;
   });
});

var getHash = function() {
   var hash = window.location.hash
   return hash ? hash.replace("#", "") : "";
};

var createGuid = function(){ 
   return 'xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random()*36|0, v = c == 'x' ? r : (r&0x3|0x8);
        return v.toString(36);
   });
};

var padpicker = {};
padpicker.interval = 1000 * 5;
padpicker.create = function(options) {
   options.userId = Math.floor(Math.random() * 9999999999).toString();
   return new padpicker.PadPicker(options);
};

padpicker.PadPicker = function(options) {
   if (!options || !options.editor_id || !options.firebase_id) {
        debugger;
   }
   this.firebase = new Firebase("padpicker.firebaseIO.com").child(options.firebase_id);
   this.userId = options.userId;

   this.codeMirror = CodeMirror(document.getElementById(options.editor_id), { lineWrapping: true });
   this.firepad = Firepad.fromCodeMirror(this.firebase, this.codeMirror,
          { richTextShortcuts: true, richTextToolbar: true, userId: this.userId });

   // Setup the user list with the given userId.
    this.firepadUserList = FirepadUserList.fromDiv(this.firebase.child('users'),
        document.getElementById(options.userlist_id), this.userId);

   this.firepad.on('ready', function(){
	//handle making sure we don't call set file until ready
   });
   this.listenForChange();
   var curr = this;
   this.firebase.child("file").on("value", function(snapshot){
	curr.file = snapshot.val();
   });
};

padpicker.PadPicker.prototype.reload = function(firebase_id) {
   this.firepad.dispose();

   this.codeMirror.setValue("");
   this.firebase = new Firebase("padpicker.firebaseIO.com").child(firebase_id);
   this.firepad = Firepad.fromCodeMirror(this.firebase, this.codeMirror,
          { richTextShortcuts: true, richTextToolbar: true });
   
   var curr = this;
   var last = "";
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
