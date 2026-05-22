<?php
header('Content-Type: application/json');
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);
ob_start();

set_error_handler(function (int $severity, string $message, string $file, int $line): bool {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function (Throwable $error): void {
    if (ob_get_length()) {
        ob_end_clean();
    }
    http_response_code(500);
    echo json_encode(['error' => 'Server error. Check logs.']);
    exit;
});

register_shutdown_function(function (): void {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        if (ob_get_length()) {
            ob_end_clean();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Server error. Check logs.']);
        exit;
    }
});

require_once __DIR__ . '/../../backend/scoring.php';
require_once __DIR__ . '/../../backend/db.php';
require_once __DIR__ . '/../../backend/gemini.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON payload']);
    exit;
}

$requiredFields = [
    'name', 'email', 'industry', 'project_type', 'project_scale', 'budget_range',
    'primary_region', 'active_users', 'traffic_pattern', 'database_needed',
    'file_storage_needed', 'ai_requirement', 'microsoft_integration',
    'ease_vs_control', 'existing_provider', 'compliance_requirement',
    'support_requirement'
];

foreach ($requiredFields as $field) {
    if (!isset($input[$field]) || trim((string) $input[$field]) === '') {
        http_response_code(422);
        echo json_encode(['error' => "Missing field: {$field}"]);
        exit;
    }
}

if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

if (!in_array('mysql', PDO::getAvailableDrivers(), true)) {
    http_response_code(500);
    echo json_encode(['error' => 'PDO MySQL driver not installed.']);
    exit;
}

if (DB_HOST === '' || DB_NAME === '' || DB_USER === '' || DB_PASSWORD === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Database configuration is missing.']);
    exit;
}

$scores = compute_scores($input);
$reasons = build_reasons($input, $scores);
$explanation = fetch_gemini_explanation($input, $scores);
if (!$explanation) {
    $explanation = fallback_explanation($scores);
}

try {
    $pdo = get_db_connection();
    $stmt = $pdo->prepare(
        'INSERT INTO submissions (
            name, email, industry, project_type, project_scale, budget_range, primary_region,
            active_users, traffic_pattern, database_needed, file_storage_needed, ai_requirement,
            microsoft_integration, ease_vs_control, existing_provider, compliance_requirement,
            support_requirement, aws_score, azure_score, gcp_score, final_recommendation,
            confidence_score, explanation
        ) VALUES (
            :name, :email, :industry, :project_type, :project_scale, :budget_range, :primary_region,
            :active_users, :traffic_pattern, :database_needed, :file_storage_needed, :ai_requirement,
            :microsoft_integration, :ease_vs_control, :existing_provider, :compliance_requirement,
            :support_requirement, :aws_score, :azure_score, :gcp_score, :final_recommendation,
            :confidence_score, :explanation
        )'
    );

    $stmt->execute([
        ':name' => $input['name'],
        ':email' => $input['email'],
        ':industry' => $input['industry'],
        ':project_type' => $input['project_type'],
        ':project_scale' => $input['project_scale'],
        ':budget_range' => $input['budget_range'],
        ':primary_region' => $input['primary_region'],
        ':active_users' => $input['active_users'],
        ':traffic_pattern' => $input['traffic_pattern'],
        ':database_needed' => $input['database_needed'],
        ':file_storage_needed' => $input['file_storage_needed'],
        ':ai_requirement' => $input['ai_requirement'],
        ':microsoft_integration' => $input['microsoft_integration'],
        ':ease_vs_control' => $input['ease_vs_control'],
        ':existing_provider' => $input['existing_provider'],
        ':compliance_requirement' => $input['compliance_requirement'],
        ':support_requirement' => $input['support_requirement'],
        ':aws_score' => $scores['scores']['AWS'],
        ':azure_score' => $scores['scores']['Azure'],
        ':gcp_score' => $scores['scores']['GCP'],
        ':final_recommendation' => $scores['top_provider'],
        ':confidence_score' => $scores['confidence_score'],
        ':explanation' => $explanation,
    ]);
} catch (Throwable $error) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error. Check server logs.']);
    exit;
}

$response = [
    'top_provider' => $scores['top_provider'],
    'ranking' => $scores['ranking'],
    'confidence_score' => $scores['confidence_score'],
    'reasons' => $reasons,
    'explanation' => $explanation,
];

echo json_encode($response);
