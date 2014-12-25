$(document).ready(function(){
	$("#createBox").hide();
	
	
	});
	function SelectRegister(){ // show register box
		$("#createBox").fadeIn("fast");

	}
	function SelectBack(){ // hide register box
		$("#createBox").fadeOut("fast");
	}
	function SelectConfirm(){ //
	}
        
        
function createAccount(){
    var username = $("#newUsername").val().trim();
    var password = $("#newPassword").val().trim();
    var fullname = $("#newFullName").val().trim();
    if (username !=="" && password !== "" && fullname !== ""){
         $.post("php/user/user.php",{username:username,password:password,fullname:fullname,action:'createuser'},function(result){
     if (result==="2"){
         ErrorAlert("The user has existed.");
     }else if(result === "1"){
         SuccessAlert("User has been created. You can login now.");
         SelectBack();
         $("#newUsername").val("");
         $("#newPassword").val("");
         $("#newFullName").val("");
     }
     else if (result === "0"){
          ErrorAlert("Database error.");
     }
    });
    }else{
   ErrorAlert('Your username/password/full name cannot be blank.');
    }
   
}
function ErrorAlert(text){
   new PNotify({
    title: 'Error',
    text: text,
    type: 'error'
});
}
function SuccessAlert(text){
    new PNotify({
    title: 'Success',
    text: text,
    type: 'success'
});
}

///return username,password or fullname length 
function returnUsernameLength(){
    var username = $("#newUsername").val();
    $("#usernameLength").html((25-username.length));
    }
function returnPasswordLength(){
    var password = $("#newPassword").val();
    $("#passwordLength").html((25-password.length));
    }
function returnFullNameLength(){
    var fullName = $("#newFullName").val();
    $("#fullNameLength").html((30-fullName.length));
}
function Login(){
    var username = $("#username").val().trim();
    var password = $("#password").val().trim();
      $.post("php/user/user.php",{username:username,password:password,action:'login'},function(result){
          
          if (result === "2"){
              alert("Wrong username/password.");
          }else if (result === "0"){
              alert("Database error.");
          }else{
             window.location.href= "html/Dashboard.htm";
          }
      });   
}
