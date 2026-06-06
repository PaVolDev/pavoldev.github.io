<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
	http_response_code(200);
	exit;
}

session_start();

define('MAX_ATTEMPTS', 4);
define('LOCKOUT_TIME', 900);
define('MOD_IDS_LIMIT', 1000);
define('RECENT_MODS_LIMIT', 200);
define('BACKUP_DIRECTORY', '/mods/backup/');
$allowedTypes = ['weapon', 'cartridge', 'playerskin']; // Допустимые типы модов

$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https://' : 'http://';
$domain = $_SERVER['HTTP_HOST'];
$urlDirectory = $protocol . $domain . BACKUP_DIRECTORY;
$directory = $_SERVER['DOCUMENT_ROOT'] . BACKUP_DIRECTORY;
header('Content-Type: application/json; charset=utf-8');

$attempts = isset($_SESSION['login_attempts']) ? (int) $_SESSION['login_attempts'] : 0;
$lastAttempt = isset($_SESSION['last_login_attempt']) ? (int) $_SESSION['last_login_attempt'] : 0;
if ($attempts >= MAX_ATTEMPTS && (time() - $lastAttempt) < LOCKOUT_TIME) {
	echo json_encode(['success' => false, 'message' => 'Неверный логин или пароль']);
	exit;
}

$json = json_decode(file_get_contents('php://input'), true);
if (!is_array($json)) {
	$json = [];
}
$action = $json['action'] ?? '';
$inputLogin = trim($json['login'] ?? '');
$inputPassword = trim($json['password'] ?? '');

require_once '../../config.php';
try {
	$pdo = new PDO('mysql:host=localhost;dbname=' . $baseName . ';charset=utf8mb4', $baseUser, $basePassword, [
		PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
		PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
	]);
} catch (PDOException $e) {
	http_response_code(500);
	exit('Server error #143');
}

function normalizeModType($modType) {
	global $allowedTypes;
	$modType = trim((string) $modType); // Тип мода из запроса
	if (!in_array($modType, $allowedTypes, true)) {
		return '';
	}
	return $modType;
}

function getRecentMods(PDO $pdo, int $userId, string $modType = '') {
	$query = "SELECT id FROM weapons WHERE user = :userId AND time != 0 AND status != 'ban'"; // Базовый запрос последних модов
	$params = [':userId' => $userId]; // Параметры запроса последних модов
	if ($modType !== '') {
		$query .= " AND modType = :modType";
		$params[':modType'] = $modType;
	}
	$query .= " ORDER BY updatetime DESC LIMIT " . RECENT_MODS_LIMIT;
	$stmt = $pdo->prepare($query);
	$stmt->execute($params);
	$mods = $stmt->fetchAll(PDO::FETCH_COLUMN);
	return array_values(array_filter($mods, function ($value) {
		return is_string($value) && $value !== '';
	}));
}

function getUserModIds(PDO $pdo, int $userId, string $modType = '') {
	$query = "SELECT id FROM weapons WHERE user = :userId AND time != 0 AND status != 'ban'"; // Базовый запрос идентификаторов модов
	$params = [':userId' => $userId]; // Параметры запроса идентификаторов модов
	if ($modType !== '') {
		$query .= " AND modType = :modType";
		$params[':modType'] = $modType;
	}
	$query .= " ORDER BY updatetime DESC LIMIT " . MOD_IDS_LIMIT;
	$stmt = $pdo->prepare($query);
	$stmt->execute($params);
	$ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
	return array_values(array_filter($ids, function ($value) {
		return is_string($value) && $value !== '';
	}));
}

function loadWeaponDetailsByIds(PDO $pdo, array $ids, string $directory, string $urlDirectory, string $modType = '') {
	if (count($ids) === 0) {
		return [];
	}

	$normalizedIds = array_values(array_filter(array_map(function ($value) {
		return trim((string) $value);
	}, $ids), function ($value) {
		return $value !== '';
	}));
	if (count($normalizedIds) === 0) {
		return [];
	}

	$placeholders = implode(',', array_fill(0, count($normalizedIds), '?'));
	$query = "SELECT id, status, modType, likesskip, dislikesskip, raitingskip FROM weapons WHERE id IN ($placeholders) AND time != 0 AND status != 'ban'"; // Базовый запрос данных модов
	$params = $normalizedIds; // Параметры запроса данных модов
	if ($modType !== '') {
		$query .= " AND modType = ?";
		$params[] = $modType;
	}
	$stmt = $pdo->prepare($query);
	$stmt->execute($params);
	$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
	$rowsById = [];
	foreach ($rows as $row) {
		$row['fileUrl'] = $urlDirectory . urlencode($row['id']) . '.json';
		$row['iconBase64'] = 'images/report.png';
		$row['likes'] = $row['likesskip'];
		$row['dislikes'] = $row['dislikesskip'];
		$row['raiting'] = $row['raitingskip'];
		unset($row['likesskip']);
		unset($row['dislikesskip']);
		unset($row['raitingskip']);
		$filePath = $directory . $row['id'] . '.json';
		if (file_exists($filePath)) {
			$jsonContent = file_get_contents($filePath);
			$jsonData = json_decode($jsonContent, true);
			if (!empty($jsonData['storeInfo.iconBase64'])) {
				$row['iconBase64'] = $jsonData['storeInfo.iconBase64'];
			} elseif (!empty($jsonData['iconButtonSprite'])) {
				$row['iconBase64'] = $jsonData['iconButtonSprite'];
			}
		}
		$rowsById[$row['id']] = $row;
	}

	$orderedRows = [];
	foreach ($normalizedIds as $id) {
		if (isset($rowsById[$id])) {
			$orderedRows[] = $rowsById[$id];
		}
	}
	return $orderedRows;
}

