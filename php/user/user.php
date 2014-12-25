<?php
include_once $_SERVER["DOCUMENT_ROOT"]."accounting/php/db/dbUser.php";
if (isset($_POST["action"])){
    if ($_POST["action"]=="createuser"){
        $DbUser = new DbUser();
        $code = $DbUser->registerUser($_POST["username"], $_POST["password"], $_POST["fullname"]);
        echo $code;
}else if ($_POST["action"]=="login"){
    $DbUser = new DbUser();
    $code = $DbUser->login($_POST["username"], $_POST["password"]);
    echo $code;
}
}


