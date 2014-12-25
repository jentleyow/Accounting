var header = '<thead><tr><th width="3%">No.</th><th width="10%">Date</th><th width="15%">Ref No.</th><th width="15%">Invoice No.</th><th width="20%">Particulars</th><th>Ledger</th><th width="8%" >Debit ($)</th><th width="8%" >Credit ($)</th><th colspan="2">Actions</th></tr></thead>';
var entireledges = [];
$(document).ready(function () {
    $("#blackscreen").hide();
    $("#companyPanel").hide();
    $("#modifyAccountPanel").hide();
    $('#rInvoiceDate').datetimepicker({
        pickTime: false,
        useStrict: true,
        useCurrent: false
    });
    $("#menu-toggle").click(function (e) {
        e.preventDefault();
        $("#wrapper").toggleClass("active");
    });
    Loader();

    $(window).on('hashchange', function () {
        HandleHash();
    });
});
function back() {
    window.history.go(-1);
}
function hideBlackScreen() {
    $("#blackscreen").fadeOut();
    $("#companyPanel").fadeOut();
}
function logOff() {
    window.location.href = "Dashboard.htm";
}
function ErrorAlert(text) {
    new PNotify({
        title: 'Error',
        text: text,
        type: 'error'
    });
}
function SuccessAlert(text) {
    new PNotify({
        title: 'Success',
        text: text,
        type: 'success'
    });
}
function checkInvoice(invoiceDate, invoiceNo, invoiceCode, invoiceAmount) {
    var ok = false;
    if (invoiceDate === "") {
        ErrorAlert("Invoice date cannot be blank");
    } else if (invoiceNo === "") {
        ErrorAlert("Invoice number cannot be blank");
    } else if (invoiceCode === "") {
        ErrorAlert("You need to set the invoice code");
    } else if (invoiceAmount === "") {
        ErrorAlert("You need to set the amount.");
    } else {
        ok = true;
    }
    return ok;
}
function rGetInvoice() {
    $.post("../php/set/set.php", {action: 'rGetInvoice'}, function (result) {
        var obj = jQuery.parseJSON(result);
        $("#tblRInvoice").html(obj[0]);
        $("#rInvoiceCount").html(obj[1] + 1);
        $("#rInvoiceBody").scrollTop($("#rInvoiceBody")[0].scrollHeight);
    });
}
function accountReceivableClick() {
    rGetInvoice();
}
function rInvoiceAmountBlur() {
    $("#rInvoiceAmount").val(checkAmount($("#rInvoiceAmount").val()));
}
function checkAmount(value) {
    if (value === "") {
        ErrorAlert("Remember to specify an amount.");
    } else if (isNaN(value)) {
        ErrorAlert("The amount must be numeric.");
        value = "";
    } else if (value < 0) {
        ErrorAlert("The amount must be 0 or more");
        value = "";
    } else {
        value = formatCurrency(value);
    }
    return value;
}
function formatCurrency(value) {
    if (value === ""){
        //do nothing
    }else if (value.indexOf(".") === -1) {
        return value + ".00";// value.00
    } else {
        var arr = value.split(".");
        if (arr[1].length === 0) {
            return arr[0] + ".00"; //value.00
        } else if (arr[1].length === 1) {
            return arr[0] + "." + arr[1] + "0"; //value.X0
        } else if (arr[1].length === 2) {
            return value;    //value.XX 
        } else if (arr[1].length > 2) {
            return arr[0] + "." + arr[1].substring(0, 2);
        }
    }
}
function showCompanyPanel() {
    $("#blackscreen").fadeIn();
    $("#companyPanel").fadeIn();
    getCompanyInfo();
}
function getCompanyInfo() {// get company information & ledger
    $.post("../php/set/set.php", {action: 'getCompanyInfo'}, function (result) {
        if (result === "0") {
            ErrorAlert("Database error");
        } else {
            var obj = $.parseJSON(result);
            $("#txtCompanyName").val(obj[0].companyname);
            $("#txtCompanyReg").val(obj[0].regno);
            generateLedgerTable();
        }
    });

}
function updateCompanyInfo() {// save company name & registration no
    var companyName = $("#txtCompanyName").val().trim();
    var regNo = $("#txtCompanyReg").val().trim();
    if (companyName === "") {
        ErrorAlert("Company name cannot be empty.");
    } else {
        $.post("../php/set/set.php", {action: 'updateCompanyInfo', companyName: companyName, regNo: regNo}, function (result) {
            if (result === "1") {
                SuccessAlert("Company information updated.");
                $("#companyName").html(companyName);
            } else {
                ErrorAlert("Database error");
            }
        });
    }
}
function generateLedgerTable() {
    $.post("../php/set/set.php", {action: 'getLedger'}, function (result) {
        if (result === "0") {
            ErrorAlert("Database error");
        } else {
            var obj = $.parseJSON(result);
            var html = "";
            var count = 1;

            for (var i = 0; i < obj.length; i++) {
                html += '<tr><td>' + count + '</td><td><input type="text" id="txtLedge' + obj[i].ledgerinfoid + '" class="form-control" placeholder="Ledger"  maxlength="30" value="' + obj[i].name + '" /></td><td><select id="ledgeType' + obj[i].ledgerinfoid + '" class="form-control" >' + ReturnSelectedLedgerType(obj[i].type) + '</select></td><td><button type="button" class="btn btn-primary bluebtn"  onclick="updateLedger(' + obj[i].ledgerinfoid + ')">Update</button></td><td><button type="button" class="btn btn-danger"  onclick="removeLedger(' + obj[i].ledgerinfoid + ')">Remove</button></td></tr>';
                count++;
            }

            html += '<tr><td colspan="5"><button type="button" class="btn btn-primary bluebtn pull-right"  onclick="addLedger()">Add</button></td><tr>';
            $("#ledgerBody").html(html);
            SuccessAlert("Successfully loaded.");
        }
    });

}
function addLedger() {
    $.post("../php/set/set.php", {action: 'addLedger'}, function (result) {
        if (result === "1") {
            SuccessAlert("New ledger added.");
            generateLedgerTable();
        } else {
            ErrorAlert("Database error");
        }
    });
}
function removeLedger(ledgerInfoId) {
    $.post("../php/set/set.php", {ledgerInfoId: ledgerInfoId, action: 'removeLedger'}, function (result) {
        if (result === "1") {
            SuccessAlert("Ledger removed.");
            generateLedgerTable();
            GenerateSideBar();
        } else {
            ErrorAlert("Database error");
        }
    });
}
function updateLedger(ledgerInfoId) {
    var ledger = $("#txtLedge" + ledgerInfoId).val().trim();
    var ledgerType = $("#ledgeType" + ledgerInfoId)[0].selectedIndex;
    $.post("../php/set/set.php", {ledger: ledger, ledgerType: ledgerType, ledgerInfoId: ledgerInfoId, action: 'updateLedger'}, function (result) {
        if (result === "1") {
            SuccessAlert("Ledger updated.");
            GenerateSideBar();
        } else {
            alert(result);
            ErrorAlert("Database error");
        }
    });
}
function ReturnSelectedLedgerType(value) {
    switch (value) {
        case "0":
            return "<option selected>Revenue</option><option>Less cost of goods/services</option><option>Less operational expense</option>";
        case "1":
            return "<option>Revenue</option><option selected>Less cost of goods/services</option><option>Less operational expense</option>";
        case "2":
            return "<option>Revenue</option><option>Less cost of goods/services</option><option selected>Less operational expense</option>";
    }
}
function GenerateSideBar() {
    $.post("../php/set/set.php", {action: 'getLimitedLedger'}, function (result) {
        if (result === "0") {
            ErrorResult("Database error");
        } else {
            entireledges = [];
            var obj = $.parseJSON(result);
            var html = '<ul class="sidebar-nav"><li class="sidebar-brand"><a>Overview</a></li><li><a href="#is">Income statement</a></li><li><a href="#bs">Balance sheet</a></li><li><a href="#all">All ledgers</a></li>';
            for (var i = 0; i < obj.length; i++) {
                html += "<li><a href='#" + obj[i].ledgerinfoid + "'>" + obj[i].name + "</a></li>";
                entireledges[i] = obj[i].name;
            }
            html += '</ul>';
            $("#sidebar-wrapper").html(html);
        }
    });

}
function GetCompanyName() {
    $.post("../php/set/set.php", {action: 'getCompanyName'}, function (result) {
        if (result === "0") {
        } else {
            $("#companyName").html(result);
        }
    });
}
function Loader() {
    GenerateSideBar();
    GetCompanyName();
    HandleHash();// handle hash in url
}
function HandleHash() {
    $("#tbl").html("");
    var hash = location.hash;
    if (hash.indexOf("#") === 0) {
        hash = hash.substring(1);
        switch (hash) {
            case "is":
                break;
            case "bs":
                break;
            case "all":
                returnAllLedgeTable();
                break;
            default:
                break;
        }
    } else {
        //do nothing
    }
}
function returnAllLedgeTable() {
    $.post("../php/set/set.php", {action: 'returnAllLedgeTable'}, function (result) {
        if (result === "0") {
            ErrorResult("Database error");
        } else {
            //generate ledge table
            var obj = $.parseJSON(result);
            var html = header;
            var count = 1;
            for (var i = 0; i < obj.length; i++) {
                html += '<tr><td><span class="noCol">' + count + '</span></td>' + returnTextBox(obj[i].date, "date") + returnTextBox(obj[i].refno, "refno") + returnTextBox(obj[i].invoiceno, "invoiceno") + returnTextBox(obj[i].particulars, "particulars") + returnTextBox(obj[i].ledger, "ledger1") + returnTextBox(obj[i].debit, "debit") + returnTextBox(obj[i].credit, "credit") + returnTextBox(null, "action") + '</tr>';
                count++;
            }
            $("#tbl").html(html);
        }
    });
}
function returnTextBox(value, type) {
    switch (type) {
        case "date":
            return '<td><input maxlength="20" class="form-control" type="text" value="' + value + '" /></td>';
        case "refno":
            return '<td><input maxlength="20" class="form-control" type="text" value="' + value + '" /></td>';
        case "invoiceno":
            return '<td><input maxlength="20" class="form-control" type="text" value="' + value + '" /></td>';
        case "particulars":
            return '<td><input maxlength="50" class="form-control" type="text" value="' + value + '" /></td>';
        case "ledger1":
            return generateLedgerDropDown(value);
        case "debit":
            return '<td><input maxlength="13" class="form-control" type="text" value="' + value + '" /></td>';
        case "credit":
            return '<td><input maxlength="13" class="form-control" type="text" value="' + value + '" /></td>';
        case "action":
            return '<td><button type="button" class="btn btn-danger ">Remove</button></td>';
    }
    
}
function generateLedgerDropDown(value) {
       
        var html = '<td><select class="form-control">';
        for (var i = 0; i < entireledges.length; i++ ){
            if (entireledges[i] === value){
                html +="<option selected>"+entireledges[i]+"</option>";
            }else{
                html +="<option>"+entireledges[i]+"</option>";
            }
        }
        html += "</select></td>";
        return html;
    }
function addRow(){
    var row = $("#txtRow").val().trim();
     $.post("../php/set/set.php", {action: 'addRow', ledgerinfoid:""}, function (result) {
         
     });
}



