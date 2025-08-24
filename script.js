// Configurações da API do GitHub
const GITHUB_API_BASE = 'https://api.github.com';
const USERNAME = 'JorgeFilipi';

// Elementos do DOM
const loading = document.getElementById('loading');
const reposGrid = document.getElementById('repos-grid');
const noRepos = document.getElementById('no-repos');
const searchInput = document.getElementById('search-input');
const filterButtons = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const modal = document.getElementById('repo-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close');

// Estado da aplicação
let allRepos = [];
let filteredRepos = [];
let currentFilter = 'all';
let currentSort = 'updated';

// Cores das linguagens de programação
const languageColors = {
    'Python': '#3776AB',
    'Java': '#ED8B00',
    'JavaScript': '#F7DF1E',
    'TypeScript': '#3178C6',
    'HTML': '#E34F26',
    'CSS': '#1572B6',
    'PHP': '#777BB4',
    'C#': '#178600',
    'C++': '#F34B7D',
    'C': '#555555',
    'Go': '#00ADD8',
    'Rust': '#DEA584',
    'Ruby': '#CC342D',
    'Swift': '#FA7343',
    'Kotlin': '#F18E33',
    'Scala': '#DC322F',
    'Shell': '#4EAA25',
    'PowerShell': '#012456',
    'Dockerfile': '#384D54',
    'Makefile': '#427819',
    'Vue': '#4FC08D',
    'React': '#61DAFB',
    'Angular': '#DD0031',
    'Node.js': '#339933'
};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadUserProfile();
        await loadRepositories();
        setupEventListeners();
        updateStats();
        generateLanguagesChart();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showError('Erro ao carregar dados. Tente novamente mais tarde.');
    }
});

// Carregar perfil do usuário
async function loadUserProfile() {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/users/${USERNAME}`);
        const user = await response.json();
        
        document.getElementById('profile-name').textContent = user.name || user.login;
        document.getElementById('profile-bio').textContent = user.bio || 'Desenvolvedor Back-end Junior';
        document.getElementById('followers-count').textContent = user.followers;
        document.getElementById('following-count').textContent = user.following;
        document.getElementById('repos-count').textContent = user.public_repos;
        
        // Atualizar avatar se necessário
        const avatar = document.getElementById('profile-avatar');
        if (user.avatar_url) {
            avatar.src = user.avatar_url;
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Carregar repositórios
async function loadRepositories() {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/users/${USERNAME}/repos?sort=updated&per_page=100`);
        allRepos = await response.json();
        
        // Filtrar repositórios (excluir forks por padrão)
        allRepos = allRepos.filter(repo => !repo.fork);
        
        filteredRepos = [...allRepos];
        displayRepositories();
        hideLoading();
    } catch (error) {
        console.error('Erro ao carregar repositórios:', error);
        hideLoading();
        showError('Erro ao carregar repositórios.');
    }
}

// Exibir repositórios
function displayRepositories() {
    if (filteredRepos.length === 0) {
        reposGrid.style.display = 'none';
        noRepos.style.display = 'block';
        return;
    }
    
    reposGrid.style.display = 'grid';
    noRepos.style.display = 'none';
    
    reposGrid.innerHTML = filteredRepos.map(repo => createRepoCard(repo)).join('');
}

// Criar card de repositório
function createRepoCard(repo) {
    const language = repo.language || 'Outro';
    const languageColor = languageColors[language] || '#00d4ff';
    
    return `
        <div class="repo-card" onclick="openRepoModal('${repo.full_name}')">
            <div class="repo-header">
                <div>
                    <a href="${repo.html_url}" target="_blank" class="repo-name" onclick="event.stopPropagation()">
                        ${repo.name}
                    </a>
                    <span class="repo-visibility">${repo.private ? 'Privado' : 'Público'}</span>
                </div>
            </div>
            
            <p class="repo-description">${repo.description || 'Sem descrição disponível.'}</p>
            
            <div class="repo-meta">
                <div class="repo-language">
                    <span class="language-color" style="background-color: ${languageColor}"></span>
                    ${language}
                </div>
                <div class="repo-stats">
                    <span class="repo-stat">
                        <i class="fas fa-star"></i>
                        ${repo.stargazers_count}
                    </span>
                    <span class="repo-stat">
                        <i class="fas fa-code-branch"></i>
                        ${repo.forks_count}
                    </span>
                    <span class="repo-stat">
                        <i class="fas fa-eye"></i>
                        ${repo.watchers_count}
                    </span>
                </div>
            </div>
            
            ${repo.topics && repo.topics.length > 0 ? `
                <div class="repo-topics">
                    ${repo.topics.slice(0, 3).map(topic => `<span class="repo-topic">${topic}</span>`).join('')}
                    ${repo.topics.length > 3 ? `<span class="repo-topic">+${repo.topics.length - 3}</span>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

// Abrir modal do repositório
async function openRepoModal(repoFullName) {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}`);
        const repo = await response.json();
        
        const languagesResponse = await fetch(`${GITHUB_API_BASE}/repos/${repoFullName}/languages`);
        const languages = await languagesResponse.json();
        
        modalBody.innerHTML = createModalContent(repo, languages);
        modal.style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar detalhes do repositório:', error);
    }
}

