<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
// Autorise les méthodes spécifiques
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// Autorise les en-têtes spécifiques (Content-Type est crucial pour vos envois JSON)
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
$data = json_decode(file_get_contents('php://input'), true);

if (!$data || empty($data['studentCode'])) {
    http_response_code(400);
    echo json_encode(["error" => "Données incomplètes."]);
    exit;
}

$codesFile = './codes.json';
$feedbackFile = './feedback.json';
$inputCode = strtoupper(trim($data['studentCode']));

// 1. Vérification du code
if (!file_exists($codesFile)) {
    http_response_code(500);
    echo json_encode(["error" => "Système de codes indisponible."]);
    exit;
}

$codes = json_decode(file_get_contents($codesFile), true);
$foundIndex = -1;

foreach ($codes as $index => $item) {
    if (strtoupper($item['code']) === $inputCode) {
        if ($item['used']) {
            http_response_code(403);
            echo json_encode(["error" => "Ce code a déjà été utilisé."]);
            exit;
        }
        $foundIndex = $index;
        break;
    }
}

if ($foundIndex === -1) {
    http_response_code(401);
    echo json_encode(["error" => "Code invalide."]);
    exit;
}

// 2. Marquer le code comme utilisé
$codes[$foundIndex]['used'] = true;
file_put_contents($codesFile, json_encode($codes, JSON_PRETTY_PRINT));

// 3. Enregistrer l'avis
$feedbacks = [];
if (file_exists($feedbackFile)) {
    $feedbacks = json_decode(file_get_contents($feedbackFile), true) ?: [];
}

// On retire le code des données sauvegardées pour l'anonymat si désiré
// unset($data['studentCode']); 

$feedbacks[] = $data;

if (file_put_contents($feedbackFile, json_encode($feedbacks, JSON_PRETTY_PRINT))) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Erreur lors de l'enregistrement de l'avis."]);
}
?>