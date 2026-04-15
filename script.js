// Configuration
const CONFIG = {
    STORAGE_KEY: 'feedback_submissions',
    MAX_SUBMISSIONS: 1000 // Limite pour éviter de surcharger le localStorage
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

function initializeForm() {
    const form = document.getElementById('feedbackForm');
    if(form){
        form.addEventListener('submit', handleSubmit);
        initializeRating();
    }   
}

function initializeRating() {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        star.addEventListener('mouseenter', function() {
            const rating = index + 1;
            highlightStars(rating);
        });
        
        star.addEventListener('mouseleave', function() {
            const checkedStar = document.querySelector('input[name="satisfaction"]:checked');
            if (checkedStar) {
                highlightStars(parseInt(checkedStar.value));
            } else {
                resetStars();
            }
        });
        
        star.addEventListener('click', function() {
            const rating = index + 1;
            document.getElementById('star' + rating).checked = true;
            highlightStars(rating);
        });
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.style.color = '#f59e0b';
        } else {
            star.style.color = '#d1d5db';
        }
    });
}

function resetStars() {
    const stars = document.querySelectorAll('.star');
    stars.forEach(star => {
        star.style.color = '#d1d5db';
    });
}


async function handleSubmit(event) {
    event.preventDefault();
    
    const button = event.target.querySelector('.btn-submit');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    // Désactiver le bouton et afficher le loading
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
        // Récupérer les données du formulaire
        const formData = new FormData(event.target);
        const feedback = {
            id: generateId(),
            timestamp: new Date().toISOString(),
            satisfaction: formData.get('satisfaction'),
            positive: formData.get('positive'),
            improvements: formData.get('improvements'),
            overall: formData.get('overall'),
            classroom: document.getElementById('classroom').value
        };
        
        // Valider les données
        if (!validateFeedback(feedback)) {
            throw new Error('Veuillez remplir au moins la note et un commentaire.');
        }
        
        // Simuler un délai d'envoi pour l'UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sauvegarder localement
        saveFeedback(feedback);
        
        // Afficher le message de succès
        showSuccessMessage();
        
    } catch (error) {
        showError(error.message);
        
        // Réactiver le bouton
        button.disabled = false;
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
    }
}

function validateFeedback(feedback) {
    if (!feedback.satisfaction) {
        return false;
    }
    
    if (!feedback.positive.trim() && !feedback.improvements.trim() && !feedback.overall.trim()) {
        return false;
    }
    
    return true;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function saveFeedback(feedback) {
    try {
        console.log('🚀 Envoi des données:', feedback);
        
        const response = await fetch('./save_feedback.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        });

        console.log('📡 Statut de la réponse:', response.status);
        
        const result = await response.json();
        console.log('📥 Réponse du serveur:', result);

        if (!response.ok) {
            throw new Error(result.error || 'Erreur serveur');
        }

        return result;
        
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        throw error;
    }
}




function showSuccessMessage() {
    const overlay = document.getElementById('overlay');
    const successMessage = document.getElementById('successMessage');
    
    overlay.style.display = 'block';
    successMessage.style.display = 'block';
    
    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
}

function showError(message) {
    alert(message); // Simple pour cet exemple, vous pourriez créer une modal d'erreur plus élégante
}

function resetForm() {
    // Cacher le message de succès
    document.getElementById('overlay').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    document.body.style.overflow = 'auto';
    
    // Reset du formulaire
    const form = document.getElementById('feedbackForm');
    form.reset();
    
    // Reset des étoiles
    resetStars();
    
    // Réactiver le bouton
    const button = form.querySelector('.btn-submit');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    button.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
}

// Fonction pour récupérer tous les avis (pour l'administrateur)
    async function getAllFeedback() {
    try {
        console.log('🔍 Chargement des données depuis feedback.json...');
        
        const response = await fetch('./feedback.json');
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
        
        const jsonData = await response.json();
        console.log('✅ Données récupérées depuis feedback.json:', jsonData);
        
        // Vérifier que c'est un tableau
        if (!Array.isArray(jsonData)) {
            console.error('❌ Le fichier JSON ne contient pas un tableau:', typeof jsonData);
            return [];
        }
        
        return jsonData;
        
    } catch (error) {
        console.error('❌ Erreur lors de la récupération des données JSON:', error);
        return [];
    }
}


// Fonction pour exporter les données (à utiliser dans la console du navigateur)
async function exportFeedback() {
    const data = await getAllFeedback();
    const jsonString = JSON.stringify(data, null, 2);
    
    // Créer un fichier de téléchargement
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `avis_scolaires_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

// Fonction pour afficher les statistiques (à utiliser dans la console)
function showStats() {
    const data = getAllFeedback();
    
    if (data.length === 0) {
        console.log('Aucun avis collecté pour le moment.');
        return;
    }
    
    const stats = {
        total: data.length,
        ratings: {},
        averageRating: 0
    };
    
    let totalRating = 0;
    data.forEach(feedback => {
        const rating = parseInt(feedback.satisfaction);
        stats.ratings[rating] = (stats.ratings[rating] || 0) + 1;
        totalRating += rating;
    });
    
    stats.averageRating = (totalRating / data.length).toFixed(2);
    
    console.log('📊 Statistiques des avis:');
    console.log(`Total d'avis: ${stats.total}`);
    console.log(`Note moyenne: ${stats.averageRating}/5`);
    console.log('Répartition des notes:', stats.ratings);
    
    return stats;
}

function closeModal() {
    resetForm();
}

// Rendre ces fonctions accessibles globalement pour l'administration
window.exportFeedback = exportFeedback;
window.showStats = showStats;
window.getAllFeedback = getAllFeedback;
