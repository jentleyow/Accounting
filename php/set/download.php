<?php

ini_set('include_path', ini_get('include_path') . ';../Classes/');
include 'classes\PHPExcel.php';
include 'classes\PHPExcel\Writer\Excel2007.php';
include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/log/log.php";
include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/dbDownload.php";
session_start();

if (isset($_SESSION["user"]) && isset($_SESSION["set"]) && isset($_GET["filename"])) {
    try {
        $download = new Download();
        $download->generateFile($_SESSION["user"], $_SESSION["set"], $_GET["filename"]);
    } catch (Exception $ex) {
        $log = new Log();
        $log->writeLog($ex);
        echo "Unable to download file due to error.";
    }
} else {

    header("Location: http://albm/");
    die();
}

class Download {

    private $obj;
    private $db;
    private $fullname; //user full name
    private $setname;
    private $companyname;
    private $regno;
    private $yearstarted;
    private $yearended;
    private $headerText; //header text to show the period from start to end date.
    private $bankstatement = array();
    private $allledgers = array();
    private $ledgername = array();
    private $ledgersDetail = array(); //array containing name and amount of each ledger.
    private $sortedLedger = array(); //array contained ledger that is sorted.
    private $balancesheet = array();

    function __construct() {
        $this->log = new Log();
        $this->obj = new PHPExcel();
        $this->db = new DBDownload();
    }

    public function writeError($error) {
        $this->log->writeLog($error);
        return 0;
    }

    public function generateFile($user, $set, $filename) {
        try {
            $this->getBasicInfo($user, $set); //generate file info
            $this->getLedgerInfoBankStatement($set);
            $this->addBasicFileInfo();
            $this->addIncomeStatement();
            $this->addBalanceSheet();
            $this->addBankStatement();
            $this->addGeneralLedger();
            $this->addIndividualLedger();
            $this->generateExcelFile($filename);
        } catch (Exception $ex) {
            $this->writeError($ex);
        }
    }

    private function addBasicFileInfo() {
        $this->obj->getProperties()->setCreator($this->fullname);
        $this->obj->getProperties()->setLastModifiedBy($this->fullname);
        $this->obj->getProperties()->setTitle($this->setname);
        $this->obj->getProperties()->setSubject("Accounts");
        $this->obj->getProperties()->setDescription("Accounts generated using myAccounting.");
    }

