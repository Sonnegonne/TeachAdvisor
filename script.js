document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('feedbackForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        // Initialisation des systèmes d'étoiles
        buildStars(document.getElementById('rating-global'));
        buildStars(document.getElementById('rating-teaching'));
    }
});

/**
 * Construit le système de notation par demi-étoiles
 */
function buildStars(container) {
    const COUNT = 5;
    let selected = 0;

    for (let i = 1; i <= COUNT; i++) {
        const wrap = document.createElement('div');
        wrap.className = 'star-wrap';
        wrap.innerHTML = `
            <span class="star-bg">★</span>
            <span class="star-half">★</span>
            <span class="star-full">★</span>
            <span class="zone zone-half" data-val="${i - 0.5}"></span>
            <span class="zone zone-full" data-val="${i}"></span>
        `;
        container.appendChild(wrap);
    }

    function render(val) {
        container.querySelectorAll('.star-wrap').forEach((w, idx) => {
            const n = idx + 1;
            const half = w.querySelector('.star-half');
            const full = w.querySelector('.star-full');
            
            if (val >= n) {
                full.style.opacity = 1;
                half.style.opacity = 0;
            } else if (val >= n - 0.5) {
                full.style.opacity = 0;
                half.style.opacity = 1;
            } else {
                full.style.opacity = 0;
                half.style.opacity = 0;
            }
        });
    }

    container.addEventListener('mousemove', e => {
        const zone = e.target.closest('[data-val]');
        if (!zone) return;
        render(parseFloat(zone.dataset.val));
    });

    container.addEventListener('mouseleave', () => render(selected));

    container.addEventListener('click', e => {
        const zone = e.target.closest('[data-val]');
        if (!zone) return;
        selected = parseFloat(zone.dataset.val);
        container.dataset.rating = selected;
        render(selected);
    });
}

/**
 * Gère la soumission du formulaire avec validation
 */
async function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const button = form.querySelector('.btn-submit');

    // 1. Validation des notes (Obligatoire)
    const ratingGlobal = document.getElementById('rating-global').dataset.rating;
    const ratingTeaching = document.getElementById('rating-teaching').dataset.rating;

    if (!ratingGlobal || ratingGlobal === "0" || !ratingTeaching || ratingTeaching === "0") {
        alert("Veuillez donner une note (étoiles) aux deux premières questions avant d'envoyer.");
        return;
    }

    // Désactivation du bouton pour éviter les doubles envois
    button.disabled = true;

    // 2. Préparation des données
    const formData = new FormData(form);
    const feedback = {
        timestamp: new Date().toISOString(),
        classroom: document.getElementById('classroom').value,
        satisfaction: ratingGlobal,
        teaching: ratingTeaching,
        positive: formData.get('positive'),
        evaluation: formData.getAll('positive')[1] || "", // Récupère le 2ème textarea
        difficulty: formData.getAll('positive')[2] || "", // Récupère le 3ème textarea
        overall: formData.get('overall'),
        studentCode: formData.get('studentCode').trim().toUpperCase() // Code unique
    };

    try {
        // 3. Envoi au serveur (save_feedback.php)
        const response = await fetch('./save_feedback.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedback)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Une erreur est survenue lors de l'envoi.");
        }

        // 4. Affichage du succès
        document.getElementById('overlay').style.display = 'block';
        document.getElementById('successMessage').style.display = 'block';
        document.body.style.overflow = 'hidden'; // Empêche le scroll

    } catch (error) {
        alert("Erreur : " + error.message);
        button.disabled = false;
    }
}