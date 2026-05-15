<?php
header("Access-Control-Allow-Origin: *");
// Autorise les méthodes spécifiques
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
// Autorise les en-têtes spécifiques (Content-Type est crucial pour vos envois JSON)
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
session_start();

$data = json_decode(file_get_contents('php://input'), true);
$password = $data['password'] ?? '';

// C'est ici que votre mot de passe est en sécurité (côté serveur)
$ADMIN_PASSWORD = "votre_mot_de_passe_secret_2024"; 

if ($password === $ADMIN_PASSWORD) {
    $_SESSION['admin_auth'] = true;
    echo json_encode(["success" => true]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "error" => "Mot de passe incorrect"]);
}
?>