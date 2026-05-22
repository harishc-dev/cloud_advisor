<?php

function normalize_string(string $value): string
{
    return strtolower(trim($value));
}

function compute_scores(array $answers): array
{
    $aws = 50;
    $azure = 50;
    $gcp = 50;

    $projectType = normalize_string($answers['project_type'] ?? '');
    $scale = normalize_string($answers['project_scale'] ?? '');
    $budget = normalize_string($answers['budget_range'] ?? '');
    $region = normalize_string($answers['primary_region'] ?? '');
    $users = normalize_string($answers['active_users'] ?? '');
    $traffic = normalize_string($answers['traffic_pattern'] ?? '');
    $dbNeeded = normalize_string($answers['database_needed'] ?? '');
    $storageNeeded = normalize_string($answers['file_storage_needed'] ?? '');
    $ai = normalize_string($answers['ai_requirement'] ?? '');
    $microsoft = normalize_string($answers['microsoft_integration'] ?? '');
    $ease = normalize_string($answers['ease_vs_control'] ?? '');
    $existing = normalize_string($answers['existing_provider'] ?? '');
    $compliance = normalize_string($answers['compliance_requirement'] ?? '');
    $support = normalize_string($answers['support_requirement'] ?? '');

    if (str_contains($projectType, 'web')) {
        $aws += 10;
        $azure += 6;
        $gcp += 6;
    } elseif (str_contains($projectType, 'mobile')) {
        $aws += 8;
        $gcp += 8;
        $azure += 4;
    } elseif (str_contains($projectType, 'ai') || str_contains($projectType, 'ml')) {
        $gcp += 15;
        $aws += 8;
        $azure += 6;
    } elseif (str_contains($projectType, 'analytics')) {
        $gcp += 12;
        $aws += 8;
        $azure += 6;
    } elseif (str_contains($projectType, 'e-commerce')) {
        $aws += 12;
        $azure += 8;
        $gcp += 6;
    } elseif (str_contains($projectType, 'internal')) {
        $azure += 12;
        $aws += 8;
        $gcp += 5;
    }

    if ($scale === 'enterprise') {
        $aws += 12;
        $azure += 14;
        $gcp += 8;
    } elseif ($scale === 'smb') {
        $aws += 10;
        $azure += 8;
        $gcp += 8;
    } elseif ($scale === 'startup') {
        $aws += 8;
        $gcp += 10;
        $azure += 6;
    } elseif ($scale === 'personal') {
        $gcp += 10;
        $aws += 6;
        $azure += 5;
    }

    if (str_contains($budget, '<$100')) {
        $gcp += 12;
        $aws += 6;
        $azure += 6;
    } elseif (str_contains($budget, '$100-$500')) {
        $gcp += 10;
        $aws += 8;
        $azure += 8;
    } elseif (str_contains($budget, '$500-$2,000')) {
        $aws += 10;
        $azure += 9;
        $gcp += 8;
    } elseif (str_contains($budget, '$2,000-$10,000')) {
        $aws += 12;
        $azure += 12;
        $gcp += 8;
    } elseif (str_contains($budget, '$10,000')) {
        $aws += 14;
        $azure += 14;
        $gcp += 8;
    }

    if (str_contains($users, '100,000')) {
        $aws += 12;
        $azure += 10;
        $gcp += 10;
    } elseif (str_contains($users, '10,000-100,000')) {
        $aws += 10;
        $gcp += 9;
        $azure += 8;
    } elseif (str_contains($users, '1,000-10,000')) {
        $aws += 8;
        $gcp += 8;
        $azure += 7;
    }

    if (str_contains($traffic, 'heavy')) {
        $aws += 12;
        $gcp += 10;
        $azure += 9;
    } elseif (str_contains($traffic, 'moderate')) {
        $aws += 8;
        $gcp += 8;
        $azure += 7;
    }

    if ($dbNeeded === 'yes') {
        $aws += 6;
        $azure += 6;
        $gcp += 5;
    }

    if ($storageNeeded === 'yes') {
        $aws += 6;
        $gcp += 6;
        $azure += 5;
    }

    if ($ai === 'high') {
        $gcp += 18;
        $aws += 10;
        $azure += 8;
    } elseif ($ai === 'medium') {
        $gcp += 12;
        $aws += 8;
        $azure += 7;
    } elseif ($ai === 'low') {
        $gcp += 6;
        $aws += 5;
        $azure += 5;
    }

    if ($microsoft === 'critical') {
        $azure += 18;
        $aws += 6;
        $gcp += 4;
    } elseif ($microsoft === 'important') {
        $azure += 12;
        $aws += 6;
        $gcp += 4;
    } elseif ($microsoft === 'nice to have') {
        $azure += 8;
        $aws += 6;
        $gcp += 4;
    }

    if ($ease === 'prefer ease of use') {
        $gcp += 8;
        $azure += 7;
        $aws += 6;
    } elseif ($ease === 'prefer advanced control') {
        $aws += 10;
        $azure += 8;
        $gcp += 7;
    }

    if (str_contains($existing, 'aws')) {
        $aws += 6;
    } elseif (str_contains($existing, 'azure')) {
        $azure += 6;
    } elseif (str_contains($existing, 'gcp')) {
        $gcp += 6;
    }

    if ($compliance === 'strict') {
        $aws += 10;
        $azure += 10;
        $gcp += 8;
    } elseif ($compliance === 'moderate') {
        $aws += 6;
        $azure += 6;
        $gcp += 5;
    }

    if (str_contains($support, '24/7')) {
        $aws += 8;
        $azure += 8;
        $gcp += 6;
    } elseif (str_contains($support, 'business')) {
        $aws += 6;
        $azure += 6;
        $gcp += 5;
    }

    if (str_contains($region, 'europe') || str_contains($region, 'asia')) {
        $aws += 4;
        $azure += 4;
        $gcp += 4;
    }

    $scores = [
        'AWS' => $aws,
        'Azure' => $azure,
        'GCP' => $gcp,
    ];

    arsort($scores);
    $ranking = [];
    foreach ($scores as $provider => $score) {
        $ranking[] = ['provider' => $provider, 'score' => $score];
    }

    $topProvider = $ranking[0]['provider'];
    $topScore = $ranking[0]['score'];
    $secondScore = $ranking[1]['score'];
    $confidence = max(55, min(95, (int) (70 + ($topScore - $secondScore))));

    return [
        'scores' => $scores,
        'ranking' => $ranking,
        'top_provider' => $topProvider,
        'confidence_score' => $confidence,
    ];
}