// Criar conteúdo do modal
function createModalContent(repo, languages) {
    const languageBars = Object.entries(languages)
        .sort(([,a], [,b]) => b - a)
        .map(([lang, bytes]) => {
            const total = Object.values(languages).reduce((a, b) => a + b, 0);
            const percentage = ((bytes / total) * 100).toFixed(1);
            const color = languageColors[lang] || '#00d4ff';
            
            return `
                <div class="language-bar">
                    <span class="language-name">${lang}</span>
                    <div class="language-progress">
                        <div class="language-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                    </div>
                    <span class="language-percentage">${percentage}%</span>
                </div>
            `;
        }).join('');
    
    return `
        <h2>${repo.name}</h2>
        <p>${repo.description || 'Sem descrição disponível.'}</p>
        
        <div style="margin: 20px 0;">
            <a href="${repo.html_url}" target="_blank" style="color: #00d4ff; text-decoration: none;">
                <i class="fab fa-github"></i> Ver no GitHub
            </a>
            ${repo.homepage ? `
                <a href="${repo.homepage}" target="_blank" style="color: #00d4ff; text-decoration: none; margin-left: 20px;">
                    <i class="fas fa-external-link-alt"></i> Demo
                </a>
            ` : ''}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0;">
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                <strong>Estrelas</strong><br>
                ${repo.stargazers_count}
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                <strong>Forks</strong><br>
                ${repo.forks_count}
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                <strong>Watchers</strong><br>
                ${repo.watchers_count}
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px;">
                <strong>Issues</strong><br>
                ${repo.open_issues_count}
            </div>
        </div>
        
        <h3>Linguagens</h3>
        <div class="languages-chart">
            ${languageBars}
        </div>
        
        <div style="margin-top: 20px;">
            <strong>Criado em:</strong> ${new Date(repo.created_at).toLocaleDateString('pt-BR')}<br>
            <strong>Última atualização:</strong> ${new Date(repo.updated_at).toLocaleDateString('pt-BR')}
        </div>
    `;
}

// Configurar event listeners
function setupEventListeners() {
    // Busca
    searchInput.addEventListener('input', filterRepositories);
    
    // Filtros
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = button.dataset.filter;
            filterRepositories();
        });
    });
    
    // Ordenação
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        sortRepositories();
        displayRepositories();
    });
    
    // Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Filtrar repositórios
function filterRepositories() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredRepos = allRepos.filter(repo => {
        const matchesSearch = repo.name.toLowerCase().includes(searchTerm) ||
                            (repo.description && repo.description.toLowerCase().includes(searchTerm));
        
        const matchesFilter = currentFilter === 'all' || 
                            (repo.language && repo.language.toLowerCase() === currentFilter.toLowerCase());
        
        return matchesSearch && matchesFilter;
    });
    
    sortRepositories();
    displayRepositories();
}

// Ordenar repositórios
function sortRepositories() {
    filteredRepos.sort((a, b) => {
        switch (currentSort) {
            case 'stars':
                return b.stargazers_count - a.stargazers_count;
            case 'forks':
                return b.forks_count - a.forks_count;
            case 'name':
                return a.name.localeCompare(b.name);
            case 'updated':
            default:
                return new Date(b.updated_at) - new Date(a.updated_at);
        }
    });
}

// Atualizar estatísticas
function updateStats() {
    const totalRepos = allRepos.length;
    const totalStars = allRepos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = allRepos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const totalViews = allRepos.reduce((sum, repo) => sum + repo.watchers_count, 0);
    
    document.getElementById('total-repos').textContent = totalRepos;
    document.getElementById('total-stars').textContent = totalStars;
    document.getElementById('total-forks').textContent = totalForks;
    document.getElementById('total-views').textContent = totalViews;
}

// Gerar gráfico de linguagens
function generateLanguagesChart() {
    const languageStats = {};
    
    allRepos.forEach(repo => {
        if (repo.language) {
            languageStats[repo.language] = (languageStats[repo.language] || 0) + 1;
        }
    });
    
    const sortedLanguages = Object.entries(languageStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    const total = sortedLanguages.reduce((sum, [, count]) => sum + count, 0);
    
    const chartHTML = sortedLanguages.map(([lang, count]) => {
        const percentage = ((count / total) * 100).toFixed(1);
        const color = languageColors[lang] || '#00d4ff';
        
        return `
            <div class="language-bar">
                <span class="language-name">${lang}</span>
                <div class="language-progress">
                    <div class="language-fill" style="width: ${percentage}%; background-color: ${color}"></div>
                </div>
                <span class="language-percentage">${percentage}%</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('languages-chart').innerHTML = chartHTML;
}

// Utilitários
function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    noRepos.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erro</h3>
        <p>${message}</p>
    `;
    noRepos.style.display = 'block';
    reposGrid.style.display = 'none';
}

// Animações de entrada
function animateStats() {
    const stats = document.querySelectorAll('.stat-content h3');
    stats.forEach((stat, index) => {
        setTimeout(() => {
            stat.style.opacity = '0';
            stat.style.transform = 'translateY(20px)';
            stat.style.transition = 'all 0.5s ease';
            
            setTimeout(() => {
                stat.style.opacity = '1';
                stat.style.transform = 'translateY(0)';
            }, 100);
        }, index * 200);
    });
}

// Executar animações após carregamento
setTimeout(animateStats, 1000);
