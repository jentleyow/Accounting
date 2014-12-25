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
            $DbSet->getAllSet($_SESSION["user"], $arr);
            GenerateSetTable($arr);
            break;
        case "openSet":
            if (isset($_POST["id"])) {
                $_SESSION["set"] = $_POST["id"];
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
                   echo json_encode($arr);
                }
            }
            break;
        case "updateCompanyInfo":
            if (isset($_POST["companyName"]) && isset($_POST["regNo"]) && isset($_SESSION["set"])){
                echo $DbSet->updateCompanyInfo(htmlspecialchars($_POST["companyName"]),htmlspecialchars($_POST["regNo"]), $_SESSION["set"]);
            }
            break;
        case "getLedger":
            if (isset($_SESSION["set"])){
                $arr = array();
                $DbSet->getAllLedger($_SESSION["set"], $arr);
                echo json_encode($arr);
            }
            break;
        case "getLimitedLedger":
            if (isset($_SESSION["set"])){
                $arr = array();
                $DbSet->getLimitedLedger($_SESSION["set"], $arr);
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
        case "returnAllLedgeTable":
            if (isset($_SESSION["set"])){
                $arr = array();
                $code =  $DbSet->returnAllLedgeTable($_SESSION["set"],$arr);
                if ($code == 0){
                    echo "0";
                }else{
                    echo json_encode($arr);
                }
            }
            break;
        default:
            header("Location: http://albm/");
            die();
    }
}

function GenerateSetTable($arr) {
    $html = '<thead>
        <tr>
            <th width="4%">No</th>
          <th width="40%">Set Name</th>
          <th>Last Modified</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>';
    $count = 1;
    for ($i = 0; $i < sizeof($arr); $i++) {
        $html .="<tr>";
        $html .="<td>" . $count . "</td>";
        $html .="<td class='setName' onclick='setclick(" . $arr[$i]["setid"] . ")'>" . htmlspecialchars($arr[$i]["name"]) . "</td>";
        $html .="<td>" . $arr[$i]["date"] . "</td>";
        $html .="<td></td>";
        $html .="</tr>";
        $count++;
    }
    $html .= '</tbody>';
    echo $html;
}


