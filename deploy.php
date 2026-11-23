<?php
/**
 * Guru Kashi University - Automated Deployment & Management Webhook
 */

$SECRET_TOKEN = 'gku_deploy_2026';
$receivedToken = $_GET['token'] ?? $_POST['token'] ?? '';

header('Content-Type: application/json');

if (!hash_equals($SECRET_TOKEN, $receivedToken)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit;
}

$currentUser = get_current_user();
$homeDir = "/home/{$currentUser}";
$appDir = "{$homeDir}/gku-recruitment-system.git";

$action = $_GET['action'] ?? 'deploy';

if ($action === 'autossl') {
    $out = function_exists('shell_exec') ? @shell_exec("uapi SSL start_autossl_check 2>&1") : 'disabled';
    echo json_encode([
        'status' => 'success',
        'command_output' => $out,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

if ($action === 'clean') {
    // Completely wipe old .next folder and tmp/restart.txt
    if (is_dir("{$appDir}/.next")) {
        @exec("rm -rf " . escapeshellarg("{$appDir}/.next"));
    }
    // Also re-extract if gku-deploy.zip is available, or pull
    $zipPath = "{$appDir}/gku-deploy.zip";
    if (file_exists($zipPath)) {
        $zip = new ZipArchive();
        if ($zip->open($zipPath) === TRUE) {
            $zip->extractTo($appDir);
            $zip->close();
        }
    }
    @touch("{$appDir}/tmp/restart.txt");
    @exec("pkill -9 -u {$currentUser} -f node");
    
    echo json_encode([
        'status' => 'success',
        'message' => 'Cleaned .next completely and restarted',
        'remaining_next' => is_dir("{$appDir}/.next"),
        'build_id' => file_exists("{$appDir}/.next/BUILD_ID") ? trim(file_get_contents("{$appDir}/.next/BUILD_ID")) : 'none'
    ]);
    exit;
}

if ($action === 'fix_env') {
    $fullUri = 'mongodb://websitegku_db_user:jHn2jiAGlPImDQXk@ac-jjzkgax-shard-00-00.a05gk60.mongodb.net:27017,ac-jjzkgax-shard-00-01.a05gk60.mongodb.net:27017,ac-jjzkgax-shard-00-02.a05gk60.mongodb.net:27017/gku_recruitment?ssl=true&replicaSet=atlas-d1fbdv-shard-0&authSource=admin&retryWrites=true&w=majority';
    $envContent = "NODE_ENV=production\nPORT=3000\nMONGODB_URI={$fullUri}\nNEXT_PUBLIC_APP_NAME=\"Guru Kashi University - Hiring & Recruitment System\"\n";
    file_put_contents("{$appDir}/.env", $envContent);
    @touch("{$appDir}/tmp/restart.txt");
    if (function_exists('exec')) {
        @exec("pkill -9 -u {$currentUser} -f node");
    }
    echo json_encode([
        'status' => 'success',
        'message' => 'Updated .env with full replicaSet MONGODB_URI and restarted node',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

if ($action === 'test_mongo') {
    $envContent = file_exists("{$appDir}/.env") ? file_get_contents("{$appDir}/.env") : 'no .env';
    
    // Mask password in URI
    $maskedEnv = preg_replace('/:[^:@]+@/', ':***@', $envContent);

    // Test TCP socket to Atlas host
    $host = 'ac-jjzkgax-shard-00-00.a05gk60.mongodb.net';
    $port = 27017;
    $errno = 0;
    $errstr = '';
    
    $t0 = microtime(true);
    $fp = @fsockopen($host, $port, $errno, $errstr, 5);
    $tcpTime = round((microtime(true) - $t0) * 1000, 2);
    $tcpSuccess = (bool)$fp;
    if ($fp) {
        fclose($fp);
    }

    // Test SSL socket
    $sslSuccess = false;
    $sslErr = '';
    $context = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false]]);
    $sslFp = @stream_socket_client("ssl://{$host}:{$port}", $errno, $errstr, 5, STREAM_CLIENT_CONNECT, $context);
    if ($sslFp) {
        $sslSuccess = true;
        fclose($sslFp);
    } else {
        $sslErr = "{$errno}: {$errstr}";
    }

    $outIp = @file_get_contents('https://api.ipify.org') ?: 'unavailable';

    echo json_encode([
        'status' => 'success',
        'masked_env' => $maskedEnv,
        'server_outgoing_ip' => $outIp,
        'dns_lookup' => gethostbyname($host),
        'tcp_27017' => [
            'success' => $tcpSuccess,
            'time_ms' => $tcpTime,
            'errno' => $errno,
            'errstr' => $errstr
        ],
        'ssl_27017' => [
            'success' => $sslSuccess,
            'error' => $sslErr
        ]
    ]);
    exit;
}

if ($action === 'inspect') {
    $buildId = file_exists("{$appDir}/.next/BUILD_ID") ? trim(file_get_contents("{$appDir}/.next/BUILD_ID")) : 'not found';
    $zipExists = file_exists("{$appDir}/gku-deploy.zip");
    $zipSize = $zipExists ? filesize("{$appDir}/gku-deploy.zip") : 0;
    
    // Check running processes
    $psOut = function_exists('shell_exec') ? @shell_exec("ps aux | grep node") : 'shell_exec disabled';
    $disabled = ini_get('disable_functions');

    // Check directories in home
    $homeDirs = glob("{$homeDir}/*", GLOB_ONLYDIR);

    $outIp = @file_get_contents('https://api.ipify.org') ?: 'unavailable';

    echo json_encode([
        'status' => 'success',
        'current_user' => $currentUser,
        'app_dir' => $appDir,
        'build_id' => $buildId,
        'server_outgoing_ip' => $outIp,
        'restart_txt_mtime' => file_exists("{$appDir}/tmp/restart.txt") ? date('Y-m-d H:i:s', filemtime("{$appDir}/tmp/restart.txt")) : 'none',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// 1. Locate zip file
$zipCandidates = [
    "{$appDir}/gku-deploy.zip",
    __DIR__ . "/gku-deploy.zip",
    "{$homeDir}/public_html/gku-deploy.zip",
    "{$homeDir}/gku-deploy.zip"
];

$zipPath = null;
foreach ($zipCandidates as $cand) {
    if (file_exists($cand) && filesize($cand) > 1000000) {
        $zipPath = $cand;
        break;
    }
}

if (!$zipPath) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'gku-deploy.zip not found or invalid size',
        'app_dir' => $appDir,
        'searched' => $zipCandidates
    ]);
    exit;
}

// 2. Completely remove old .next directory to avoid stale route caches
if (is_dir("{$appDir}/.next")) {
    @exec("rm -rf " . escapeshellarg("{$appDir}/.next"));
}

// 3. Extract Archive
$extracted = false;
$method = '';

if (class_exists('ZipArchive')) {
    $zip = new ZipArchive();
    if ($zip->open($zipPath) === TRUE) {
        $zip->extractTo($appDir);
        $num = $zip->numFiles;
        $zip->close();
        $extracted = true;
        $method = "ZipArchive ($num files)";
    }
}

if (!$extracted && function_exists('exec')) {
    @exec("unzip -o " . escapeshellarg($zipPath) . " -d " . escapeshellarg($appDir), $out, $ret);
    if ($ret === 0) {
        $extracted = true;
        $method = 'exec unzip';
    }
}

if (!$extracted) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Zip extraction failed']);
    exit;
}

// Clean up zip
@unlink($zipPath);

// 4. Signal Phusion Passenger to restart
$tmpDir = "{$appDir}/tmp";
if (!is_dir($tmpDir)) {
    @mkdir($tmpDir, 0755, true);
}
@touch("{$tmpDir}/restart.txt");

// Kill active node passenger process so Passenger spawns fresh server.js immediately
if (function_exists('exec')) {
    @exec("pkill -9 -u {$currentUser} -f node");
}

$newBuildId = file_exists("{$appDir}/.next/BUILD_ID") ? trim(file_get_contents("{$appDir}/.next/BUILD_ID")) : 'unknown';

echo json_encode([
    'status' => 'success',
    'message' => 'Deployed successfully and restarted Phusion Passenger!',
    'method' => $method,
    'new_build_id' => $newBuildId,
    'app_dir' => $appDir,
    'timestamp' => date('Y-m-d H:i:s')
]);
