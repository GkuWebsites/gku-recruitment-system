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

if ($action === 'setup_cron') {
    $scriptPath = "{$homeDir}/mongodb/keep_alive.sh";
    $scriptContent = "#!/bin/bash\n" .
        "if ! pgrep -f 'mongod.*27017' > /dev/null 2>&1; then\n" .
        "    {$homeDir}/mongodb/bin/mongod --dbpath {$homeDir}/mongodb/data --bind_ip 127.0.0.1 --port 27017 --fork --logpath {$homeDir}/mongodb/mongod.log --wiredTigerCacheSizeGB 0.25 >/dev/null 2>&1\n" .
        "fi\n";
    @file_put_contents($scriptPath, $scriptContent);
    @chmod($scriptPath, 0755);

    $cronOut = 'no crontab command';
    if (function_exists('shell_exec')) {
        $existing = (string)@shell_exec('crontab -l 2>&1');
        if (strpos($existing, 'keep_alive.sh') === false) {
            $newLine = "* * * * * {$scriptPath} >/dev/null 2>&1\n@reboot {$scriptPath} >/dev/null 2>&1\n";
            $cleanExisting = (strpos($existing, 'no crontab') !== false ? '' : trim($existing) . "\n");
            $newCron = $cleanExisting . $newLine;
            $tmpFile = tempnam('/tmp', 'cron');
            file_put_contents($tmpFile, $newCron);
            $cronOut = @shell_exec("crontab " . escapeshellarg($tmpFile) . " 2>&1");
            @unlink($tmpFile);
        } else {
            $cronOut = 'cron already installed';
        }
    }

    echo json_encode([
        'status' => 'success',
        'script_created' => file_exists($scriptPath),
        'cron_output' => trim((string)$cronOut),
        'crontab_list' => function_exists('shell_exec') ? trim((string)@shell_exec('crontab -l 2>&1')) : 'disabled',
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

if ($action === 'start_local_mongo') {
    $mongoDir = "{$homeDir}/mongodb";
    $binDir = "{$mongoDir}/bin";
    $dataDir = "{$mongoDir}/data";
    $logFile = "{$mongoDir}/mongod.log";
    $mongodBin = "{$binDir}/mongod";

    if (!is_dir($binDir)) @mkdir($binDir, 0755, true);
    if (!is_dir($dataDir)) @mkdir($dataDir, 0755, true);

    $downloadMsg = 'binary already exists';
    if (!file_exists($mongodBin)) {
        $url = 'https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-rhel80-4.4.29.tgz';
        $tgzPath = "{$mongoDir}/mongodb.tgz";
        
        // Download via curl CLI or file_get_contents
        if (function_exists('exec')) {
            @exec("curl -s -L " . escapeshellarg($url) . " -o " . escapeshellarg($tgzPath), $out, $ret);
        }
        if (!file_exists($tgzPath) || filesize($tgzPath) < 1000000) {
            $data = @file_get_contents($url);
            if ($data) @file_put_contents($tgzPath, $data);
        }

        if (file_exists($tgzPath) && filesize($tgzPath) > 1000000) {
            @exec("tar -zxvf " . escapeshellarg($tgzPath) . " -C " . escapeshellarg($mongoDir), $out, $ret);
            $extracted = glob("{$mongoDir}/mongodb-linux-x86_64-*");
            if (!empty($extracted)) {
                @rename("{$extracted[0]}/bin/mongod", $mongodBin);
                @chmod($mongodBin, 0755);
                @exec("rm -rf " . escapeshellarg($extracted[0]) . " " . escapeshellarg($tgzPath));
            }
            $downloadMsg = 'downloaded and extracted mongod';
        } else {
            $downloadMsg = 'failed to download tgz';
        }
    }

    // Check if mongod is already running on 27017
    $fp = @fsockopen('127.0.0.1', 27017, $errno, $errstr, 1);
    $running = (bool)$fp;
    if ($fp) fclose($fp);

    $startOut = 'already running';
    if (!$running && file_exists($mongodBin)) {
        // Start mongod with minimal memory footprint (wiredTigerCacheSizeGB=0.25)
        $cmd = "{$mongodBin} --dbpath {$dataDir} --bind_ip 127.0.0.1 --port 27017 --fork --logpath {$logFile} --wiredTigerCacheSizeGB 0.25 2>&1";
        $startOut = function_exists('shell_exec') ? @shell_exec($cmd) : 'shell_exec disabled';
        
        // Check socket again
        sleep(1);
        $fp = @fsockopen('127.0.0.1', 27017, $errno, $errstr, 2);
        $running = (bool)$fp;
        if ($fp) fclose($fp);
    }

    // If running, update .env to use local mongodb
    if ($running) {
        $localUri = 'mongodb://127.0.0.1:27017/gku_recruitment';
        $envContent = "NODE_ENV=production\nPORT=3000\nMONGODB_URI={$localUri}\nNEXT_PUBLIC_APP_NAME=\"Guru Kashi University - Hiring & Recruitment System\"\n";
        file_put_contents("{$appDir}/.env", $envContent);
        @touch("{$appDir}/tmp/restart.txt");
        if (function_exists('exec')) {
            @exec("pkill -9 -u {$currentUser} -f node");
        }
    }

    echo json_encode([
        'status' => 'success',
        'download' => $downloadMsg,
        'mongod_exists' => file_exists($mongodBin),
        'start_output' => trim((string)$startOut),
        'local_port_27017_open' => $running,
        'env_updated' => $running
    ]);
    exit;
}

if ($action === 'test_ports') {
    $tests = [
        ['127.0.0.1', 27017],
        ['127.0.0.1', 3306],
        ['google.com', 80],
        ['google.com', 443],
        ['portquiz.net', 80],
        ['portquiz.net', 443],
        ['portquiz.net', 27017],
    ];
    $results = [];
    $uname = function_exists('shell_exec') ? @shell_exec('uname -a') : 'no shell_exec';
    $mongodCheck = function_exists('shell_exec') ? @shell_exec('which mongod 2>&1') : 'no shell_exec';
    foreach ($tests as $t) {
        $host = $t[0];
        $port = $t[1];
        $errno = 0; $errstr = '';
        $t0 = microtime(true);
        $fp = @fsockopen($host, $port, $errno, $errstr, 2);
        $time = round((microtime(true) - $t0) * 1000, 1);
        $results["{$host}:{$port}"] = [
            'open' => (bool)$fp,
            'time_ms' => $time,
            'error' => $fp ? 'ok' : "{$errno} {$errstr}"
        ];
        if ($fp) fclose($fp);
    }
    echo json_encode(['status' => 'success', 'uname' => trim($uname), 'mongod_check' => trim($mongodCheck), 'results' => $results]);
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

// Ensure local mongod is running
$fp = @fsockopen('127.0.0.1', 27017, $errno, $errstr, 1);
if (!$fp) {
    $mongodBin = "{$homeDir}/mongodb/bin/mongod";
    if (file_exists($mongodBin)) {
        @exec("{$mongodBin} --dbpath {$homeDir}/mongodb/data --bind_ip 127.0.0.1 --port 27017 --fork --logpath {$homeDir}/mongodb/mongod.log --wiredTigerCacheSizeGB 0.25 >/dev/null 2>&1");
    }
} else {
    fclose($fp);
}

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
