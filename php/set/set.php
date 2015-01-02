<?php

include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/dbSet.php";
session_start();
if (isset($_POST["action"]) && isset($_SESSION["user"])) {
    $DbSet = new DbSet();
    switch ($_POST["action"]) {
        case "createSet":
            echo $DbSet->addSet(htmlspecialchars($_POST["setname"]), $_SESSION["user"]);
            break;
        case "getAllSet":
            $arr = array();
            $code = $DbSet->getAllSet($_SESSION["user"], $arr);
            if ($code == 0){
                echo "0";
            }else{
               echo json_encode($arr); 
            }
            break;
        case "openSet":
            if (isset($_POST["id"])) {
                 echo $DbSet->openSet($_POST["id"]);
            }else{
                echo "0";
            }
            break;
        case "updateSetName":
            if (isset($_POST["id"]) && isset($_POST["setName"])) {
                 echo $DbSet->updateSetName($_POST["id"],htmlspecialchars($_POST["setName"]));
            }else{
                echo "0";
            }
            break;
        case "removeSet":
            if (isset($_POST["id"])) {
                echo $DbSet->removeSet($_POST["id"]);
            }
            break;
        case "shareSet":
            if (isset($_POST["id"]) && isset($_POST["username"]) && isset($_POST["type"])) {
                echo $DbSet->shareSet($_POST["id"],$_POST["username"],$_POST["type"]);
            }
            break;
        case "getCompanyInfo":
            if (isset($_SESSION["set"])){
                $arr = array();
                $code = $DbSet->getCompanyInfo($_SESSION["set"],$arr);
                if ($code == 0){
                    echo "0";
                }else{
                if ($arr[0]['regno']== null){
                    $arr[0]['regno'] = "";
                }
                if ($arr[0]['yearended']==null){
                    $arr[0]['yearended'] = "";
                }
                   echo json_encode($arr);
                }
            }
            break;
        case "updateCompanyInfo":
            if (isset($_POST["companyName"]) && isset($_POST["regNo"]) && isset($_SESSION["set"]) && isset($_POST["yearEnded"])){
                echo $DbSet->updateCompanyInfo(htmlspecialchars($_POST["companyName"]),htmlspecialchars($_POST["regNo"]), $_POST["yearEnded"] ,$_SESSION["set"]);
            }
            break;
        case "getLedger":
            if (isset($_SESSION["set"])){
                $arr = array();
                $DbSet->getAllLedger($_SESSION["set"], $arr);
                echo json_encode($arr);
            }
            break;
        case "addLedger":
            if (isset($_SESSION["set"])){
               echo $DbSet->addLedger($_SESSION["set"]); 
            }
            break;
        case "removeLedger":
            if (isset($_SESSION["set"]) && isset($_POST["ledgerInfoId"])){
               echo $DbSet->removeLedger($_POST["ledgerInfoId"]); 
            }
            break;
        case "updateLedger":
             if (isset($_SESSION["set"]) && isset($_POST["ledger"]) && isset($_POST["ledgerType"]) && isset($_POST["ledgerInfoId"])){
                 echo $DbSet->updateLedger($_POST["ledger"],$_POST["ledgerType"],$_POST["ledgerInfoId"]); 
            }
            break;
        case "getCompanyName":
            if (isset($_SESSION["set"])){
                $companyName = "";
                $code =  $DbSet->getCompanyName($_SESSION["set"], $companyName);
                if ($code == 0){
                    echo $code;
                }else{
                    echo $companyName["companyname"];
                }
            }
            break;
        case "returnAllLedgerTable":
            if (isset($_SESSION["set"] ) && isset($_POST["ledgerinfoid"])){
                $arr = array();
                $code =  $DbSet->returnAllLedgerTable($_SESSION["set"],$_POST["ledgerinfoid"],$arr);
                if ($code == 0){
                    echo "0";
                }else{
                    echo json_encode($arr);
                }
            }
            break;
        case "addRow":
            if (isset($_SESSION["set"]) && isset($_POST["row"]) && isset($_POST["ledgerinfoid"])){
                echo $DbSet->addRow($_SESSION["set"],$_POST["row"],$_POST["ledgerinfoid"]);
            }
            break;
        case "saveField":
            if (isset($_SESSION["set"]) && isset($_POST["ledgerid"]) && isset($_POST["type"]) && isset($_POST["output"])){
                echo $DbSet->saveField($_POST["ledgerid"],htmlspecialchars($_POST["output"]), $_POST["type"]);
            }
            break;
        case "removeLedgerForTable":
            if (isset($_SESSION["set"]) && (isset($_POST["ledgerid"]))){
                echo  $DbSet->removeLedgerForTable($_POST["ledgerid"]);
            }
            break;
        default:
            header("Location: http://albm/");
            die();
    }
}



