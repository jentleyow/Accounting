<?php
class Log{
public function writeLog($error){
    $fileloc = $_SERVER["DOCUMENT_ROOT"]."accounting/php/log/logg.txt";
	$content = file_get_contents($fileloc);
        $content .= PHP_EOL . date('Y-m-d H:i:s') . "->".$error;
        file_put_contents($fileloc, $content);
	}
}