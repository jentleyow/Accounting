var entireledgers = []; //store total ledgers type
var ledgerResult = []; //store total ledgers
var arrId = []; //store the textbox id generated to for attachKeyup()
var currentledgerinfoid = -1;//store the ledgerinfoid of the current selection. -1-> dont do anything. if 0-> get all ledger, else get select ledger
var getLedgerInfoAlready = false;// false->the getledgerinfo not ready. So returnAllLedgeTable cannot run yet.
var yearEnded = "";//store the unformatted date for txtYearEnded
$(document).ready(function () {
    $("#blackscreen").hide();
    $("#companyPanel").hide();
    $("#modifyAccountPanel").hide();
    $("#divIncomeStatement").hide();
    $('#yearEnded').datetimepicker({
        pickTime: false,
        useStrict: true,
        useCurrent: false
    });
    $('#yearEnded').on("dp.change", function (e) {
        yearEnded = $("#txtYearEnded").val();
        yearEndedChange();
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
    window.location = "Dashboard.htm";
}
function refresh() {
    HandleHash();
}
function hideBlackScreen() {
    $("#blackscreen").fadeOut();
    $("#companyPanel").fadeOut();
}
function logOff() {
    window.location = "../php/user/logoff.php";
}
function ErrorAlert(text) {
    new PNotify({
        title: 'Error',
        text: text,
        type: 'error',
        hide: true,
        delay: 750
    });
}
function SuccessAlert(text) {
    new PNotify({
        title: 'Success',
        text: text,
        type: 'success',
        hide: true,
        delay: 750
    });
}
function hideAll(){// hide divIncomestatement,
    $("#divIncomeStatement").hide();
    $("#tbl").hide();
}
function showIncomeStatementPanel(){
    $("#divIncomeStatement").show();
}
function showTblPanel(){
    $("#tbl").show();
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
            yearEnded = obj[0].yearended;
            yearEndedChange();
        }
    });

}
function updateCompanyInfo() {// save company name & registration no
    var companyName = $("#txtCompanyName").val().trim();
    var regNo = $("#txtCompanyReg").val().trim();
    if (companyName === "") {
        ErrorAlert("Company name cannot be empty.");
    } else {
        $.post("../php/set/set.php", {action: 'updateCompanyInfo', companyName: companyName, regNo: regNo, yearEnded: yearEnded}, function (result) {
            if (result === "1") {
                SuccessAlert("Company information updated.");
                GetCompanyName();
            } else {
                ErrorAlert("Database error");
            }
        });
    }
}
function generateLedgerTable() {
    var html = "";
    var count = 1;
    for (var i = 0; i < entireledgers.length; i++) {
        html += '<tr><td>' + count + '</td><td><input type="text" id="txtLedge' + entireledgers[i].ledgerinfoid + '" class="form-control" placeholder="Ledger"  maxlength="30" value="' + entireledgers[i].name + '" /></td><td><select id="ledgeType' + entireledgers[i].ledgerinfoid + '" class="form-control" >' + ReturnSelectedLedgerType(entireledgers[i].type) + '</select></td><td><button type="button" class="btn btn-primary bluebtn"  onclick="updateLedger(' + entireledgers[i].ledgerinfoid + ')">Update</button></td><td><button type="button" class="btn btn-danger"  onclick="removeLedger(' + entireledgers[i].ledgerinfoid + ')">Remove</button></td></tr>';
        count++;
    }
    html += '<tr><td colspan="5"><button type="button" class="btn btn-primary bluebtn pull-right"  onclick="addLedger()">Add</button></td><tr>';
    $("#ledgerBody").html(html);
}
function addLedger() {
    $.post("../php/set/set.php", {action: 'addLedger'}, function (result) {
        if (result === "1") {
            SuccessAlert("New ledger added.");
            GenerateSideBar();
            returnAllLedgerTable();
        } else {
            ErrorAlert("Database error");
        }
    });
}
function removeLedger(ledgerInfoId) {
    (new PNotify({
        title: "Remove ledger",
        text: "Are you sure you want to remove ledger? Any statements made with the ledgers will be removed.",
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
    })).get().on('pnotify.confirm', function () {//0->removeLedger
        $.post("../php/set/set.php", {ledgerInfoId: ledgerInfoId, action: 'removeLedger'}, function (result) {
            if (result === "1") {
                SuccessAlert("Ledger removed.");
                GenerateSideBar();
                returnAllLedgerTable();
            } else {
                ErrorAlert("Database error");
            }
        });
    }).on('pnotify.cancel', function () {

    });

}
function updateLedger(ledgerInfoId) {
    var ledger = $("#txtLedge" + ledgerInfoId).val().trim();
    var ledgerType = $("#ledgeType" + ledgerInfoId)[0].selectedIndex;
    $.post("../php/set/set.php", {ledger: ledger, ledgerType: ledgerType, ledgerInfoId: ledgerInfoId, action: 'updateLedger'}, function (result) {
        if (result === "1") {
            SuccessAlert("Ledger updated.");
            GenerateSideBar();
            returnAllLedgerTable();
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
    getLedgerInfoAlready = false;
    $.post("../php/set/set.php", {action: 'getLedger'}, function (result) {
        if (result === "0") {
            ErrorResult("Database error");
            entireledgers = [];
        } else {
            entireledgers = $.parseJSON(result);
            var html = "<ul class='sidebar-nav'><li id='is' onclick='linkClick(this.id)'><a href='#is'>Income statement</a></li><li id='bs' onclick='linkClick(this.id)'><a href='#bs'>Balance sheet</a></li><li id='all' onclick='linkClick(this.id)'><a href='#all'>All ledgers</a></li>";
            for (var i = 0; i < entireledgers.length; i++) {
                html += "<li id='s" + i + "' onclick='linkClick(this.id)'><a href='#" + i + "'>" + entireledgers[i].name + "</a></li>";
            }
            html += '</ul>';
            $("#sidebar-wrapper").html(html);
            generateLedgerTable();
            getLedgerInfoAlready = true;
        }
    });

}
function GetCompanyName() {
    $.post("../php/set/set.php", {action: 'getCompanyName'}, function (result) {
        if (result === "0") {
            $("#companyName").html("No company name");
        } else {
            if (result === "") {
                $("#companyName").html("No company name");
            } else {
                $("#companyName").html(result);
            }

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
    hideAll();
    var hash = location.hash;
    var titleType = "";
    if (hash.indexOf("#") === 0) {
        hash = hash.substring(1);
        switch (hash) {
            case "is":
                showIncomeStatementPanel();
                titleType = "Income Statement";
                currentledgerinfoid = -1;
                break;
            case "bs":
                titleType = "Balance Sheet";
                currentledgerinfoid = -1;
                break;
            case "all":
                showTblPanel();
                returnAllLedgerTable();
                titleType = "All ledges";
                currentledgerinfoid = 0;
                break;
            default:
                showTblPanel();
                var x = 0;
                var timer = setInterval(function () {
                    if (getLedgerInfoAlready === true) {
                        if (entireledgers[hash] !== undefined) {
                            titleType = entireledgers[hash].name;
                            clearTimeout(timer);
                            currentledgerinfoid = entireledgers[hash].ledgerinfoid;
                            $("#titleType").html(" (" + titleType + ")");
                            returnAllLedgerTable();
                        } else {
                            location.hash = "";
                        }

                    } else {
                        x = 1000;
                    }
                }, x);

                break;
        }
        $("#titleType").html(" (" + titleType + ")");
    } else {
        currentledgerinfoid = -1;
    }
}
function returnAllLedgerTable() {
    var x = 0;// interval timing-> first load 0 interval... if fail interval 1000
    var timer = setInterval(function () {
        if (getLedgerInfoAlready === true && currentledgerinfoid !== -1) {
            $.post("../php/set/set.php", {action: 'returnAllLedgerTable', ledgerinfoid: currentledgerinfoid}, function (result) {
                if (result === "0") {
                    ErrorAlert("Database error");
                } else {
                    //generate ledge table
                    ledgerResult = $.parseJSON(result);
                    var html = '<thead><tr><th width="3%">No.</th><th width="10%">Date</th><th width="15%">Ref No.</th><th width="15%">Invoice No.</th><th width="20%">Particulars</th><th>Ledger</th><th width="8%" >Debit ($)</th><th width="8%" >Credit ($)</th><th colspan="2">Actions</th></tr></thead>';
                    var len = ledgerResult.length;
                    if (currentledgerinfoid === 0) {
                        for (var i = 0; i < len; i++) {
                            html += '<tr><td><span class="noCol">' + (i + 1) + '</span></td>' + returnTextBox(ledgerResult[i].date, "date", i) + returnTextBox(ledgerResult[i].refno, "refno", i) + returnTextBox(ledgerResult[i].invoiceno, "invoiceno", i) + returnTextBox(ledgerResult[i].particulars, "particulars", i) + returnTextBox(ledgerResult[i].ledger, "ledger1", i) + returnTextBox(ledgerResult[i].debit, "debit", i) + returnTextBox(ledgerResult[i].credit, "credit", i) + returnTextBox(null, "action", i) + '</tr>';
                        }
                    } else {
                        var debitamt = 0;
                        var creditamt = 0;
                        for (var i = 0; i < len; i++) {
                            html += '<tr><td><span class="noCol">' + (i + 1) + '</span></td>' + returnTextBox(ledgerResult[i].date, "date", i) + returnTextBox(ledgerResult[i].refno, "refno", i) + returnTextBox(ledgerResult[i].invoiceno, "invoiceno", i) + returnTextBox(ledgerResult[i].particulars, "particulars", i) + returnTextBox(ledgerResult[i].ledger, "ledger1", i) + returnTextBox(ledgerResult[i].debit, "debit", i) + returnTextBox(ledgerResult[i].credit, "credit", i) + returnTextBox(null, "action", i) + '</tr>';
                            if (ledgerResult[i].debit !== "") {
                                debitamt += parseInt(ledgerResult[i].debit);
                            }
                            if (ledgerResult[i].credit !== "") {
                                creditamt += parseInt(ledgerResult[i].credit);
                            }
                        }
                        html += '<tr><td colspan="5"></td><td>Total:</td><td id="debitCol">' + formatCurrency(debitamt + "") + '</td><td id="creditCol">' + formatCurrency(creditamt + "") + '</td><td></td></tr>';
                    }
                    $("#tbl").html(html);
                    attachKeyUp();
                }
            });
            clearTimeout(timer);
        } else {
            x = 1000;
        }
    }, x);


}
function returnTextBox(value, type, id) {
    var maxlength = 0;
    switch (type) {
        case "date":
            id = "ledgerdate_" + id;
            maxlength = 20;
            break;
        case "refno":
            id = "ledgerrefno_" + id;
            maxlength = 20;
            break;
        case "invoiceno":
            id = "ledgerinvoiceno_" + id;
            maxlength = 20;
            break;
        case "particulars":
            id = "ledgerparticulars_" + id;
            maxlength = 50;
            break;
        case "ledger1":
            return generateLedgerDropDown(value, id);
            break;
        case "debit":
            id = "ledgerdebit_" + id;
            maxlength = 13;
            break;
        case "credit":
            id = "ledgercredit_" + id;
            maxlength = 13;
            break;
        case "action":
            return '<td><button type="button" class="btn btn-danger" onclick="removeLedgerForTable(' + id + ')">Remove</button></td>';
            break;
    }
    arrId.push("#" + id);
    return generateTblHtml(id, maxlength, value); //return the html using the following
}
function generateTblHtml(id, maxlength, value) {
    return '<td><input onblur="saveField(this.id)"  id="' + id + '" maxlength="' + maxlength + '" class="form-control" type="text" value="' + value + '" /></td>';
}
function removeLedgerForTable(id) {
    $.post("../php/set/set.php", {action: 'removeLedgerForTable', ledgerid: ledgerResult[id].ledgerid}, function (result) {
        if (result === "0") {
            ErrorAlert("Unable to remove ledger");
        } else {
            returnAllLedgerTable();
        }
    });
}
function attachKeyUp() {
    for (var i = 0; i < arrId.length; i++) {
        $(arrId[i]).keyup(function (e) {
            handleKey($(this).attr('id'), e);
        });
    }
}
function generateLedgerDropDown(value, count) {

    var html = '<td><select onblur="saveField(this.id)"  class="form-control" id="ledgerdropdown_' + count + '"><option value="" selected disabled>---</option>';
    for (var i = 0; i < entireledgers.length; i++) {
        if (entireledgers[i].name === value) {
            html += "<option selected>" + entireledgers[i].name + "</option>";
        } else {
            html += "<option>" + entireledgers[i].name + "</option>";
        }
    }
    html += "</select></td>";
    return html;
}
function handleKey(id, e) {
    var arr = id.split("_");// first is the type, second is the no.
    switch (e.keyCode) {
        case 38: //top
            id = arr[0] + "_" + (parseInt(arr[1]) - 1);
            break;
        case 40://bottom
            id = arr[0] + "_" + (parseInt(arr[1]) + 1);
            break;
        case 37://left
            id = moveBox(arr[0], -1) + "_" + arr[1];
            break;
        case 39://right
            id = moveBox(arr[0], 1) + "_" + arr[1];
            break;

    }
    $("#" + id).focus();
}
function moveBox(value, type) {//move textbox
    var arrType = ["ledgerdate", "ledgerrefno", "ledgerinvoiceno", "ledgerparticulars", "ledgerdebit", "ledgercredit"];
    var j = -1;
    for (var i = 0; i < arrType.length; i++) {
        if (value === arrType[i]) {
            j = i;
        }
    }
    j = j + type;
    return arrType[j];
}
function addRow() {
    var row = $("#txtRow").val().trim();
    if (isNaN(row) === true || row.indexOf(".") !== -1 || row === "0") {
        ErrorAlert("You can only specify a row from 1-9");
    } else {
        row = parseInt(row);
        if (currentledgerinfoid !== -1) {
            $.post("../php/set/set.php", {action: 'addRow', row: row, ledgerinfoid: currentledgerinfoid}, function (result) {
                if (result === "1") {
                    SuccessAlert(row + " row(s) added.");
                    $("#txtRow").val("0");
                    returnAllLedgerTable();
                } else {
                    ErrorAlert("Database error");
                }
            });
        }
    }
}
function saveField(id) {
    var arr = id.split("_");// first is the type, second is the no.
    var output = "";
    switch (arr[0]) {
        case "ledgerdate":
            output = checkDate(id);
            break;
        case "ledgerrefno":
            outputt = $("#" + id).val().trim();
            break;
        case "ledgerinvoiceno":
            output = $("#" + id).val().trim();
            break;
        case "ledgerparticulars":
            output = $("#" + id).val().trim();
            break;
        case "ledgerdropdown":
            output = returnDropDown(id);
            break;
        case "ledgerdebit":
            output = checkAmount(id);
            calculateLedger(1, id, output);
            break;
        case "ledgercredit":
            output = checkAmount(id);
            calculateLedger(2, id, output);
            break;
    }
    if (output !== null) {
        $.post("../php/set/set.php", {action: 'saveField', ledgerid: ledgerResult[arr[1]].ledgerid, type: arr[0], output: output}, function (result) {
            if (result === "1") {
            } else {
                ErrorAlert("Error saving");
            }
        });
    }
}
function returnDropDown(id) {
    if (entireledgers.length === 0) {
        ErrorAlert("You need to add a ledger first.");
        return null;
    } else {
        var index = $("#" + id)[0].selectedIndex - 1;
        if (index === -1) {
            return null;
        }
        if (entireledgers[index] === undefined) {
            ErrorAlert("Error with page. Please refresh the page.");
        } else {
            return entireledgers[index].ledgerinfoid;
        }
        return null;
    }
}
function checkAmount(id) {
    var value = $("#" + id).val().trim();
    if (value === "") {
    } else if (isNaN(value)) {
        ErrorAlert("The amount must be numeric.");
    } else if (value < 0) {
        ErrorAlert("The amount must be 0 or more");
    } else {
        value = formatCurrency(value, id);
        $("#" + id).val(value);
        return value;
    }
    $("#" + id).val(value);
    return null;
}
function formatCurrency(value) {
    if (value === "") {
        //do nothing
    } else if (value.indexOf(".") === -1) {
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
function checkDate(id) {
    var value = $("#" + id).val().trim();
    if (value !== "") {
        try {
            var arr = value.split("-");
            if (isNaN(arr[1])) {
                value = arr[0] + "-" + returnMonth(arr[1]) + "-" + arr[2];
            } else {
                $("#" + id).val(arr[0] + "-" + returnNonNumericMonth(arr[1]) + "-" + arr[2]);
            }

            return value;
        } catch (err) {
            ErrorAlert("Date format must be dd-mm-yyyy.");
            return null;
        }
    } else {
        return null;
    }
}
function returnNonNumericMonth(month) {
    switch (month) {
        case "1":
        case "01":
            return "Jan";
        case "2":
        case "02":
            return "Feb";
        case "3":
        case "03":
            return "Mar";
        case "4":
        case "04":
            return "Apr";
        case "5":
        case "05":
            return "May";
        case "6":
        case "06":
            return "Jun";
        case "7":
        case "07":
            return "Jul";
        case "8":
        case "08":
            return "Aug";
        case "9":
        case "09":
            return "Sep";
        case "10":
            return "Oct";
        case "11":
            return "Nov";
        case "12":
            return "Dec";
        default:
            throw new Exception();
            break;
    }
}
function returnMonth(month) {
    month = month.toLowerCase();
    switch (month) {
        case "jan":
            return "1";
        case "feb":
            return "2";
        case "mar":
            return "3";
        case "apr":
            return "4";
        case "may":
            return "5";
        case "jun":
            return "6";
        case "jul":
            return "7";
        case "aug":
            return "8";
        case "sep":
            return "9";
        case "oct":
            return "10";
        case "nov":
            return "11";
        case "dec":
            return "12";
        default:
            throw new Exception();
            break;
    }
}
function returnFullMonthName(month) {//return full month name;
    switch (month) {
        case 1:
            return "January";
        case 2:
            return "February";
        case 3:
            return "March";
        case 4:
            return "April";
        case 5:
            return "May";
        case 6:
            return "June";
        case 7:
            return "July";
        case 8:
            return "August";
        case 9:
            return "September";
        case 10:
            return "October";
        case 11:
            return "November";
        case 12:
            return "December";
    }
}
function calculateLedger(type, id, amt) {
    if (amt === null) {
        return;
    }
    var arr = id.split("_");// first is the type, second is the no.
    if (type === 1) {
        ledgerResult[arr[1]].debit = amt;
    } else {
        ledgerResult[arr[1]].credit = amt;
    }
    var len = ledgerResult.length;
    var amount = 0;
    if (type === 1) {//for debit
        for (var i = 0; i < len; i++) {
            if (ledgerResult[i].debit !== "") {
                amount += parseInt(ledgerResult[i].debit);
            }
        }
        $("#debitCol").html(formatCurrency(amount + ""));
    } else {//for credit
        for (var i = 0; i < len; i++) {
            if (ledgerResult[i].credit !== "") {
                amount += parseInt(ledgerResult[i].credit);
            }
        }
        $("#creditCol").html(formatCurrency(amount + ""));
    }
}
function linkClick(id) {
    $("li").removeClass("sidebar-brand");
    $("#" + id).addClass("sidebar-brand");
}
function yearEndedChange() {// handled date value for txtYearEnded
    if (yearEnded !== "") {
        var arr = yearEnded.split("-");
        $("#txtYearEnded").val(arr[0] + " " + returnFullMonthName(parseInt(arr[1])) + " " + arr[2]);
    }

}
