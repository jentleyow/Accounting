$(document).ready(function(){
   $("#blackscreen").hide();
   $("#newSetPanel").hide();
   
   returnAllSet();
    $('#notEmptyForm').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        fields: {
            fullName: {
                validators: {
                    notEmpty: {
                        message: 'The set name cannot be blank.'
                    }
                }
            }
        }
    });
});
 function returnSetLength(){
    var set = $("#newSet").val();
    $("#setLength").html((25-set.length));
    }
    
function showCreateSet(){
    $("#blackscreen").fadeIn();
    $("#newSetPanel").fadeIn();
    $("#newSet").focus();
}
function hideBlackScreen(){
    $("#blackscreen").fadeOut();
     $("#newSetPanel").fadeOut();   
}
function logOff(){
window.location.href= "../php/user/logoff.php";
}
function createSet(){
    var set = $("#newSet").val().trim();
    if (set === ""){
        alert("Name of set cannot be blank.");
    }else{
         $.post("../php/set/set.php",{setname:set,action:'createSet'},function(result){
if (result === "1"){
    alert("A new set is created.");
    $("#newSet").val("");
    hideBlackScreen();
    returnAllSet();
}else{
    alert("Database Error.");
}
         });
    }
}

function returnAllSet(){
    $.post("../php/set/set.php",{action:'getAllSet'},function(result){
        $("#tblSet").html(result);
    });
}

function setclick(value){
    $.post("../php/set/set.php",{id:value,action:'openSet'},function(result){
        window.location.href= "MySet.htm";
    });
    
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