function build_reasons(array $answers, array $scores): array
{
    $reasons = [];
    $top = $scores['top_provider'];
    $ai = normalize_string($answers['ai_requirement'] ?? '');
    $microsoft = normalize_string($answers['microsoft_integration'] ?? '');
    $scale = normalize_string($answers['project_scale'] ?? '');
    $traffic = normalize_string($answers['traffic_pattern'] ?? '');

    if ($top === 'AWS') {
        $reasons[] = 'Broad service catalog and mature ecosystem for web applications.';
        if (str_contains($traffic, 'heavy')) {
            $reasons[] = 'Strong autoscaling options for spiky traffic patterns.';
        }
        if ($scale === 'enterprise') {
            $reasons[] = 'Proven at enterprise scale with extensive global regions.';
        }
    } elseif ($top === 'Azure') {
        $reasons[] = 'Best fit for Microsoft tooling and enterprise IT needs.';
        if ($microsoft === 'critical' || $microsoft === 'important') {
            $reasons[] = 'Deep integration with Microsoft products and identity systems.';
        }
        if ($scale === 'enterprise') {
            $reasons[] = 'Strong governance and compliance features for large organizations.';
        }
    } else {
        $reasons[] = 'Excellent AI/ML and analytics capabilities for modern workloads.';
        if ($ai === 'high' || $ai === 'medium') {
            $reasons[] = 'Well-known for competitive AI tooling and data services.';
        }
        if ($scale === 'startup' || $scale === 'personal') {
            $reasons[] = 'Cost-effective for early-stage and prototype projects.';
        }
    }

    if (count($reasons) < 3) {
        $reasons[] = 'Balanced mix of performance, global reach, and service options.';
    }

    return array_slice($reasons, 0, 4);
}
