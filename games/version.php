<?php
//Отключить: exit ();
//Показать уведомление о новой последней версии
$game = trim($_POST['game']);
$version = trim($_POST['version']);
if ($game == 'flat_zombies_defense' && $version != '2.0.5'){ //http://pavoldev.ru/games/flat_zombies.apk
    exit ("version:2.0.5;http://h51358.srv5.test-hf.ru/games/flat_zombies_v2.0.5.apk"); 
}
//Если в главном меню через Inspector указана версия сборки
//if ($game == 'flat_zombies_defense' && trim($_POST['build']) != '453'){
//	exit ("version:".$lastVersion[$game].'-453;'.$apkURL[$game]);
//}
?>