<?php
include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/dbUser.php";
if (isset($_POST["action"])) {
     
    $DbUser = new DbUser();
    switch ($_POST["action"]) {
        case "createuser":
            echo $DbUser->registerUser($_POST["username"], $_POST["password"], $_POST["fullname"]);
            break;
        case "login":
            $code = $DbUser->login($_POST["username"], $_POST["password"]);
            if ($code == 1) {
                echo "html/Dashboard.htm";
            } else {

                echo $code;
            }
            break;
        case "saveAccount":
            session_start();
            if (isset($_POST["password"])  && isset($_SESSION["user"])) {
                echo $DbUser->saveAccount($_SESSION["user"],htmlspecialchars($_POST["password"]));
            }
            break;
        case "getAccount":
            session_start();
            if (isset($_SESSION["user"])) {
                $arr = array();
                $code = $DbUser->getAccount($_SESSION["user"],$arr);
                if ($code == 0){
                    echo "0";
                }else{
                    echo json_encode($arr);
                }
            }
            break;
    }
}