try {
	$token = '';
	$user = null;
	$modType = normalizeModType($json['modType'] ?? '');
	if (isset($json['token'])) {
		$token = trim($json['token'] ?? '');
		if ($token === '') {
			echo json_encode(['success' => false, 'message' => 'Нет токена']);
			exit;
		}
		$stmt = $pdo->prepare("SELECT id FROM users WHERE session = :token AND status != 'ban' LIMIT 1");
		$stmt->execute([':token' => $token]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);
		if (!$user) {
			$_SESSION['login_attempts'] = $attempts + 1;
			$_SESSION['last_login_attempt'] = time();
			echo json_encode(['success' => false, 'message' => 'Сессия не найдена']);
			exit;
		}
	} elseif ($action === 'login') {
		if ($inputLogin === '' || $inputPassword === '') {
			echo json_encode(['success' => false, 'message' => 'Некорректные данные']);
			exit;
		}
		$stmt = $pdo->prepare("SELECT id, password FROM users WHERE login = :login AND status != 'ban' LIMIT 1");
		$stmt->execute([':login' => $inputLogin]);
		$user = $stmt->fetch(PDO::FETCH_ASSOC);
		if (!$user || !password_verify($inputPassword, $user['password'])) {
			$_SESSION['login_attempts'] = $attempts + 1;
			$_SESSION['last_login_attempt'] = time();
			echo json_encode(['success' => false, 'message' => 'Неверный логин или пароль']);
			exit;
		}
		$token = bin2hex(random_bytes(32));
		$stmt = $pdo->prepare("UPDATE users SET session = :token WHERE id = :id");
		$stmt->execute([':token' => $token, ':id' => $user['id']]);
	} elseif ($action === 'logout') {
		$token = trim($json['token'] ?? '');
		if ($token !== '') {
			$stmt = $pdo->prepare("UPDATE users SET session = NULL WHERE session = :token");
			$stmt->execute([':token' => $token]);
		}
		echo json_encode(['success' => true]);
		exit;
	} else {
		echo json_encode(['success' => false, 'message' => '#112: Некорректные данные']);
		exit;
	}

	unset($_SESSION['login_attempts']);
	unset($_SESSION['last_login_attempt']);

	if ($action === 'remove') {
		$modId = trim(strtolower($json['id'] ?? ''));
		if ($modId === '') {
			echo json_encode(['success' => false, 'message' => 'Не указан ID']);
			exit;
		}
		include_once('user-list-remove.php');
		exit;
	}

	$userId = (int) $user['id'];
	if ($action === 'get_mod_page') {
		$requestIds = isset($json['ids']) && is_array($json['ids']) ? $json['ids'] : [];
		$userIds = getUserModIds($pdo, $userId, $modType);
		$userIdsLookup = array_flip($userIds);
		$allowedIds = [];
		foreach ($requestIds as $id) {
			$id = trim((string) $id);
			if ($id !== '' && isset($userIdsLookup[$id])) {
				$allowedIds[] = $id;
			}
		}
		$weapons = loadWeaponDetailsByIds($pdo, $allowedIds, $directory, $urlDirectory, $modType);
		echo json_encode([
			'success' => true,
			'token' => $token,
			'weapons' => $weapons
		]);
		exit;
	}

	$userModIds = getUserModIds($pdo, $userId, $modType);
	$recentMods = getRecentMods($pdo, $userId, $modType);
	echo json_encode([
		'success' => true,
		'token' => $token,
		'modIds' => $userModIds,
		'recentMods' => $recentMods
	]);
} catch (PDOException $e) {
	echo json_encode(['success' => false, 'message' => '#1211: Ошибка сервера']);
}