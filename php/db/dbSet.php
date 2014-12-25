<?php

include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/db.php";

class DbSet {

    public function addSet($setName, $uid) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("INSERT INTO `accounting`.`set` (`name`, `date`) VALUES (:name, Now());");
            $database->bind(":name", $setName);
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
            if (empty($row) == false) {
                $sets = explode(",", $row["sets"]);
                $sql = "";
                for ($i = 0; $i < sizeof($sets); $i++) {
                    $sql .= "||`setid` = " . $sets[$i];
                }
                $sql = substr($sql, 2);  //remove "||" 
                $database->query("SELECT `setid`,`name`,`date` FROM `set` WHERE " . $sql . " ORDER BY `date` DESC");
                $arr = $database->resultset();
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
            $database->query("SELECT companyname,regno FROM accounting.`set` where setid=:set;");
            $database->bind(":set", $set);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function updateCompanyInfo($companyName, $regNo, $set) {
        $code = 1;
        $database = new DB();
        if ($regNo == "") {
            $regNo = null;
        }
        try {
            $database->query("UPDATE `accounting`.`set` SET `companyname`=:companyName, `regno`=:regNo WHERE `setid`=:set;");
            $database->bind(":companyName", $companyName);
            $database->bind(":regNo", $regNo);
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
            $database->query("SELECT `ledgerinfoid`,`name`,`type` FROM accounting.ledgerinfo WHERE `setid` = :set");
            $database->bind(":set", $set);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getLimitedLedger($set, &$arr) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT `ledgerinfoid`,`name` FROM accounting.ledgerinfo WHERE `setid` = :set");
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

    public function getCompanyName($set,&$companyName) {
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
    public function returnAllLedgeTable($set, &$arr){
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT ledgerid,IFNULL(DATE_FORMAT(`date`,'%e-%b-%Y'), '') date, IFNULL(refno, '') refno, IFNULL(invoiceno, '') invoiceno, IFNULL(particulars,'') particulars, i.`name` ledger, IFNULL(debit,'') debit, IFNULL(credit,'') credit FROM ledger l,ledgerinfo i WHERE l.ledgerinfoid = i.ledgerinfoid  && l.setid = :set");
            $database->bind(":set", $set);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    //////////Special function /////////////////////////////////
    private function formatDate($date) {
        $arr = explode("/", $date);
        return $arr[2] . "/" . $arr[1] . "/" . $arr[0];
    }

}
