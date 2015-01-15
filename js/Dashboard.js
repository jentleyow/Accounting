var setShare = "-1";//to store id only for share set.
$(document).ready(function () {
    $("#blackscreen").hide();
    $("#newSetPanel").hide();
    $("#shareSetPanel").hide();
    $("#accountPanel").hide();
    //$("#loadExcelPanel").hide();
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
function returnSetLength() {
    var set = $("#newSet").val();
    $("#setLength").html((25 - set.length));
}

function showCreateSet() {
    $("#blackscreen").fadeIn();
    $("#newSetPanel").fadeIn();
    $("#newSet").focus();
}
function hideBlackScreen() {
    $("#blackscreen").fadeOut();
    $("#newSetPanel").fadeOut();
    $("#shareSetPanel").fadeOut();
    $("#accountPanel").fadeOut();
    $("#loadExcelPanel").fadeOut();
}
function logOff() {
    window.location.href = "../php/user/logoff.php";
}
function createSet() {
    var set = $("#newSet").val().trim();
    if (set === "") {
        ErrorAlert("Name of set cannot be blank.");
    } else {
        $.post("../php/set/set.php", {setname: set, action: 'createSet'}, function (result) {
            if (result === "1") {
                SuccessAlert("A new set is created.");
                $("#newSet").val("");
                hideBlackScreen();
                returnAllSet();
            } else {
                alert(result);
                ErrorAlert("Database Error.");
            }
        });
    }
}

function returnAllSet() {
    $.post("../php/set/set.php", {action: 'getAllSet'}, function (result) {
        if (result === "0") {
            ErrorAlert("Database Error");
        } else {
            var obj = $.parseJSON(result);
            var html = '<thead><tr><th width="6%">No</th><th>Set Name</th><th width="15%">Last Modified</th><th colspan="3" width="30%">Actions</th></tr></thead>';
            var i = 0, len = obj.length;
            for (i; i < len; i++) {
                html += '<tr><td>' + (i + 1) + '</td><td><input id="s' + i + '" onblur="setBlur(this.id,' + obj[i].setid + ')" class="setName" type="text" value="' + obj[i].name + '" maxlength="25"/></td><td>' + obj[i].date + '</td><td><button type="button" class="btn btn-primary bluebtn" onclick="setclick(' + obj[i].setid + ')">Modify</button></td><td><button type="button" class="btn btn-success" onclick="showShareSet(' + obj[i].setid + ')">Share/unshare</button></td><td><button type="button" class="btn btn-danger" onclick="removeSet(' + obj[i].setid + ')">Delete</button></td></tr>';
            }
            $("#tblSet").html(html);
            SuccessAlert("Sets loaded.");
        }

    });
}

function setclick(value) {
    $.post("../php/set/set.php", {id: value, action: 'openSet'}, function (result) {
        if (result === "0") {
            ErrorResult("Error.");
        } else {
            window.location.href = "MySet.htm";
        }
    });

}
function removeSet(value) {
    (new PNotify({
        title: 'Delete set',
        text: 'Are you sure you want to remove set?',
        icon: 'glyphicon glyphicon-question-sign',
        hide: false,
        confirm: {
            confirm: true
        },
        buttons: {
            closer: false,
            sticker: false
        },
        history: {
            history: false
        }
    })).get().on('pnotify.confirm', function () {
         $.post("../php/set/set.php", {id: value, action: 'removeSet'}, function (result) {
             if (result === "0") {
            ErrorResult("Error.");
        } else {
            returnAllSet();
        }
    });
    }).on('pnotify.cancel', function () {
       
    });
}
function ErrorAlert(text) {
    new PNotify({
        title: 'Error',
        text: text,
        type: 'error',
        delay: 750
    });
}
function SuccessAlert(text) {
    new PNotify({
        title: 'Success',
        text: text,
        type: 'success',
        delay: 750
    });
}
function setBlur(id, setid) {
    var setName = $("#" + id).val();
    $.post("../php/set/set.php", {id: setid, setName: setName, action: 'updateSetName'}, function (result) {
        if (result === "0") {
            ErrorAlert("Fail to update set name.");
        } else {
            SuccessAlert("Set name updated.");
        }
    });
}
function showShareSet(id) {
    setShare = id;
    $("#blackscreen").fadeIn();
    $("#shareSetPanel").fadeIn();
    $("#txtShareSet").focus();
}
function shareSet(type) {
    if (setShare !== "-1") {
        var username = $("#txtShareSet").val();
        if (username === "") {
            ErrorAlert("Username cannot be blank.");
        } else {
            $.post("../php/set/set.php", {id: setShare, username: username, action: 'shareSet', type: type}, function (result) {
                switch (result) {
                    case "0":
                        ErrorAlert("Database problem.");
                        break;
                    case "2":
                        ErrorAlert("You entered invalid username.");
                        break;
                    case "3":
                        ErrorAlert("Set has been shared already.");
                        break;
                    case "4":
                        ErrorAlert("Unable to unshare as you did not share this set.");
                        break;
                    case "1":
                        SuccessAlert("You have now shared the set with " + username);
                        hideBlackScreen();
                        break;
                    case "5":
                        SuccessAlert("You have now unshared the set with " + username);
                        hideBlackScreen();
                        break;
                    default:
                        alert(result);
                        //no action
                }
            });
        }
    }
}
function showManageAccount(){
    $("#blackscreen").fadeIn();
    $("#accountPanel").fadeIn();
     $.post("../php/user/user.php", {action: 'getAccount'}, function (result) {
         if (result ==="0"){
             ErrorAlert("Unable to get account information.");
         }else{
             var obj = $.parseJSON(result);
             $("#lblUsername").html(obj[0]["username"]);
             $("#lblFullname").html(obj[0]["fullname"]);
         }
     });
}
function saveAccount(){
    var password = $("#txtPassword").val().trim();
    if (password ===""){
         ErrorAlert("Password cannot be blank");
    }else{
         $.post("../php/user/user.php", {action: 'saveAccount', password:password}, function (result) {
             if (result==="0"){
                 ErrorAlert("Unable to save account information.");
             }else{
                 SuccessAlert("Account information has been updated.");
             }
         });
    }
}

function showLoadExcelFile(){
    $("#blackscreen").fadeIn();
    $("#loadExcelPanel").fadeIn();
}