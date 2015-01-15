<?php

include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/db.php";

class DBDownload {

    public function getBasicInfo($user, $set, &$fullname, &$setname) {
        $code = 1;
        $database = new DB();
        try {

            $database->query("SELECT fullname FROM accounting.user WHERE `uid` = :user;");
            $database->bind(":user", $user);
            $fullname = $database->single();
            $database->query("SELECT name,companyname,IFNULL(DATE_FORMAT(`yearstarted`,'%d-%m-%Y'),'') yearstarted,IFNULL(DATE_FORMAT(`yearended`,'%d-%m-%Y'),'') yearended, regno ,bankstatement FROM accounting.set WHERE `setid` = :set;");
            $database->bind(":set", $set);
            $setname = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getLedgerInfoBankStatement($set,&$allledgers,&$ledgername,&$ledgersDetail,&$balancesheet,&$bankstatement) {
        $code = 1;
        $database = new DB();
        try {
            //get all ledgers for use later
            $database->query("SELECT ledgerid,IFNULL(DATE_FORMAT(`date`,'%e-%b-%Y'), '') date, IFNULL(refno, '') refno, IFNULL(invoiceno, '') invoiceno, IFNULL(particulars,'') particulars, IFNULL(ledgerinfo.`name`,'') ledger, IFNULL(debit,'') debit, IFNULL(credit,'') credit FROM ledger LEFT JOIN ledgerinfo on ledger.ledgerinfoid = ledgerinfo.ledgerinfoid WHERE ledger.setid=:set ORDER BY ledger.date ASC");
            $database->bind(":set", $set);
            $allledgers = $database->resultset();
            //get all ledgers name
             $database->query("SELECT `name` FROM accounting.ledgerinfo WHERE `setid` = :set ORDER BY `name` ASC");
            $database->bind(":set", $set);
            $ledgername = $database->resultset();
            //get ledger amount for 
            $database->query("SELECT SUM(IFNULL(l.`credit`,0))amount, i.`name` FROM ledger l, ledgerinfo i WHERE  i.`type` = '0' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` GROUP BY `name`;");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($ledgersDetail, $result);
            $database->query("SELECT SUM(IFNULL(l.`debit`,0))amount, i.`name` FROM ledger l, ledgerinfo i WHERE  i.`type` = '1' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` GROUP BY `name`;");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($ledgersDetail, $result);
            $database->query("SELECT SUM(IFNULL(l.`debit`,0))amount, i.`name` FROM ledger l, ledgerinfo i WHERE  i.`type` = '2' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` GROUP BY `name`;");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($ledgersDetail, $result);
             $database->query("SELECT IFNULL((SELECT SUM(IFNULL(l.`credit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '0' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ) - (SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '1' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid`),0) c");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($ledgersDetail, $result);
            $database->query("SELECT ifnull((SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '2' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid`),0) c");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($ledgersDetail, $result);
            $database->query("SELECT IFNULL((SELECT SUM(IFNULL(l.`credit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '0' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ) - (SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '1' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid`) - (
SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '2' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ),0) c");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($ledgersDetail, $result);
            //balancesheet
            $database->query("SELECT `item`,`amount`,`depreciation` FROM accounting.balancesheet WHERE `setid` = :set && `type` = :type ORDER BY `type`");
            $database->bind(":set", $set);
            $database->bind(":type", 0);
            $row = $database->resultset();
            array_push($balancesheet,$row);
            
            $database->query("SELECT `item`,`amount`,`depreciation` FROM accounting.balancesheet WHERE `setid` = :set && `type` = :type ORDER BY `type`");
            $database->bind(":set", $set);
            $database->bind(":type", 1);
            $row = $database->resultset();
            array_push($balancesheet,$row);
            
            $database->query("SELECT `item`,`amount`,`depreciation` FROM accounting.balancesheet WHERE `setid` = :set && `type` = :type ORDER BY `type`");
            $database->bind(":set", $set);
            $database->bind(":type", 2);
            $row = $database->resultset();
            array_push($balancesheet,$row);
            
            $database->query("SELECT `item`,`amount`,`depreciation` FROM accounting.balancesheet WHERE `setid` = :set && `type` = :type ORDER BY `type`");
            $database->bind(":set", $set);
            $database->bind(":type", 3);
            $row = $database->resultset();
            array_push($balancesheet,$row);
            
            $database->query("SELECT `item`,`amount`,`depreciation` FROM accounting.balancesheet WHERE `setid` = :set && `type` = :type ORDER BY `type`");
            $database->bind(":set", $set);
            $database->bind(":type", 4);
            $row = $database->resultset();
            array_push($balancesheet,$row);
            
            $database->query("SELECT IFNULL((SELECT SUM(IFNULL(l.`credit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '0' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ) - (SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '1' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid`) - (
SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '2' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ),0) c");
            $database->bind(":set", $set);
            $row = $database->single();
            $c = array("amount"=>$row["c"],"type"=>"5");
            array_push($balancesheet,$c); 
            //bank statement
             $database->query("SELECT `bankstatement` FROM accounting.`set` WHERE `setid`= :set;");
            $database->bind(":set", $set);
            $result = $database->single();
            $bankstatement = $result["bankstatement"];
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

}