    private function addIncomeStatement() {
        $this->obj->setActiveSheetIndex(0);
        $this->setTitle("Income Statement");
        $this->generateHeader("Income statement");
        $currentCell = 4;
        $this->obj->getActiveSheet()->getColumnDimension('C')->setWidth(20);
        $this->obj->getActiveSheet()->getColumnDimension('D')->setWidth(20);
        //revenue
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Revenue");
        $this->underlineBoldCell("A" . $currentCell);
        $len = count($this->ledgersDetail[0]);
        for ($i = 0; $i < $len; $i++) {
            $currentCell++;
            $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, $this->ledgersDetail[0][$i]["name"]);
            $this->setCellCurrency("D" . $currentCell);
            $this->obj->getActiveSheet()->setCellValue("D" . $currentCell, $this->ledgersDetail[0][$i]["amount"]);
        }
        //cost
        $currentCell = $currentCell + 2;
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Less cost of goods/services");
        $this->underlineBoldCell("A" . $currentCell);
        $len = count($this->ledgersDetail[1]);
        for ($i = 0; $i < $len; $i++) {
            $currentCell++;
            $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, $this->ledgersDetail[1][$i]["name"]);
            $this->setCellCurrency("D" . $currentCell);
            $this->obj->getActiveSheet()->setCellValue("D" . $currentCell, $this->ledgersDetail[1][$i]["amount"]);
        }
        //Gross Profit
        $currentCell = $currentCell + 2;
        $this->obj->getActiveSheet()->getStyle($currentCell)->getFont()->setBold(true);
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Gross Profit");
        $this->obj->getActiveSheet()->SetCellValue("D" . $currentCell, $this->ledgersDetail[3][0]["c"]);
        $this->setCellCurrency("D" . $currentCell);
        //operating
        $currentCell = $currentCell + 2;
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Less operational expenses");
        $this->underlineBoldCell("A" . $currentCell);
        $len = count($this->ledgersDetail[2]);
        for ($i = 0; $i < $len; $i++) {
            $currentCell++;
            $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, $this->ledgersDetail[2][$i]["name"]);
            $this->setCellCurrency("D" . $currentCell);
            $this->obj->getActiveSheet()->setCellValue("D" . $currentCell, $this->ledgersDetail[2][$i]["amount"]);
        }
        //total operating expenses
        $currentCell = $currentCell + 2;
        $this->obj->getActiveSheet()->getStyle($currentCell)->getFont()->setBold(true);
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Total operating expenses");
        $this->obj->getActiveSheet()->SetCellValue("D" . $currentCell, $this->ledgersDetail[4][0]["c"]);
        $this->setCellCurrency("D" . $currentCell);
        //net profit/loss
        $currentCell = $currentCell + 2;
        $this->obj->getActiveSheet()->getStyle($currentCell)->getFont()->setBold(true);
        $profitloss = (int) $this->ledgersDetail[5][0]["c"];
        if ($profitloss < 0) {
            $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Net Loss");
        } else {
            $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell, "Net Profit");
        }
        $this->obj->getActiveSheet()->SetCellValue("D" . $currentCell, $this->ledgersDetail[5][0]["c"]);
        $this->setCellCurrency("D" . $currentCell);
    }

    private function addBalanceSheet() {
        $this->obj->createSheet(NULL, 1);
        $this->obj->setActiveSheetIndex(1);
        $this->obj->getActiveSheet()->getColumnDimension('E')->setWidth(3); //set column cell width for E
        $this->generateHeader("Balance sheet");
        $this->setTitle("Balance sheet");
        $this->obj->getActiveSheet()->getColumnDimension('D')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('F')->setWidth(13);
       //fixed assets
        $currentCell = 4;
        $this->returnBalanceSheetTypeTitle($currentCell, "Fixed Assets");
        $fixedAssetAmt = 0.00;
        $this->addBsFixedAsset($this->balancesheet[0],$currentCell,$fixedAssetAmt);
        //current assets
        $currentCell = $currentCell+2;
        $this->returnBalanceSheetTypeTitle($currentCell, "Current Assets");
        $currentAssetAmt = 0.00;
        $this->addBsCurrentAsset($this->balancesheet[1],$currentCell,$currentAssetAmt);
        //total assets
        $currentCell = $currentCell+2;
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell,"Total Assets");
        $this->boldCell("A" . $currentCell);
        $this->obj->getActiveSheet()->SetCellValue("F" . $currentCell, ($fixedAssetAmt+$currentAssetAmt));
        $this->boldCell("F" . $currentCell);
        $this->setCellCurrency("F" . $currentCell);
        $this->totalBorder("F" . $currentCell);
        //Important!!! long-term liab swap with current liab in position|| 2-> 3 , 3->2
        //long-term liab
        $currentCell = $currentCell+2;
        $this->returnBalanceSheetTypeTitle($currentCell, "Long-term Liabilties");
        $longTermLiabAmt = 0.00;
        $this->addBsLongTermLiab($this->balancesheet[3],$currentCell,$longTermLiabAmt);
        //current Liab
        $currentCell = $currentCell+2;
        $this->returnBalanceSheetTypeTitle($currentCell, "Current Liabilties");
        $currentLiabAmt = 0.00;
        $this->addBsCurrentLiab($this->balancesheet[2],$currentCell,$currentLiabAmt,$longTermLiabAmt);
        //Owner'equity
        $currentCell = $currentCell+2;
        $this->returnBalanceSheetTypeTitle($currentCell, "Owner's Equity");
        $ownerEquityAmt = 0.00;
        $this->addBsOwnerEquity($this->balancesheet[4],$currentCell,$ownerEquityAmt,(float)$this->balancesheet[5]["amount"]);
        //Total Liabilities & Equities
        $currentCell = $currentCell+2;
        $this->obj->getActiveSheet()->SetCellValue("A" . $currentCell,"Total Liabilities & Equities");
        $this->boldCell("A" . $currentCell);
        $this->obj->getActiveSheet()->SetCellValue("F" . $currentCell, ($longTermLiabAmt+$currentLiabAmt+$ownerEquityAmt));
        $this->boldCell("F" . $currentCell);
        $this->setCellCurrency("F" . $currentCell);
        $this->totalBorder("F" . $currentCell);
    }
