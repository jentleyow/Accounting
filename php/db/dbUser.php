<?php

include_once $_SERVER["DOCUMENT_ROOT"] . "accounting/php/db/db.php";

class DbUser {

    public function registerUser($username, $password, $fullname) {
        $code = 1;
        $database = new DB();
        try {

            $database->query("SELECT count(uid)c FROM accounting.user WHERE `username` = :username");
            $database->bind(":username", $username);
            $row = $database->single();
            if ($row["c"] == "0") {
                $database->query("INSERT INTO `accounting`.`user` (`username`, `password`, `fullname`) VALUES (:username, :password, :fullname);");
                $database->bind(":username", $username);
                $database->bind(":password", password_hash($password, PASSWORD_DEFAULT));
                $database->bind(":fullname", $fullname);
                $database->execute();
            } else {
                $code = 2;
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function login($username, $password) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT password FROM accounting.user WHERE `username` = :username");
            $database->bind(":username", $username);
            $hash = $database->single();
            $p = password_verify($password, $hash["password"]);
            if ($p == "1") {
                $database->query("SELECT uid FROM accounting.user WHERE `username` = :username");
                $database->bind(":username", $username);
                $uid = $database->single();
                session_start();
                $_SESSION["user"] = $uid["uid"];
            } else {
                $code = "2"; //fail username or password
            }
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

    public function getAccount($user,&$arr) {
        $code = 1;
        $database = new DB();
        try {
            $database->query("SELECT username,fullname FROM accounting.user WHERE `uid` = :user");
            $database->bind(":user", $user);
            $arr = $database->resultset();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }
    public function saveAccount($user,$password){
        $code = 1;
        $database = new DB();
        try {
            $database->query("UPDATE `accounting`.`user` SET `password`=:password WHERE `uid`=:user;");
            $database->bind(":user", $user);
            $database->bind(":password", password_hash($password, PASSWORD_DEFAULT));
            $database->execute();
        } catch (Exception $ex) {
            $code = $database->writeError($ex);
        }
        return $code;
    }

}
