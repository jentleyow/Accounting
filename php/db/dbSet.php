<?php

include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/db.php";

class DbSet {

    public function addSet($setName, $uid) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("INSERT INTO `accounting`.`set` (`name`, `date`,`bankstatement`) VALUES (:name, Now(),:bankstatement);");
            $database->bind(":name", $setName);
            $bankstatement = '{
"bs":[
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
}
]
}';
            $database->bind(":bankstatement", $bankstatement);
            $database->execute();
            $id = $database->lastInsertId();
            $database->query("SELECT `sets` FROM accounting.user WHERE uid = :uid");
            $database->bind(":uid", $uid);
            $row = $database->single();
            if ($row["sets"] == "") { // empty row
                $row["sets"] = $id;
            } else {
                $row["sets"] .= "," . $id;
            }
            $database->query("UPDATE `accounting`.`user` SET `sets`=:sets WHERE `uid`=:uid;");
            $database->bind(":sets", $row["sets"]);
            $database->bind(":uid", $uid);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getAllSet($uid, &$arr) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT sets FROM accounting.user WHERE uid = :uid;");
            $database->bind(":uid", $uid);
            $row = $database->single();
            if ($row["sets"] != "") {
                $sets = explode(",", $row["sets"]);
                $sql = "";
                $len = sizeof($sets);
                for ($i = 0; $i < $len; $i++) {
                    $sql .= "||`setid` = " . $sets[$i];
                }
                $sql = substr($sql, 2);  //remove "||" 
                $database->query("SELECT `setid`,`name`,IFNULL(DATE_FORMAT(`date`,'%d-%m-%Y, %H:%i'),'') date FROM `set` WHERE " . $sql . " ORDER BY `date` DESC");
                $arr = $database->resultset();
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function openSet($id) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT count(setid) c FROM accounting.`set` WHERE setid=:id");
            $database->bind(":id", $id);
            $row = $database->single();
            if ($row[c] == "1") {
                session_start();
                $_SESSION["set"] = $id;
                $database->query("UPDATE `accounting`.`set` SET `date`=NOW() WHERE `setid`=:id;");
                $database->bind(":id", $id);
                $database->execute();
            } else {
                $code = 0;
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function updateSetName($id, $setName) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("UPDATE `accounting`.`set` SET `name`=:setName, `date`=Now() WHERE `setid`=:id;");
            $database->bind(":id", $id);
            $database->bind(":setName", $setName);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function removeSet($id) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("start transaction;DELETE FROM `accounting`.`set` WHERE `setid`=:id;DELETE FROM `accounting`.`ledger` WHERE `setid`=:id;DELETE FROM `accounting`.`balancesheet` WHERE `setid`=:id;DELETE FROM `accounting`.`ledger` WHERE `setid`=:id;DELETE FROM `accounting`.`ledgerinfo` WHERE `setid`=:id;");
            $database->bind(":id", $id);
            $database->execute();
            $database->query("SELECT uid,sets FROM accounting.user;");
            $rows = $database->resultset();
            $len = sizeof($rows);
            for ($i = 0; $i < $len; $i++) {
                if ($rows[$i]["sets"] == "") {
                    
                } else {
                    $arr = explode(",", $rows[$i]["sets"]);
                    $length = sizeof($arr);
                    for ($j = 0; $j < $length; $j++) {
                        if ($arr[$j] == $id) {
                            unset($arr[$j]);
                            $output = implode(",", $arr);
                            $database->query("UPDATE `accounting`.`user` SET `sets`=:sets WHERE `uid`=:uid;Commit;");
                            $database->bind(":uid", $rows[$i]["uid"]);
                            $database->bind(":sets", $output);
                            $database->execute();
                            break;
                        }
                    }
                }
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function shareSet($id, $username, $type) {//type->0 share , type->1 unshare
        $code = 1; //0->db problem, 1-> success for share, 2-> user no exist, 3->set is ahared already, 4 unable to unshare as nothing to remove., 5-> success for unshare
        $database = new DB();
        try {
            $database->query("SELECT count(`username`) c FROM accounting.user WHERE username = :username LIMIT 1");
            $database->bind(":username", $username);
            $row = $database->single();
            if ($row == "0") {
                $code = 2;
            } else {
                $database->query("SELECT `sets` FROM accounting.user WHERE username = :username LIMIT 1");
                $database->bind(":username", $username);
                $row = $database->single();
                $arrSet = array();
                if ($row["sets"] == "") {
                    
                } else {
                    $arrSet = explode(",", $row["sets"]);
                }
                $len = sizeof($arrSet);
                if ($type == "0") {
                    for ($i = 0; $i < $len; $i++) {
                        if ($arrSet[$i] === $id) {
                            return 3;
                        }
                    }
                    $output = ""; //store all set id
                    if ($len == 0) {
                        $output = $id;
                    } else {
                        $output = $row["sets"] . "," . $id;
                    }
                    $database->query("UPDATE `accounting`.`user` SET `sets`=:sets WHERE `username`=:username;");
                    $database->bind(":username", $username);
                    $database->bind(":sets", $output);
                    $database->execute();
                } else {
                    for ($i = 0; $i < $len; $i++) {
                        if ($arrSet[$i] === $id) {
                            unset($arrSet[$i]);
                            $output = implode(",", $arrSet);
                            $database->query("UPDATE `accounting`.`user` SET `sets`=:sets WHERE `username`=:username;");
                            $database->bind(":username", $username);
                            $database->bind(":sets", $output);
                            $database->execute();
                            return 5;
                        }
                    }
                    return 4;
                }
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getCompanyInfo($set, &$arr) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT companyname,regno,DATE_FORMAT(`yearstarted`,'%d-%m-%Y') yearstarted,DATE_FORMAT(`yearended`,'%d-%m-%Y') yearended FROM accounting.`set` where setid=:set");
            $database->bind(":set", $set);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function updateCompanyInfo($companyName, $regNo,$yearStarted ,$yearEnded, $set) {
        $code = 1;
        $database = new DB();
        if ($regNo == "") {
            $regNo = null;
        }
        try {
            $database->query("UPDATE `accounting`.`set` SET `companyname`=:companyName, `regno`=:regNo,`yearstarted`=:yearStarted, `yearended`=:yearEnded WHERE `setid`=:set;");
            $database->bind(":companyName", $companyName);
            $database->bind(":regNo", $regNo);
            if ($yearStarted == "") {
                $database->bind(":yearStarted", "");
            } else {
                $database->bind(":yearStarted", $this->formatDate($yearStarted));
            }
            if ($yearEnded == "") {
                $database->bind(":yearEnded", "");
            } else {
                $database->bind(":yearEnded", $this->formatDate($yearEnded));
            }
            $database->bind(":set", $set);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getAllLedger($set, &$arr) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT `ledgerinfoid`,`name`,`type` FROM accounting.ledgerinfo WHERE `setid` = :set ORDER BY `name` ASC");
            $database->bind(":set", $set);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function removeLedger($id) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("DELETE FROM accounting.ledger WHERE ledgerinfoid = :id;");
            $database->bind(":id", $id);
            $database->execute();
            $database->query("DELETE FROM `accounting`.`ledgerinfo` WHERE `ledgerinfoid`=:id;");
            $database->bind(":id", $id);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function addLedger($id) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("INSERT INTO `accounting`.`ledgerinfo` (`name`,`type` ,`setid`) VALUES ('New ledger','0' , :id);");
            $database->bind(":id", $id);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function updateLedger($ledger, $ledgerType, $ledgerInfoId) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("UPDATE `accounting`.`ledgerinfo` SET `name`=:ledger, `type`=:ledgerType WHERE `ledgerinfoid`=:ledgerInfoId;");
            $database->bind(":ledger", $ledger);
            $database->bind(":ledgerType", $ledgerType);
            $database->bind(":ledgerInfoId", $ledgerInfoId);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getCompanyName($set, &$companyName) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT companyname FROM accounting.`set` WHERE `setid` = :set");
            $database->bind(":set", $set);
            $companyName = $database->single();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function returnAllLedgerTable($set, $ledgerinfoid, &$arr) {
        $code = 1;
        $database = new DB();
        $sql = "SELECT ledgerid,IFNULL(DATE_FORMAT(`date`,'%e-%b-%Y'), '') date, IFNULL(refno, '') refno, IFNULL(invoiceno, '') invoiceno, IFNULL(particulars,'') particulars, IFNULL(ledgerinfo.`name`,'') ledger, IFNULL(debit,'') debit, IFNULL(credit,'') credit FROM ledger LEFT JOIN ledgerinfo on ledger.ledgerinfoid = ledgerinfo.ledgerinfoid WHERE ledger.setid=:set";
        try {
            if ($ledgerinfoid != "0") {
                $sql .= " && ledger.ledgerinfoid=:ledgerinfoid";
            }
            $sql .= " ORDER BY ledger.date ASC";
            $database->query($sql);
            $database->bind(":set", $set);
            if ($ledgerinfoid != "0") {
                $database->bind(":ledgerinfoid", $ledgerinfoid);
            }
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function addRow($set, $row, $ledgerinfoid) {
        $code = 1;
        $database = new DB();
        $sql = "";
        if ($ledgerinfoid == "0") {
            $sql = "INSERT INTO `accounting`.`ledger` (`setid`) VALUES ";
            for ($i = 0; $i < $row; $i++) {
                $sql .= "('" . $set . "'),";
            }
        } else {
            $sql = "INSERT INTO `accounting`.`ledger` (`ledgerinfoid`,`setid`) VALUES ";
            for ($i = 0; $i < $row; $i++) {
                $sql .= "('" . $ledgerinfoid . "','" . $set . "'),";
            }
        }
        $sql = substr($sql, 0, strlen($sql) - 1);
        try {
            $database->query($sql);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function saveField($id, $output, $type) {
        $code = 1;
        $database = new DB();
        $sql = "";
        switch ($type) {
            case "ledgerdate":
                $sql = "UPDATE `accounting`.`ledger` SET `date`=:output WHERE `ledgerid`=:id;";
                $output = $this->formatDate($output);
                break;
            case "ledgerrefno":
                $sql = "UPDATE `accounting`.`ledger` SET `refno`=:output WHERE `ledgerid`=:id;";
                break;
            case "ledgerinvoiceno":
                $sql = "UPDATE `accounting`.`ledger` SET `invoiceno`=:output WHERE `ledgerid`=:id;";
                break;
            case "ledgerparticulars":
                $sql = "UPDATE `accounting`.`ledger` SET `particulars`=:output WHERE `ledgerid`=:id;";
                break;
            case "ledgerdropdown":
                $sql = "UPDATE `accounting`.`ledger` SET `ledgerinfoid`=:output WHERE `ledgerid`=:id;";
                break;
            case "ledgerdebit":
                $sql = "UPDATE `accounting`.`ledger` SET `debit`=:output WHERE `ledgerid`=:id;";
                break;
            case "ledgercredit":
                $sql = "UPDATE `accounting`.`ledger` SET `credit`=:output WHERE `ledgerid`=:id;";
                break;
            default :
                return 0;
        }
        try {
            $database->query($sql);
            if ($output==""){
                $output = null;
            }
            $database->bind(":output", $output);
            $database->bind(":id", $id);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function removeLedgerForTable($id) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("DELETE FROM `accounting`.`ledger` WHERE `ledgerid`=:id;");
            $database->bind(":id", $id);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function generateIncomeStatement($set, &$arr) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT SUM(IFNULL(l.`credit`,0))amount, i.`name` FROM ledger l, ledgerinfo i WHERE  i.`type` = '0' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` GROUP BY `name`;");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($arr, $result);
            $database->query("SELECT SUM(IFNULL(l.`debit`,0))amount, i.`name` FROM ledger l, ledgerinfo i WHERE  i.`type` = '1' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` GROUP BY `name`;");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($arr, $result);
            $database->query("SELECT SUM(IFNULL(l.`debit`,0))amount, i.`name` FROM ledger l, ledgerinfo i WHERE  i.`type` = '2' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` GROUP BY `name`;");
            $database->bind(":set", $set);
            $result = $database->resultset();
            array_push($arr, $result);
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getYearEnded($set, &$date) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT DATE_FORMAT(`yearended`,'%m-%Y') d FROM accounting.`set`WHERE `setid` = :set");
            $database->bind(":set", $set);
            $result = $database->resultset();
            if ($result[0]["d"] == null) {
                $date = "";
            } else {
                $date = $result[0]["d"];
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getBankStatement($set, &$result) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT bankstatement FROM accounting.`set` WHERE `setid` = :set;");
            $database->bind(":set", $set);
            $result = $database->single();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function BankStatementProblem($set) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("UPDATE `accounting`.`set` SET `bankstatement`=:bankstatement WHERE `setid`=:set;");
            $database->bind(":set", $set);
            $bankstatement = '{
"bs":[
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
},
{
"a":0,
"b":0,
"c":0
}
]
}';
            $database->bind(":bankstatement", $bankstatement);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function saveBankStatement($set, $json) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("UPDATE `accounting`.`set` SET `bankstatement`=:json WHERE `setid`=:set;");
            $database->bind(":set", $set);
            $database->bind(":json", $json);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }
    public function addBalanceSheetItem($set){
        $code = 1;
        $database = new DB();
        try {
            $database->query("INSERT INTO `accounting`.`balancesheet` (`item`, `amount`, `depreciation`, `type`, `setid`) VALUES ('New item', '0', '0', '0', :set);");
            $database->bind(":set", $set);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }
    public function getBalanceSheetTable($set,&$arr){
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT `id`,`item`,`amount`,`depreciation`,`type` FROM accounting.balancesheet WHERE `setid` = :set ORDER BY `type`");
            $database->bind(":set", $set);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }
    public function updateBalanceSheetItem($item,$amount,$depreciation,$type,$id){
         $code = 1;
        $database = new DB();
        try {
            $database->query("UPDATE `accounting`.`balancesheet` SET `item`=:item, `amount`=:amount, `depreciation`=:depreciation, `type`=:type WHERE `id`=:id");
            $database->bind(":item", $item);
            $database->bind(":amount", $amount);
            $database->bind(":depreciation", $depreciation);
            $database->bind(":type", $type);
            $database->bind(":id", $id);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }
    public function removeBalanceSheetItem($id){
         $code = 1;
        $database = new DB();
        try {
            $database->query("DELETE FROM `accounting`.`balancesheet` WHERE `id`=:id");
            $database->bind(":id", $id);
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }
    public function showGeneratedBalanceSheet($set,&$arr){
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT `item`,`amount`,`depreciation`,`type` FROM accounting.balancesheet WHERE `setid` = :set ORDER BY `type`");
            $database->bind(":set", $set);
            $arr = $database->resultset();
            $database->query("SELECT IFNULL((SELECT SUM(IFNULL(l.`credit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '0' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ) - (SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '1' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid`) - (
SELECT SUM(IFNULL(l.`debit`,0))amount FROM ledger l, ledgerinfo i WHERE  i.`type` = '2' && l.`setid` = :set && l.`ledgerinfoid` = i.`ledgerinfoid` ),0) c");
            $database->bind(":set", $set);
            $row = $database->single();
            $c = array("amount"=>$row["c"],"type"=>"5");
            array_push($arr,$c); 
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    //////////Special function /////////////////////////////////
    private function formatDate($date) {
        $arr = explode("-", $date);
        return $arr[2] . "-" . $arr[1] . "-" . $arr[0];
    }

}
