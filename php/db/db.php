<?php
include_once $_SERVER["DOCUMENT_ROOT"]."accounting/php/log/log.php";

class DB {

    //private $log;
    private $dbh;
    private $username = "accounting";
    private $password = "CGg-3{#>x8vh<j/";
    private $db = "accounting";
    private $stmt;

    function __construct() {
        $this->log = new Log();
        try {
            $options = array(
                PDO::ATTR_PERSISTENT => true,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION);
            $this->dbh = new PDO("mysql:host=localhost;dbname=" . $this->db, $this->username, $this->password, $options);
            
        } catch (Exception $ex) {
           $this->writeError($ex);
        }
    }
    public function query($query){
        $this->stmt = $this->dbh->prepare($query);
    }
    public function bind($param, $value, $type = null){
    if (is_null($type)) {
        switch (true) {
            case is_int($value):
                $type = PDO::PARAM_INT;
                break;
            case is_bool($value):
                $type = PDO::PARAM_BOOL;
                break;
            case is_null($value):
                $type = PDO::PARAM_NULL;
                break;
            default:
                $type = PDO::PARAM_STR;
        }
    }
    $this->stmt->bindValue($param, $value, $type);
}
public function execute(){
    return $this->stmt->execute();
}
public function resultset(){
    $this->execute();
    return $this->stmt->fetchAll(PDO::FETCH_ASSOC);
}
public function single(){
    $this->execute();
    return $this->stmt->fetch(PDO::FETCH_ASSOC);
}
public function rowCount(){
    return $this->stmt->rowCount();
}
public function lastInsertId(){
    return $this->dbh->lastInsertId();
}
public function beginTransaction(){
    return $this->dbh->beginTransaction();
}
public function endTransaction(){
    return $this->dbh->commit();
}
public function cancelTransaction(){
    return $this->dbh->rollBack();
}
public function writeError($error) {
        $this->log->writeLog($error);
        return 0;
    }
   

}