private function addBsFixedAsset($item,&$cell,&$amt){
    $len = count($item);
        for ($i = 0; $i < $len; $i++) {
            $cell++;
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, $item[$i]["item"]);
            $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $item[$i]["amount"]);
            $amt += (float)$item[$i]["amount"];
            $this->setCellCurrency("F" . $cell);
            if ($item[$i]["depreciation"]!="0.00"){
                $cell++;
               $this->obj->getActiveSheet()->SetCellValue("B" . $cell, "Less Depreciation");
            $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $item[$i]["depreciation"]);
            $amt -=(float)$item[$i]["depreciation"];
            $this->setCellCurrency("F" . $cell);
            }
        }
        $cell++;
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $amt);
        $this->setCellCurrency("F" . $cell);
        $this->topBorder("F" . $cell);
}
private function addBsCurrentAsset($item,&$cell,&$amt){
    $len = count($item);
        for ($i = 0; $i < $len; $i++) {
            $cell++;
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, $item[$i]["item"]);
            $this->obj->getActiveSheet()->SetCellValue("D" . $cell, $item[$i]["amount"]);
            $amt += (float)$item[$i]["amount"];
            $this->setCellCurrency("D" . $cell);
        }
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $amt);
        $this->setCellCurrency("F" . $cell);
        $cell++;
        $this->topBorder("F" . $cell);
}    
private function addBsLongTermLiab($item,&$cell,&$amt){
    $len = count($item);
        for ($i = 0; $i < $len; $i++) {
            $cell++;
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, $item[$i]["item"]);
            $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $item[$i]["amount"]);
            $amt += (float)$item[$i]["amount"];
            $this->setCellCurrency("F" . $cell);
        }
        $cell++;
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $amt);
        $this->setCellCurrency("F" . $cell);
        $this->topBorder("F" . $cell);
}
private function addBsCurrentLiab ($item,&$cell,&$amt,$longTermLiabAmt){
    $len = count($item);
        for ($i = 0; $i < $len; $i++) {
            $cell++;
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, $item[$i]["item"]);
            $this->obj->getActiveSheet()->SetCellValue("D" . $cell, $item[$i]["amount"]);
            $amt += (float)$item[$i]["amount"];
            $this->setCellCurrency("D" . $cell);
        }
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $amt);
        $this->setCellCurrency("F" . $cell);
        $cell++;
        $this->topBorder("F" . $cell);
        //current + long-term liab
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, ($amt+$longTermLiabAmt));
         $this->setCellCurrency("F" . $cell );
} 
private function addBsOwnerEquity ($item,&$cell,&$amt,$netAmount){
    $len = count($item);
        for ($i = 0; $i < $len; $i++) {
            $cell++;
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, $item[$i]["item"]);
            $this->obj->getActiveSheet()->SetCellValue("D" . $cell, $item[$i]["amount"]);
            $amt += (float)$item[$i]["amount"];
            $this->setCellCurrency("D" . $cell);
        }
        //add net profit/loss
        $cell++;
        if ($netAmount<0){
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, "Net loss");
        }else{
            $this->obj->getActiveSheet()->SetCellValue("B" . $cell, "Net profit");
        }
        $this->obj->getActiveSheet()->SetCellValue("D" . $cell, $netAmount);
        $this->setCellCurrency("D" . $cell);
        $amt += $netAmount;
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $amt);
        $this->setCellCurrency("F" . $cell);
        $cell++;
        $this->topBorder("F" . $cell);
} 
    private function returnBalanceSheetTypeTitle($cell, $title) {
        $this->obj->getActiveSheet()->SetCellValue("A" . $cell, $title);
        $this->underlineBoldCell("A" . $cell);
    }

 
    private function addBankStatement() {
        $this->obj->createSheet(NULL, 2);
        $this->obj->setActiveSheetIndex(2);
        $this->obj->getActiveSheet()->getColumnDimension('A')->setWidth(14);
        $this->obj->getActiveSheet()->getColumnDimension('B')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('C')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('D')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('E')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('F')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('G')->setWidth(13);
        $this->obj->getActiveSheet()->getColumnDimension('H')->setWidth(13);
        $this->setTitle("Bank Book");
        $this->obj->getActiveSheet()->getStyle("A1:A2")->getFont()->setBold(true);
        $this->obj->getActiveSheet()->SetCellValue("A1", $this->companyname);
        $this->obj->getActiveSheet()->SetCellValue("A2", "Bank book" . $this->headerText);
        if (empty($this->yearended) == false) {
            $arrDate = $this->get12MonthsUsingYearEnded($this->yearended); //get the month & year and store in array using yearEnded
            $this->generateBankStatementSideCol(6); //generate the side with balance b/d, total deposit,etc.
            $this->generateBankStatementSideCol(17);
            $this->underline("B4:G4");
            $this->underline("B15:G15");
            $this->setCellCurrency("B6:G6");
            $this->setCellCurrency("B8:G8");
            $this->setCellCurrency("B10:G10");
            $this->setCellCurrency("B12:G12");
            $this->setCellCurrency("B17:G17");
            $this->setCellCurrency("B19:H19");
            $this->setCellCurrency("B21:H21");
            $this->setCellCurrency("B23:G23");
            $arrBs = json_decode($this->bankstatement, true);
            $cellCol = "B";
            $totalDepositA = 0.00;//total deposit for first 6 months
            $totalPaymentA = 0.00;//total payment for first 6 months
            for ($i = 0; $i < 6; $i++) {
                $this->generateBankStatementCol($cellCol, 4, $arrBs["bs"][$i], $arrDate[$i],$totalDepositA,$totalPaymentA);
                $cellCol++;
            }
            $cellCol = "B";
            $totalDepositB = 0.00;//total deposit for last 6 months
            $totalPaymentB = 0.00;//total payment for last 6 months
            for ($i = 6; $i < 12; $i++) {
                $this->generateBankStatementCol($cellCol, 15, $arrBs["bs"][$i], $arrDate[$i],$totalDepositB,$totalPaymentB);
                $cellCol++;
            }
            //Total deposit & payment
            $style = array(//for  total header
                'alignment' => array(
                    'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT,
                )
            );
            $this->obj->getActiveSheet()->getStyle("H15")->applyFromArray($style); //align the date to the right
            $this->obj->getActiveSheet()->SetCellValue("H15","Total");
            $this->underline("H15");
            $this->totalBorder("H23");
            $this->obj->getActiveSheet()->SetCellValue("H19",($totalDepositA+$totalDepositB));
            $this->obj->getActiveSheet()->SetCellValue("H21",($totalPaymentA+$totalPaymentB));
        }
    }

    private function generateBankStatementSideCol($cell) {
        $this->obj->getActiveSheet()->SetCellValue("A" . $cell, "Balance b/d");
        $this->obj->getActiveSheet()->SetCellValue("A" . ($cell + 2), "Total Deposits");
        $this->obj->getActiveSheet()->SetCellValue("A" . ($cell + 4), "Total Payments");
        $this->obj->getActiveSheet()->SetCellValue("A" . ($cell + 6), "Balance b/f");
    }

    private function generateBankStatementCol($cellCol, $cell, $arr, $date,&$deposit,&$payment) {//$cell->no, $cellcol->alphabet
        $this->obj->getActiveSheet()->SetCellValue($cellCol . $cell, $date);
        $this->obj->getActiveSheet()->SetCellValue($cellCol . ($cell + 2), $arr["a"]);
        $this->obj->getActiveSheet()->SetCellValue($cellCol . ($cell + 4), $arr["b"]);
        $this->obj->getActiveSheet()->SetCellValue($cellCol . ($cell + 6), $arr["c"]);
        $this->totalBorder($cellCol . ($cell + 8));
        $total = (float) $arr["a"] + (float) $arr["b"] - (float) $arr["c"];
        $this->obj->getActiveSheet()->SetCellValue($cellCol . ($cell + 8), $total);
        $style = array(
            'alignment' => array(
                'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT,
            )
        );

        $this->obj->getActiveSheet()->getStyle($cellCol . $cell)->applyFromArray($style); //align the date to the right
        $deposit += (float) $arr["b"];
        $payment += (float) $arr["c"];
    }

    private function addGeneralLedger() {
        $this->obj->createSheet(NULL, 3);
        $this->obj->setActiveSheetIndex(3);
        $this->generateHeader("General Ledger");
        $this->setTitle("General Ledger");
        $this->generateLedgerTableHeader();
        $currentCell = 6;
        $len = count($this->allledgers);
        $this->setCellCurrency("F" . $currentCell . ":F" . ($currentCell + $len));
        $this->setCellCurrency("G" . $currentCell . ":G" . ($currentCell + $len));
        for ($i = 0; $i < $len; $i++) {
            $this->generateGeneralLedgerRow($this->allledgers[$i], $currentCell);
            $currentCell++;
        }
    }

    private function generateLedgerTableHeader() {
        $this->obj->getActiveSheet()->getStyle("A4:G4")->getFont()->setBold(true);
        $this->obj->getActiveSheet()->SetCellValue("A4", "Date");
        $this->obj->getActiveSheet()->SetCellValue("B4", "Ref no.");
        $this->obj->getActiveSheet()->SetCellValue("C4", "Invoice no");
        $this->obj->getActiveSheet()->SetCellValue("D4", "Particulars");
        $this->obj->getActiveSheet()->SetCellValue("E4", "Ledger");
        $this->obj->getActiveSheet()->SetCellValue("F4", "Debit");
        $this->obj->getActiveSheet()->SetCellValue("G4", "Credit");
    }

    private function generateGeneralLedgerRow($ledger, $cell) {
        $this->generateLedgerDetail($ledger, $cell);
        //method below search for common ledger and store into array
        $len = count($this->ledgername);
        for ($i = 0; $i < $len; $i++) {
            if ($this->ledgername[$i]["name"] == $ledger["ledger"]) {
                array_push($this->sortedLedger[$i], $ledger);
                break;
            }
        }
    }

    private function generateLedgerDetail($ledger, $cell) {
        $this->obj->getActiveSheet()->SetCellValue("A" . $cell, $ledger["date"]);
        $this->obj->getActiveSheet()->SetCellValue("B" . $cell, $ledger["refno"]);
        $this->obj->getActiveSheet()->SetCellValue("C" . $cell, $ledger["invoiceno"]);
        $this->obj->getActiveSheet()->SetCellValue("D" . $cell, $ledger["particulars"]);
        $this->obj->getActiveSheet()->SetCellValue("E" . $cell, $ledger["ledger"]);
        $this->obj->getActiveSheet()->SetCellValue("F" . $cell, $ledger["debit"]);
        $this->obj->getActiveSheet()->SetCellValue("G" . $cell, $ledger["credit"]);
    }

    private function addIndividualLedger() {
        $len = count($this->ledgername);
        $sheet = 4;
        for ($i = 0; $i < $len; $i++) {
            $this->obj->createSheet(NULL, $sheet);
            $this->obj->setActiveSheetIndex($sheet);
            $this->generateHeader("General Ledger");
            $this->setTitle($this->ledgername[$i]["name"]);
            $this->generateLedgerTableHeader();
            $currentCell = 6;
            $length = count($this->sortedLedger[$i]);
            $this->setCellCurrency("F" . $currentCell . ":F" . ($currentCell + $length));
            $this->setCellCurrency("G" . $currentCell . ":G" . ($currentCell + $length));
            $debitTotal = 0.00;
            $creditTotal = 0.00;
            for ($j = 0; $j < $length; $j++) {
                $this->generateLedgerDetail($this->sortedLedger[$i][$j], $currentCell);
                $currentCell++;
                $this->calculateLedger($this->sortedLedger[$i][$j]["debit"], $debitTotal);
                $this->calculateLedger($this->sortedLedger[$i][$j]["credit"], $creditTotal);
            }
            $currentCell = $currentCell + 2;
            $this->obj->getActiveSheet()->getStyle("E" . $currentCell . ":" . "G" . $currentCell)->getFont()->setBold(true);
            $this->obj->getActiveSheet()->SetCellValue("E" . $currentCell, "Total");
            if ($debitTotal != 0.00) {
                $this->obj->getActiveSheet()->SetCellValue("F" . $currentCell, $debitTotal);
                $this->setCellCurrency("F" . $currentCell);
            }
            if ($creditTotal != 0.00) {
                $this->obj->getActiveSheet()->SetCellValue("G" . $currentCell, $creditTotal);
                $this->setCellCurrency("G" . $currentCell);
            }
            $sheet++;
        }
    }

    private function calculateLedger($amt, &$total) {
        if ($amt != "") {
            $total +=(float) $amt;
        }
    }

    //Database functions
    private function getBasicInfo($user, $set) {//get fullname,setname,yearended, bankstatement json
        try {
            $code = $this->db->getBasicInfo($user, $set, $fullname, $setname);
            $this->fullname = $fullname["fullname"];
            $this->setname = $setname[0]["name"];
            $this->companyname = $setname[0]["companyname"];
            $this->regno = $setname[0]["regno"];
            $this->yearstarted = $setname[0]["yearstarted"];
            $this->yearended = $setname[0]["yearended"];
            $this->bankstatement = $setname[0]["bankstatement"];
            if ($code == 0) {
                $this->writeError("Database error");
            }
            if ($this->yearstarted == "") {
                if ($this->yearended == "") {
                    $this->headerText = "";
                } else {
                    $this->headerText = " for the period ended " . $this->formatDateForHeader($this->yearended);
                }
            } else {
                $this->headerText = " for the period " . $this->formatDateForHeader($this->yearstarted) . " to " . $this->formatDateForHeader($this->yearended);
            }
        } catch (Exception $ex) {
            $this->writeError($ex);
        }
    }

    private function getLedgerInfoBankStatement($set) {//get all ledger information including credit/debit & bank statement,balance sheet
        $this->db->getLedgerInfoBankStatement($set, $this->allledgers, $this->ledgername, $this->ledgersDetail, $this->balancesheet, $this->bankstatement);
        $len = count($this->ledgername);
        for ($i = 0; $i < $len; $i++) {
            $a = array();
            array_push($this->sortedLedger, $a);
        }
    }

    //Special functions
    private function setTitle($title) {
        $this->obj->getActiveSheet()->setTitle($title);
    }

    private function generateHeader($type) {
        $this->obj->getActiveSheet()->getStyle('A1:A2')->getFont()->setBold(true);
        $this->obj->getActiveSheet()->getStyle('A1:A2')->getFont()->setSize(14);
        $this->obj->getActiveSheet()->SetCellValue('A1', $this->companyname . ' ' . $this->regno);
        $this->obj->getActiveSheet()->SetCellValue('A2', $type . $this->headerText);
    }

    private function formatDateForHeader($date) {
        if ($date !== "") {
            $arr = explode("-", $date);
            return $arr[0] . " " . $this->returnFullMonthName($arr[1]) . " " . $arr[2];
        } else {
            return "";
        }
    }

    private function get12MonthsUsingYearEnded($date) {
        $arr = explode("-", $date);
        $arrDate = array();
        $month = (int) $arr[1];
        $year = (int) substr($arr[2], 2);
        array_push($arrDate, $this->returnPartMonthName((string) $month) . "-" . $year);
        for ($i = 0; $i < 11; $i++) {
            $month--;
            if ($month == 0) {
                $year--;
                $month = 12;
            }
            array_push($arrDate, $this->returnPartMonthName((string) $month) . "-" . $year);
        }
        $arrDate = array_reverse($arrDate);
        return $arrDate;
    }

    private function returnPartMonthName($month) {//return part month name using number
        switch ($month) {
            case "1":
                return "Jan";
            case "2":
                return "Feb";
            case "3":
                return "Mar";
            case "4":
                return "Apr";
            case "5":
                return "May";
            case "6":
                return "Jun";
            case "7":
                return "Jul";
            case "8":
                return "Aug";
            case "9":
                return "Sep";
            case "10":
                return "Oct";
            case "11":
                return "Nov";
            case "12":
                return "Dec";
        }
    }

    private function returnFullMonthName($month) {//return full month name using number
        switch ($month) {
            case "1":
                return "January";
            case "2":
                return "February";
            case "3":
                return "March";
            case "4":
                return "April";
            case "5":
                return "May";
            case "6":
                return "June";
            case "7":
                return "July";
            case "8":
                return "August";
            case "9":
                return "September";
            case "10":
                return "October";
            case "11":
                return "November";
            case "12":
                return "December";
        }
    }

    private function underlineBoldCell($cell) {
        $styleArray = array(
            'font' => array(
                'underline' => PHPExcel_Style_Font::UNDERLINE_SINGLE
            )
        );
        $this->obj->getActiveSheet()->getStyle($cell)->getFont()->setBold(true);
        $this->obj->getActiveSheet()->getStyle($cell)->applyFromArray($styleArray);
    }
    private function boldCell($cell){
         $styleArray = array(
            'font' => array(
                'underline' => PHPExcel_Style_Font::UNDERLINE_SINGLE
            )
        );
        $this->obj->getActiveSheet()->getStyle($cell)->getFont()->setBold(true);
    }

    private function setCellCurrency($cell) {
        $this->obj->getActiveSheet()->getStyle($cell)->getNumberFormat()->setFormatCode('_("$"* #,##0.00_);_("$"* \(#,##0.00\);_("$"* "-"??_);_(@_)');
    }

    private function underline($cell) {
        $styleArray = array(
            'font' => array(
                'underline' => PHPExcel_Style_Font::UNDERLINE_SINGLE
            )
        );
        $this->obj->getActiveSheet()->getStyle($cell)->applyFromArray($styleArray);
    }

    private function topBorder($cell) {
        $styleArray = array(
            'borders' => array(
                'top' => array(
                    'style' => PHPExcel_Style_Border::BORDER_THIN,
                )
            )
        );
        $this->obj->getActiveSheet()->getStyle($cell)->applyFromArray($styleArray);
    }
    private function totalBorder($cell){
         $styleArray = array(
            'borders' => array(
                'top' => array(
                    'style' => PHPExcel_Style_Border::BORDER_THIN,
                ), 'bottom' => array(
                    'style' => PHPExcel_Style_Border::BORDER_DOUBLE,
                )
            )
        );
        $this->obj->getActiveSheet()->getStyle($cell)->applyFromArray($styleArray);
    }

    private function generateExcelFile($filename) {
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment;filename="' . $filename . '.xlsx"');
        header('Cache-Control: max-age=0');
        $objWriter = new PHPExcel_Writer_Excel2007($this->obj);
        $objWriter->save('php://output');
    }

}
