/* ── BASE_PATH depuis la meta ── */
const BASE_PATH = document.querySelector('meta[name="base-path"]')?.content || '/teachAdvisor';
const api = (path) => `${BASE_PATH}${path}`;

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier session active côté serveur
    try {
        const res  = await fetch(api('/api/auth-check'));
        const data = await res.json();
        if (data.authenticated) showDashboard();
    } catch {}

    document.getElementById('loginBtn').addEventListener('click', login);
    document.getElementById('password').addEventListener('keydown', e => {
        if (e.key === 'Enter') login();
    });
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('classFilter').addEventListener('change', loadStats);
});

/* ── Auth ── */
async function login() {
    const pwd = document.getElementById('password').value;
    if (!pwd) return;
    try {
        const res    = await fetch(api('/api/login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: pwd }),
        });
        const result = await res.json();
        if (result.success) {
            showDashboard();
            hideError();
        } else {
            showError();
            document.getElementById('password').value = '';
        }
    } catch {
        alert('Erreur de connexion au serveur.');
    }
}

async function logout() {
    await fetch(api('/api/logout'), { method: 'POST' });
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('password').value = '';
}

function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadStats();
}

function showError() {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('password').classList.add('error');
    setTimeout(hideError, 3000);
}

function hideError() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('password').classList.remove('error');
}

/* ── Données ── */
async function getAllFeedback() {
    const res = await fetch(api('/api/admin/feedback'));
    if (res.status === 401) { await logout(); throw new Error('Session expirée, reconnectez-vous.'); }
    if (!res.ok) throw new Error('Erreur serveur');
    return res.json();
}

