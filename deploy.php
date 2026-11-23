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

if ($action === 'inspect') {
    $buildId = file_exists("{$appDir}/.next/BUILD_ID") ? trim(file_get_contents("{$appDir}/.next/BUILD_ID")) : 'not found';
    $zipExists = file_exists("{$appDir}/gku-deploy.zip");
    $zipSize = $zipExists ? filesize("{$appDir}/gku-deploy.zip") : 0;
    
    // Check running processes
    $psOut = function_exists('shell_exec') ? @shell_exec("ps aux | grep node") : 'shell_exec disabled';
    $disabled = ini_get('disable_functions');

    // Check directories in home
    $homeDirs = glob("{$homeDir}/*", GLOB_ONLYDIR);

    echo json_encode([
        'status' => 'success',
        'current_user' => $currentUser,
        'app_dir' => $appDir,
        'build_id' => $buildId,
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

// 2. Clear stale Next.js cache directory to prevent serving old SSR HTML
$cacheDir = "{$appDir}/.next/cache";
if (is_dir($cacheDir)) {
    try {
        $it = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($cacheDir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($it as $f) {
            if ($f->isDir()) {
                @rmdir($f->getRealPath());
            } else {
                @unlink($f->getRealPath());
            }
        }
        @rmdir($cacheDir);
    } catch (Exception $e) {}
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
