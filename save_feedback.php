<?php
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Données invalides."]);
    exit;
}

$file = './feedback.json';
$existing = [];

if (file_exists($file)) {
    $content = file_get_contents($file);
    $existing = json_decode($content, true) ?: [];
}

$existing[] = $data;

if (file_put_contents($file, json_encode($existing, JSON_PRETTY_PRINT))) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Échec de l'enregistrement."]);
}
?>