/* ── Stats ── */
async function loadStats() {
    const selectedClass     = document.getElementById('classFilter').value;
    const statsSection      = document.getElementById('statsSection');
    const feedbackContainer = document.getElementById('feedbackContainer');

    statsSection.innerHTML      = '<p class="loading-text">Chargement…</p>';
    feedbackContainer.innerHTML = '';

    try {
        const data     = await getAllFeedback();
        const filtered = selectedClass ? data.filter(f => f.classroom === selectedClass) : data;

        if (filtered.length === 0) {
            const msg = selectedClass
                ? `Aucun avis pour la classe « ${selectedClass} ».`
                : 'Aucun avis enregistré.';
            statsSection.innerHTML      = `<p class="empty-text">${msg}</p>`;
            feedbackContainer.innerHTML = `<p class="empty-text">${msg}</p>`;
            return;
        }

        /* Calcul stats */
        let totalGlobal = 0, totalTeaching = 0, countGlobal = 0, countTeaching = 0;
        const distribution = {};
        for (let v = 0.5; v <= 5; v += 0.5) distribution[v] = 0;

        filtered.forEach(f => {
            const g = parseFloat(f.satisfaction);
            const t = parseFloat(f.teaching);
            if (!isNaN(g) && g > 0) { totalGlobal += g; countGlobal++; distribution[g] = (distribution[g] || 0) + 1; }
            if (!isNaN(t) && t > 0) { totalTeaching += t; countTeaching++; }
        });

        const avgGlobal   = countGlobal   > 0 ? (totalGlobal   / countGlobal).toFixed(2)   : '—';
        const avgTeaching = countTeaching > 0 ? (totalTeaching / countTeaching).toFixed(2) : '—';

        const distByInt = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        Object.entries(distribution).forEach(([k, v]) => {
            const r = Math.ceil(parseFloat(k));
            if (r >= 1 && r <= 5) distByInt[r] += v;
        });

        statsSection.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <span class="stat-number">${filtered.length}</span>
                    <span class="stat-label">Avis${selectedClass ? ' · ' + selectedClass : ''}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${avgGlobal}<small>/5</small></span>
                    <span class="stat-label">Note année scolaire</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${avgTeaching}<small>/5</small></span>
                    <span class="stat-label">Note enseignement</span>
                </div>
            </div>
            <div class="rating-breakdown">
                <p class="breakdown-title">Répartition des notes (année scolaire)</p>
                ${[5, 4, 3, 2, 1].map(star => {
                    const count = distByInt[star];
                    const pct   = countGlobal > 0 ? (count / countGlobal) * 100 : 0;
                    return `
                        <div class="rating-bar-row">
                            <span class="bar-label">${star}★</span>
                            <div class="bar-track">
                                <div class="bar-fill" style="width:${pct.toFixed(1)}%"></div>
                            </div>
                            <span class="bar-count">${count}</span>
                        </div>`;
                }).join('')}
            </div>
        `;

        /* 10 avis les plus récents */
        const recent = filtered.slice(-10).reverse();
        feedbackContainer.innerHTML = recent.map(f => {
            const date = f.timestamp
                ? new Date(f.timestamp).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : 'Date inconnue';

            const fields = [
                f.positive   && { icon: '✅', label: 'Points forts',               text: f.positive },
                f.evaluation && { icon: '🏫', label: "Évaluation de l'enseignante", text: f.evaluation },
                f.difficulty && { icon: '📐', label: 'Difficulté du travail',        text: f.difficulty },
                f.overall    && { icon: '💬', label: 'Autres remarques',             text: f.overall },
            ].filter(Boolean);

            return `
                <div class="feedback-item">
                    <div class="feedback-header">
                        <div class="feedback-meta">
                            <span class="feedback-class">${f.classroom || 'Classe inconnue'}</span>
                            <span class="feedback-date">${date}</span>
                        </div>
                        <div class="feedback-ratings">
                            <span class="rating-row">${renderStars(f.satisfaction)} <span class="rating-sub">Année</span></span>
                            ${f.teaching ? `<span class="rating-row">${renderStars(f.teaching)} <span class="rating-sub">Enseignement</span></span>` : ''}
                        </div>
                    </div>
                    ${fields.length > 0 ? `
                    <div class="feedback-fields">
                        ${fields.map(fd => `
                            <div class="feedback-field">
                                <span class="field-icon">${fd.icon}</span>
                                <div>
                                    <p class="field-label">${fd.label}</p>
                                    <p class="field-text">${escapeHtml(fd.text)}</p>
                                </div>
                            </div>`).join('')}
                    </div>` : ''}
                </div>`;
        }).join('');

    } catch (err) {
        statsSection.innerHTML = `<p class="error-text">Erreur : ${escapeHtml(err.message)}</p>`;
    }
}

/* ── Export JSON ── */
async function exportData() {
    try {
        const data = await getAllFeedback();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `teachadvisor_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        alert('Erreur export : ' + err.message);
    }
}

/* ── Vider tous les avis ── */
async function clearAllData() {
    if (!confirm('Supprimer définitivement TOUS les avis ? Cette action est irréversible.')) return;
    try {
        const res = await fetch(api('/api/admin/feedback'), { method: 'DELETE' });
        if (!res.ok) throw new Error();
        loadStats();
    } catch {
        alert('Erreur lors de la suppression.');
    }
}

/* ── Réinitialiser les codes ── */
async function resetCodes() {
    if (!confirm('Remettre tous les codes à "non utilisé" ?')) return;
    try {
        const res = await fetch(api('/api/admin/codes/reset'), { method: 'POST' });
        if (!res.ok) throw new Error();
        alert('✅ Codes réinitialisés avec succès.');
    } catch {
        alert('Erreur lors du reset des codes.');
    }
}

/* ── Helpers ── */
function renderStars(value) {
    const v = parseFloat(value) || 0;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (v >= i)
            html += '<span class="s-full">★</span>';
        else if (v >= i - 0.5)
            html += '<span class="s-half-wrap"><span class="s-half">★</span><span class="s-empty">★</span></span>';
        else
            html += '<span class="s-empty">★</span>';
    }
    return `<span class="star-display">${html}</span>`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}