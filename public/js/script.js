/* ── BASE_PATH depuis la meta ── */
const BASE_PATH = document.querySelector('meta[name="base-path"]')?.content || '/teachAdvisor';
const api = (path) => `${BASE_PATH}${path}`;

/* ── Initialisation des étoiles ── */
document.querySelectorAll('.stars').forEach(container => {
    for (let i = 1; i <= 5; i++) {
        const wrap = document.createElement('span');
        wrap.className = 'star-wrap';
        wrap.dataset.value = i;
        wrap.innerHTML = `
            <span class="star-bg">★</span>
            <span class="star-half">★</span>
            <span class="star-full">★</span>
            <span class="zone zone-half" data-half="${i - 0.5}"></span>
            <span class="zone zone-full" data-full="${i}"></span>
        `;
        container.appendChild(wrap);
    }
    setupStarEvents(container);
});

function setupStarEvents(container) {
    container.querySelectorAll('.zone').forEach(zone => {
        zone.addEventListener('mouseover', () => {
            const val = parseFloat(zone.dataset.half ?? zone.dataset.full);
            highlightStars(container, val);
        });
        zone.addEventListener('click', () => {
            const val = parseFloat(zone.dataset.half ?? zone.dataset.full);
            container.dataset.rating = val;
            highlightStars(container, val);
        });
    });
    container.addEventListener('mouseleave', () => {
        highlightStars(container, parseFloat(container.dataset.rating) || 0);
    });
}

function highlightStars(container, value) {
    container.querySelectorAll('.star-wrap').forEach(wrap => {
        const star = parseFloat(wrap.dataset.value);
        const half = wrap.querySelector('.star-half');
        const full = wrap.querySelector('.star-full');
        if (value >= star) {
            full.style.opacity = '1'; half.style.opacity = '0';
        } else if (value >= star - 0.5) {
            full.style.opacity = '0'; half.style.opacity = '1';
        } else {
            full.style.opacity = '0'; half.style.opacity = '0';
        }
    });
}

/* ── Soumission du formulaire ── */
document.getElementById('feedbackForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const button = this.querySelector('.btn-submit');

    const ratingGlobal   = document.getElementById('rating-global').dataset.rating;
    const ratingTeaching = document.getElementById('rating-teaching').dataset.rating;

    if (!ratingGlobal || ratingGlobal === '0' || !ratingTeaching || ratingTeaching === '0') {
        alert('Veuillez donner une note (étoiles) aux deux premières questions avant d\'envoyer.');
        return;
    }

    button.disabled = true;

    const feedback = {
        classroom:   document.getElementById('classroom').value,
        satisfaction: ratingGlobal,
        teaching:    ratingTeaching,
        positive:    document.getElementById('positive').value,
        evaluation:  document.getElementById('evaluation').value,
        difficulty:  document.getElementById('difficulty').value,
        overall:     document.getElementById('overall').value,
        studentCode: document.getElementById('studentCode').value.trim().toUpperCase(),
    };

    try {
        const response = await fetch(api('/api/feedback'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedback),
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || 'Une erreur est survenue.');

        document.getElementById('overlay').style.display = 'block';
        document.getElementById('successMessage').style.display = 'block';
        document.body.style.overflow = 'hidden';

    } catch (error) {
        alert('Erreur : ' + error.message);
        button.disabled = false;
    }
});