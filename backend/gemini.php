<?php
require_once __DIR__ . '/config.php';

function build_gemini_prompt(array $answers, array $scores): string
{
    $summary = json_encode([
        'answers' => $answers,
        'scores' => $scores['scores'],
        'top_provider' => $scores['top_provider'],
    ], JSON_PRETTY_PRINT);

    return "You are a cloud advisor. Explain why the top provider is the best fit in 4-6 sentences. Use beginner-friendly language.\n\nData:\n{$summary}";
}

function fetch_gemini_explanation(array $answers, array $scores): ?string
{
    if (GEMINI_API_KEY === '') {
        return null;
    }

    $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' . urlencode(GEMINI_API_KEY);
    $payload = [
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => build_gemini_prompt($answers, $scores)],
                ],
            ],
        ],
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);

    $response = curl_exec($ch);
    $error = curl_error($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $status >= 400 || $error) {
        return null;
    }

    $data = json_decode($response, true);
    return $data['candidates'][0]['content']['parts'][0]['text'] ?? null;
}

function fallback_explanation(array $scores): string
{
    $top = $scores['top_provider'];

    if ($top === 'AWS') {
        return 'AWS offers the widest range of services and a very mature ecosystem. It is a safe choice for most web and general workloads, especially when you want strong scalability and global coverage. AWS also provides many tools for storage, compute, and security that grow with your project.';
    }

    if ($top === 'Azure') {
        return 'Azure is a strong fit when Microsoft tools and enterprise governance matter. It works well with Windows, Active Directory, and common corporate IT workflows. Azure also delivers solid global coverage and robust compliance features.';
    }

    return 'Google Cloud Platform shines for AI/ML and analytics-driven workloads. It is often cost-effective for prototypes and data-heavy projects while still providing reliable global infrastructure. GCP’s data services and AI tooling are a major advantage for modern applications.';
}
