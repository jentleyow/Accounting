var entireledgers = []; //store total ledgers type
var ledgerResult = []; //store total ledgers
var arrId = []; //store the textbox id generated to for attachKeyup()
var currentledgerinfoid = -1;//store the ledgerinfoid of the current selection. -1-> dont do anything. if 0-> get all ledger, else get select ledger
var getLedgerInfoAlready = false;// false->the getledgerinfo not ready. So returnAllLedgeTable cannot run yet.
var yearStarted = "";//store the unformatted date for txtYearStarted
var yearEnded = "";//store the unformatted date for txtYearEnded
var bankstatement; // store object for bank statement use.
var bankstatementmonthyear; // store month & year for bank statement use only.
var balancesheet;//store the  balancesheet 
$(document).ready(function () {
    $("#blackscreen").hide();
    $("#companyPanel").hide();
    $("#modifyAccountPanel").hide();
    $("#balancesheetPanel").hide();
    hideAll();
    $('#yearStarted').datetimepicker({
        pickTime: false,
        useStrict: true,
        useCurrent: false
    });
    $('#yearEnded').datetimepicker({
        pickTime: false,
        useStrict: true,
        useCurrent: false
    });
     $('#yearStarted').on("dp.change", function (e) {
        yearStarted = $("#txtYearStarted").val();
       yearChange(0);
    });
    $('#yearEnded').on("dp.change", function (e) {
        yearEnded = $("#txtYearEnded").val();
        yearChange(1);
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
    $("#balancesheetPanel").fadeOut();
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
function hideAll() {// hide divIncomestatement,
    $("#divIncomeStatement").hide();
    $("#tbl").hide();
    $("#divBankStatement").hide();
    $("#divBalanceSheet").hide();
    $("#divGenerate").hide();
}
function showCompanyPanel() {
    $("#blackscreen").fadeIn();
    $("#companyPanel").fadeIn();
    getCompanyInfo();
}
function getCompanyInfo() {// get company information & ledger
    $.post("../php/set/set.php", {action: 'getCompanyInfo'}, function (result) {
        if (result === "0") {
            ErrorAlert("Server error");
        } else {
            var obj = $.parseJSON(result);
            $("#txtCompanyName").val(obj[0].companyname);
            $("#txtCompanyReg").val(obj[0].regno);
            yearEnded = obj[0].yearended;
            yearStarted = obj[0].yearstarted;
            yearChange(0);
            yearChange(1);
        }
    });

}
function updateCompanyInfo() {// save company name & registration no
    var companyName = $("#txtCompanyName").val().trim();
    var regNo = $("#txtCompanyReg").val().trim();
    if (companyName === "") {
        ErrorAlert("Company name cannot be empty.");
    } else {
        $.post("../php/set/set.php", {action: 'updateCompanyInfo', companyName: companyName, regNo: regNo, yearStarted:yearStarted, yearEnded: yearEnded}, function (result) {
            if (result === "1") {
                SuccessAlert("Company information updated.");
                GetCompanyName();
            } else {
                ErrorAlert("Server error");
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
            ErrorAlert("Server error");
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
                ErrorAlert("Server error");
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
            ErrorAlert("Server error");
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
            ErrorResult("Server error");
            entireledgers = [];
        } else {
            entireledgers = $.parseJSON(result);
            var html = "<ul class='sidebar-nav'><li id='generate' onclick='linkClick(this.id)'><a href='#generate'>Generate</a></li><li id='is' onclick='linkClick(this.id)'><a href='#is'>Income statement</a></li><li id='bs' onclick='linkClick(this.id)'><a href='#bs'>Balance sheet</a></li><li id='bst' onclick='linkClick(this.id)'><a href='#bst'>Bank statement</a></li><li id='all' onclick='linkClick(this.id)'><a href='#all'>All ledgers</a></li>";
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
    hideAll();
    $("#instructiontext").hide();
    $("#addRowDiv").hide();
    var hash = location.hash;
    var titleType = "";
    if (hash.indexOf("#") === 0) {
        hash = hash.substring(1);
        switch (hash) {
            case "generate":
                titleType = "Generate excel file";
                currentledgerinfoid = -1;
                displayGenerateScreen();
            break;
            case "is":
                titleType = "Income Statement";
                currentledgerinfoid = -1;
                generateIncomeStatementTbl();
                break;
            case "bs":
                titleType = "Balance Sheet";
                currentledgerinfoid = -1;
                showGeneratedBalanceSheet();
                break;
            case "bst":
                titleType = "Bank Statement";
                currentledgerinfoid = -1;
                generateBankStatement();
                break;
            case "all":
                returnAllLedgerTable();
                titleType = "All ledges";
                currentledgerinfoid = 0;
                break;
            default:
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
        $("#instructiontext").show();
    }
}
function returnAllLedgerTable() {
    $("#tbl").show();
    $("#addRowDiv").show();
    var x = 0;// interval timing-> first load 0 interval... if fail interval 1000
    var timer = setInterval(function () {
        if (getLedgerInfoAlready === true && currentledgerinfoid !== -1) {
            $.post("../php/set/set.php", {action: 'returnAllLedgerTable', ledgerinfoid: currentledgerinfoid}, function (result) {
                if (result === "0") {
                    ErrorAlert("Server error");
                } else {
                    //generate ledge table
                    ledgerResult = $.parseJSON(result);
                    var html = ['<thead><tr><th width="3%">No.</th><th width="10%">Date</th><th width="15%">Ref No.</th><th width="15%">Invoice No.</th><th width="20%">Particulars</th><th>Ledger</th><th width="8%" >Debit ($)</th><th width="8%" >Credit ($)</th><th colspan="2">Actions</th></tr></thead>'];
                    var len = ledgerResult.length;
                    if (currentledgerinfoid === 0) {
                        for (var i = 0; i < len; i++) {
                            html.push('<tr><td><span class="noCol">' +(i + 1)+'</span></td>' + returnTextBox(ledgerResult[i].date, "date", i) + returnTextBox(ledgerResult[i].refno, "refno", i) + returnTextBox(ledgerResult[i].invoiceno, "invoiceno", i) + returnTextBox(ledgerResult[i].particulars, "particulars", i) + returnTextBox(ledgerResult[i].ledger, "ledger1", i) + returnTextBox(ledgerResult[i].debit, "debit", i) + returnTextBox(ledgerResult[i].credit, "credit", i) + returnTextBox(null, "action", i) + '</tr>');
                        }
                    } else {
                        var debitamt = 0;
                        var creditamt = 0;
                        for (var i = 0; i < len; i++) {
                            html.push('<tr><td><span class="noCol">' +(i + 1) +'</span></td>' + returnTextBox(ledgerResult[i].date, "date", i) + returnTextBox(ledgerResult[i].refno, "refno", i) + returnTextBox(ledgerResult[i].invoiceno, "invoiceno", i) + returnTextBox(ledgerResult[i].particulars, "particulars", i) + returnTextBox(ledgerResult[i].ledger, "ledger1", i) + returnTextBox(ledgerResult[i].debit, "debit", i) + returnTextBox(ledgerResult[i].credit, "credit", i) + returnTextBox(null, "action", i) + '</tr>');
                            if (ledgerResult[i].debit !== "") {
                                debitamt += parseFloat(ledgerResult[i].debit);
                            }
                            if (ledgerResult[i].credit !== "") {
                                creditamt += parseFloat(ledgerResult[i].credit);
                            }
                        }
                        html.push('<tr><td colspan="5"></td><td>Total:</td><td id="debitCol">' + formatCurrency(debitamt) + '</td><td id="creditCol">' + formatCurrency(creditamt) + '</td><td></td></tr>');
                    }
                    $("#tbl").html(html.join());
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
                    ErrorAlert("Server error");
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
        return "";
    } else if (isNaN(value)) {
        ErrorAlert("The amount must be numeric.");
        value = "0.00";
    } else if (value < 0) {
        ErrorAlert("The amount must be 0 or more");
    } else {
        value = formatCurrency(value);
        $("#" + id).val(value);
        return value;
    }
    $("#" + id).val(value);
    return null;
}
function formatCurrency(value) {
    value = value + "";
    if (value === "") {
        //do nothing
    } else if (value.indexOf(".") === -1) {
        return value + ".00";// value.00
    } else {
        var arr = value.split(".");
        if (arr[0] === "") {
            return "0.00";
        } else {
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
                amount += parseFloat(ledgerResult[i].debit);
            }
        }
        $("#debitCol").html(formatCurrency(amount));
    } else {//for credit
        for (var i = 0; i < len; i++) {
            if (ledgerResult[i].credit !== "") {
                amount += parseFloat(ledgerResult[i].credit);
            }
        }
        $("#creditCol").html(formatCurrency(amount));
    }
}
function linkClick(id) {
    $("li").removeClass("sidebar-brand");
    $("#" + id).addClass("sidebar-brand");
}
function yearChange(type) {// handled date value for txtYearEnded
    if (type===0){
        if (yearStarted !== "") {
        var arr = yearStarted.split("-");
        $("#txtYearStarted").val(arr[0] + " " + returnFullMonthName(parseFloat(arr[1])) + " " + arr[2]);
    }
    }else{
        if (yearEnded !== "") {
        var arr = yearEnded.split("-");
        $("#txtYearEnded").val(arr[0] + " " + returnFullMonthName(parseFloat(arr[1])) + " " + arr[2]);
    }
    }
    

}
function generateIncomeStatementTbl() {
    $("#divIncomeStatement").show();
    var html = "<tr><th>Components</th><th width='20%'>Loss</th><th width='20%'>Gain</th></tr>";

    $.post("../php/set/set.php", {action: 'generateIncomeStatement'}, function (result) {
        if (result === "0") {
            ErrorAlert("Server error");
        } else {
            var obj = $.parseJSON(result);
            //Revenue
            html += "<tr><td><span class='strong-underline'>Revenue</span></td><td></td><td></td></tr>";
            var revenue = obj[0];//revenue
            var revenueAmt = 0;
            var len = revenue.length;
            var i = 0;
            for (i = 0; i < len; i++) {
                html += "<tr><td>" + revenue[i].name + "</td><td></td><td class='center'>" + revenue[i].amount + "</td></tr>";
                revenueAmt += parseFloat(revenue[i].amount);
            }
            //Less cost of services/goods
            html += "<tr><td><span class='strong-underline'>Less cost of goods/services sold</span></td><td></td><td></td></tr>";
            var lesscost = obj[1];//less cost of goods/services
            var lesscostAmt = 0;
            len = lesscost.length;
            for (i = 0; i < len; i++) {
                html += "<tr><td>" + lesscost[i].name + "</td><td class='center'>" + lesscost[i].amount + "</td><td></td></tr>";
                lesscostAmt += parseFloat(lesscost[i].amount);
            }
            var grossprofit = revenueAmt - lesscostAmt;
            html += "<tr><td><strong>Gross profit</strong></td><td></td><td class='center'>" + formatCurrency(grossprofit) + "</td></tr>";
            //Less cost of operational 
            var lessoperational = obj[2]; //less operational expenses
            html += "<tr><td><span class='strong-underline'>Less operational expenses</span></td><td></td><td></td></tr>";
            var lessoperationalAmt = 0;
            len = lessoperational.length;
            for (i = 0; i < len; i++) {
                html += "<tr><td>" + lessoperational[i].name + "</td><td class='center'>" + lessoperational[i].amount + "</td><td></td></tr>";
                lessoperationalAmt += parseFloat(lessoperational[i].amount);
            }
            html += "<tr><td><strong>Total expenses</strong></td><td class='center'>" + formatCurrency(lessoperationalAmt) + "</td><td></td></tr>";
            if (grossprofit - lessoperationalAmt < 0) {
                html += "<tr><td><strong>Net loss for the year</strong></td><td></td><td class='center'>" + formatCurrency(grossprofit - lessoperationalAmt) + "</td></tr>";
            } else {
                html += "<tr><td><strong>Net profit for the year</strong></td><td></td><td class='center'>" + formatCurrency(grossprofit - lessoperationalAmt) + "</td></tr>";
            }

            $("#incomeStatementTbl").html(html);
        }

    });
}
function generateBankStatement() { //a->Balance b/d  || b->Total Deposits || c-> Total Payments || d-> Balance b/f
    $("#divBankStatement").show();
    $.post("../php/set/set.php", {action: 'getYearEnded'}, function (result) {
        if (result === "0") {
            ErrorAlert("Server error");
        } else if (result === "") {
            $("#divBankStatement").html("You need to set the value for the year ended in <strong>Modify company's information & ledgers</strong> panel before you can access this.<br />Once done, refresh page.");
        } else {
            bankstatementmonthyear = result;
            $.post("../php/set/set.php", {action: 'getBankStatement'}, function (result) {
                if (result === "0") {
                    ErrorAlert("Server problem.");
                } else if (result === "2") {
                    BankStatementProblem();
                } else {
                    try {
                        bankstatement = $.parseJSON(result);

                    } catch (ex) {//fail to parse
                        return BankStatementProblem();
                    }
                    handleBankStatement();
                }
            });
        }
    });


}
function BankStatementProblem() {//handle problem in bankstatement
    ErrorAlert("Problem with bank statement. Returning the bank statement to default values.");
    $.post("../php/set/set.php", {action: 'BankStatementProblem'}, function (result) {
        if (result === "0") {
            ErrorAlert("Unable to return the bank statement to default values");
        } else {
            SuccessAlert("Successfully reset. Please reload.");
        }
    });
}
function handleBankStatement() {
    var html = '<table class="table table-bordered " id="tbl"><tr><th>Month & Year</th>';
    var arr = bankstatementmonthyear.split("-");
    var month = parseInt(arr[0]);
    var year = parseInt(arr[1]) - 1;
    var i = 0;
    var len = 12;
    for (i = 0; i < len; i++) {
        month++;
        if (month === 13) {
            month = 1;
            year++;
        }
        html += "<th>" + returnNonNumericMonth(month + "") + " " + year + "</th>";
    }
    html += "</tr><tr><td>Balance b/d</td>";
    for (i = 0; i < len; i++) {
        html += "<td><input type='text' id='a_" + i + "' value='" + formatCurrency(bankstatement.bs[i].a) + "' class='form-control' onblur='storeBankStatementAmount(this.id)' maxlength='12'/></td>";
    }
    html += "</tr><tr><td>Total Deposits</td>";
    var totalDeposit = 0;
    for (i = 0; i < len; i++) {
        totalDeposit += bankstatement.bs[i].b;
        html += "<td><input type='text' id='b_" + i + "' value='" + formatCurrency(bankstatement.bs[i].b) + "' class='form-control' onblur='storeBankStatementAmount(this.id)' maxlength='12'/></td>";
    }
    html += "</tr><tr><td>Total Payments</td>";
    var totalPayment = 0;
    for (i = 0; i < len; i++) {
        totalPayment += bankstatement.bs[i].c;
        html += "<td><input type='text' id='c_" + i + "' value='" + formatCurrency(bankstatement.bs[i].c) + "' class='form-control' onblur='storeBankStatementAmount(this.id)' maxlength='12'/></td>";
    }
    html += "</tr>";
    html += "</tr><tr><td>Balance b/f</td>";
    for (i = 0; i < len; i++) {

        html += "<td><strong>" + formatCurrency((sum(bankstatement.bs[i].a + "+" + bankstatement.bs[i].b + "+-" + bankstatement.bs[i].c))) + "</strong></td>";
    }
    html += "</tr><tr><td colspan='13'><button type='button' class='btn btn-primary bluebtn pull-right' onclick='saveBankStatement()'>Save All</button></td></tr></table>Overall total deposits: " + formatCurrency(totalDeposit) + "<br />Overall total payments: " + formatCurrency(totalPayment);
    $("#divBankStatement").html(html);
}
function storeBankStatementAmount(id) {
    if (checkAmount(id) !== null) {
        var amt = $("#" + id).val();
        var arr = id.split("_"); // get the no-> arr[1]
        if (arr[0] === "a") {
            bankstatement.bs[arr[1]].a = parseFloat(amt);
        }
        if (arr[0] === "b") {
            bankstatement.bs[arr[1]].b = parseFloat(amt);
        }
        if (arr[0] === "c") {
            bankstatement.bs[arr[1]].c = parseFloat(amt);
        }
        var left = parseInt(arr[1]);// decrease till 0
        for (left; left > 0; left--) {
            bankstatement.bs[left - 1].a = sum(bankstatement.bs[left].a + "+" + bankstatement.bs[left - 1].c + "+-" + bankstatement.bs[left - 1].b);
        }
        var right = parseInt(arr[1]);// increase till 12
        for (right; right < 11; right++) {
            bankstatement.bs[right + 1].a = sum(bankstatement.bs[right].a + "+" + bankstatement.bs[right].b + "+-" + bankstatement.bs[right].c);
        }
        handleBankStatement();
    }
}
function saveBankStatement() {
    $.post("../php/set/set.php", {action: 'saveBankStatement', json: JSON.stringify(bankstatement)}, function (result) {
        if (result === "0") {
            ErrorAlert("Unable to save bank statement.");
        } else {
            SuccessAlert("Successfully saved.");
        }
    });
}
function sum(output) {
    var arr = output.split("+");
    var total = 0;
    var i = 0;
    var len = arr.length;
    for (i = 0; i < len; i++) {
        total += parseFloat(arr[i]) * 100;
    }

    return total / 100;
}
function addBalanceSheetItem() {
    $.post("../php/set/set.php", {action: 'addBalanceSheetItem'}, function (result) {
        if (result === "0") {
            ErrorAlert("Unable to add item to balance sheet");
        } else {
            loadBalanceSheetTable();
        }
    });
}
function loadBalanceSheetTable() {
    $("#balancesheetPanel").fadeIn();
    $("#blackscreen").fadeIn();
    $.post("../php/set/set.php", {action: 'getBalanceSheetTable'}, function (result) {
        if (result === "0") {
            ErrorAlert("Unable to load balance sheet table.");
        } else {
            var html = "";
            balancesheet = $.parseJSON(result);
            var i = 0;
            var len = balancesheet.length;
            for (i = 0; i < len; i++) {
                html += '<tr><td>' + (i + 1) + '</td><td><input id="bsitem_' + i + '" class="form-control" type="text" value="' + balancesheet[i].item + '" maxlength="50"/></td><td><input id="bsamount_' + i + '" class="form-control" type="text" value="' + balancesheet[i].amount + '" maxlength="13" onblur="checkAmount(this.id)"/></td><td><input id="bsdepreciation_' + i + '" class="form-control" type="text" value="' + balancesheet[i].depreciation + '" maxlength="13" onblur="checkAmount(this.id)"/></td><td>' + returnBalanceSheetType(i) + '</td><td><button type="button" class="btn btn-primary bluebtn"  onclick="updateBalanceSheetItem(' + i + ')">Update</button></td><td><button type="button" class="btn btn-danger"  onclick="removeBalanceSheetItem(' + i + ')">Remove</button></td></tr>';
            }
            $("#balanceSheetTblBody").html(html);
            for (i = 0; i < len; i++) {
                $('select#bstype_' + i + '>option:eq(' + balancesheet[i].type + ')').prop('selected', true);
                if (balancesheet[i].type !== "0") {
                    $("#bsdepreciation_" + i).attr("disabled", "enabled");
                }
            }
        }
    });
}
function returnBalanceSheetType(i) {
    var html = '<select id="bstype_' + i + '"  class="form-control" onclick="balancesheetdropdownblur(this.id)"><option>Fixed Assets</option><option>Current Assets</option><option>Current Liabilities</option><option>Long-term Liabilities</option><option>Owner&apos;s Equity</option></select>';
    return html;
}
function balancesheetdropdownblur(id) {
    var index = $("#" + id)[0].selectedIndex;
    var arr = id.split("_");

    if (index !== 0) {
        $("#bsdepreciation_" + arr[1]).attr("disabled", "enabled");
        $("#bsdepreciation_" + arr[1]).val("0.00");
    } else {
        $("#bsdepreciation_" + arr[1]).removeAttr("disabled");
    }
}
function updateBalanceSheetItem(id) {
    var item = $("#bsitem_" + id).val().trim();
    var amount = $("#bsamount_" + id).val();
    var depreciation = $("#bsdepreciation_" + id).val();
    var type = $("#bstype_" + id)[0].selectedIndex;
    $.post("../php/set/set.php", {action: 'updateBalanceSheetItem', item: item, amount: amount, depreciation: depreciation, type: type, id: balancesheet[id].id}, function (result) {
        if (result === "0") {
            ErrorAlert("Server error");
        } else {
            SuccessAlert("Updated.");
        }
    });
}
function removeBalanceSheetItem(id) {
    $.post("../php/set/set.php", {action: 'removeBalanceSheetItem', id: balancesheet[id].id}, function (result) {
        if (result === "0") {
            ErrorAlert("Server error");
        } else {
            SuccessAlert("Balance sheet item is removed.");
            loadBalanceSheetTable();
        }
    });
}
function showGeneratedBalanceSheet() {
    $("#divBalanceSheet").show();
    $.post("../php/set/set.php", {action: 'showGeneratedBalanceSheet'}, function (result) {
        if (result === "0") {
            ErrorAlert("Unable to load balance sheet.");
        } else {
            //assettbl || liabilitiestbl
            var obj = $.parseJSON(result);
            var html0 = "";
            var html1 = "";
            var html2 = "";
            var html3 = "";
            var html4 = ""; // store the html for 5 types
            var fixedassetAmt = 0.00;
            var currentassetAmt = 0.00;
            var currentlibAmt = 0.00;
            var longtermlibAmt = 0.00;
            var ownerEquityAmt = 0.00;
            var len = obj.length;
            for (var i = 0; i < len; i++) {
                switch (obj[i].type) {
                    case "0":
                        if (obj[i].depreciation === "0.00") {
                            html0 += generateHtmlForBalanceSheet(obj[i].item, obj[i].amount, null);
                            fixedassetAmt = sum(fixedassetAmt + "+" + parseFloat(obj[i].amount));
                        } else {
                            html0 += generateHtmlForBalanceSheet(obj[i].item, obj[i].amount, obj[i].depreciation);
                            fixedassetAmt = sum(fixedassetAmt + "+" + parseFloat(obj[i].amount) + "+-" + obj[i].depreciation);
                        }
                        break;
                    case "1":
                        html1 += generateHtmlForBalanceSheet(obj[i].item, obj[i].amount, null);
                        currentassetAmt = sum(currentassetAmt + "+" + parseFloat(obj[i].amount));
                        break;
                    case "2":
                        html2 += generateHtmlForBalanceSheet(obj[i].item, obj[i].amount, null);
                        currentlibAmt = sum(currentlibAmt + "+" + parseFloat(obj[i].amount));
                        break;
                    case "3":
                        html3 += generateHtmlForBalanceSheet(obj[i].item, obj[i].amount, null);
                        longtermlibAmt = sum(longtermlibAmt + "+" + parseFloat(obj[i].amount));
                        break;
                    case "4":
                        html4 += generateHtmlForBalanceSheet(obj[i].item, obj[i].amount, null);
                        ownerEquityAmt = sum(ownerEquityAmt + "+" + parseFloat(obj[i].amount));
                        break;
                    case "5":
                        console.log(obj[i].amount);
                        html4 += generateProfitLossHtml(parseFloat(obj[i].amount));
                        ownerEquityAmt = sum(ownerEquityAmt + "+" + parseFloat(obj[i].amount));
                        break;
                }
            }
            $("#assettd").html("<table border='0' id='assettbl'><tr><th class='strong-underline'>Fixed assets</th></tr>" + html0 + "<tr><th>Total fixed assets</th><th>" + formatCurrency(fixedassetAmt) + "</th></tr><tr><td></td></tr><tr><th class='strong-underline'>Current assets</th></tr>" + html1 + "<tr><th>Total current assets</th><th>" + formatCurrency(currentassetAmt) + "</th></tr></table>");
            $("#liabilitiestd").html("<table border='0' id='libtbl'><tr><th class='strong-underline'>Current liabilties</th></tr>" + html2 + "<tr><th>Total current liabilties</th><th>" + formatCurrency(currentlibAmt) + "</th></tr><tr><th class='strong-underline'>Long-term liabilties</th></tr>" + html3 + "<tr><th>Total long-term liabilties</th><th>" + formatCurrency(longtermlibAmt) + "</th></tr><tr><th class='strong-underline'>Owner's equity</th></tr>" + html4 + "<tr><th>Total owner's equity</th><th>" + formatCurrency(ownerEquityAmt) + "</th></tr></table>");
            $("#assetAmt").html(formatCurrency(sum(fixedassetAmt + "+" + currentassetAmt)));
            $("#libAmt").html(formatCurrency(sum(currentlibAmt + "+" + longtermlibAmt + "+" + ownerEquityAmt)));
        }
    });
}
function generateHtmlForBalanceSheet(item, amount, depreciation) {
    if (depreciation === null) {
        return "<tr><td>" + item + "</td><td>" + formatCurrency(amount) + "</td></tr>";
    } else {
        return "<tr><td>" + item + "</td><td>" + formatCurrency(amount) + "</td></tr><tr><td>Less Depreciation</td><td>" + depreciation + "</td></tr>";
    }

}
function generateProfitLossHtml(amount) {
    if (amount >= 0) {
        return "<tr><td>Net profit</td><td>" + formatCurrency(amount) + "</td></tr>";
    } else {
        return "<tr><td>Net loss</td><td>" + formatCurrency(amount) + "</td></tr>";
    }
}
function displayGenerateScreen(){
    $("#divGenerate").show();
}
function downloadFile(){
    var fileName = $("#txtFileName").val();
   if (fileName ===""){
       fileName="accounts";
   }
    var win = window.open('../php/set/download.php?filename='+fileName, '_blank');
if(win){
    win.focus();
}else{
    //Browser has blocked it
    alert('Please allow popups for this site');
}
}