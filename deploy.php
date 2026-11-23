<?php
/**
 * Guru Kashi University - Automated Deployment Webhook
 * Extracts gku-deploy.zip and restarts Phusion Passenger.
 */

// 1. Authenticate Request
$SECRET_TOKEN = 'gku_deploy_2026';
$receivedToken = $_GET['token'] ?? $_POST['token'] ?? '';

header('Content-Type: application/json');

if (!hash_equals($SECRET_TOKEN, $receivedToken)) {
    http_response_code(403);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unauthorized: Invalid or missing token.'
    ]);
    exit;
}

// 2. Locate App Directory and Zip File
$candidates = [
    '/home/prvmcqeftpe4/gku-recruitment-system.git',
    dirname(__DIR__) . '/gku-recruitment-system.git',
    __DIR__,
    dirname(__DIR__)
];

$appDir = null;
foreach ($candidates as $candidate) {
    if (is_dir($candidate) && (file_exists($candidate . '/gku-deploy.zip') || file_exists($candidate . '/server.js'))) {
        $appDir = $candidate;
        break;
    }
}

if (!$appDir) {
    $appDir = '/home/prvmcqeftpe4/gku-recruitment-system.git';
}

$zipPath = $appDir . '/gku-deploy.zip';

// Also check current folder for zip
if (!file_exists($zipPath) && file_exists(__DIR__ . '/gku-deploy.zip')) {
    $zipPath = __DIR__ . '/gku-deploy.zip';
}

if (!file_exists($zipPath)) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'gku-deploy.zip not found',
        'searched_paths' => [
            $appDir . '/gku-deploy.zip',
            __DIR__ . '/gku-deploy.zip'
        ]
    ]);
    exit;
}

// 3. Extract Zip Archive
$extracted = false;
$method = 'none';

if (class_exists('ZipArchive')) {
    $zip = new ZipArchive();
    if ($zip->open($zipPath) === TRUE) {
        $zip->extractTo($appDir);
        $numFiles = $zip->numFiles;
        $zip->close();
        $extracted = true;
        $method = "ZipArchive ($numFiles files)";
    }
}

if (!$extracted && function_exists('exec')) {
    @exec("unzip -o " . escapeshellarg($zipPath) . " -d " . escapeshellarg($appDir), $output, $returnVar);
    if ($returnVar === 0) {
        $extracted = true;
        $method = 'exec(unzip)';
    }
}

if (!$extracted) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to extract zip file. Neither ZipArchive nor exec unzip succeeded.'
    ]);
    exit;
}

// Clean up zip to save storage
@unlink($zipPath);

// 4. Signal Phusion Passenger to restart
$tmpDir = $appDir . '/tmp';
if (!is_dir($tmpDir)) {
    @mkdir($tmpDir, 0755, true);
}
@touch($tmpDir . '/restart.txt');

echo json_encode([
    'status' => 'success',
    'message' => 'GKU Recruitment System deployed and Passenger restart triggered successfully!',
    'method' => $method,
    'app_dir' => $appDir,
    'timestamp' => date('Y-m-d H:i:s')
]);
