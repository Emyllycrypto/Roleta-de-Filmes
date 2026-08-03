const INITIAL_MOVIES = [
  "Os observadores", "Apostolo", "Bugoia", "Maníaco no controle", 
  "A mulher da cabine 10", "Canina", "Hamnet", "o sexto sentido", 
  "Pecadores", "Cisne negro", "Carol", "A forma da Água", 
  "Zona de interesse", "Poseidon", "Anatomia de uma queda", "A Origem", 
  "Plano de voo", "Fragmentado", "Pacificado", "Simplesmente Acontece", 
  "Crush: Amor colorido", "Missão Refúgio", "Um pequeno favor", 
  "High School Music 2", "High School Music 3", "O mal que nos habita", 
  "A viagem de Chiriro", "Elize", "Casamento sangrento", 
  "Red - Crescer é uma Fera", "Comer,Rezar,Amar", "Central do Brasil", 
  "Estômago", "Homem que copiava", "Bacurau", "Casamento armado", 
  "Devoradores de estrelas"
];

const oscarIconUrl = "img/oscar-award.png";

let movies = [];
let currentRotation = 0;
let isSpinning = false;
let pendingMovieIndex = null;

const card = document.getElementById('card');
const btnToBack = document.getElementById('btnToBack');
const btnToFront = document.getElementById('btnToFront');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const btnSpin = document.getElementById('btnSpin');
const resultArea = document.getElementById('resultArea');
const selectedMovieTitle = document.getElementById('selectedMovieTitle');
const btnConfirm = document.getElementById('btnConfirm');
const movieList = document.getElementById('movieList');
const btnResetList = document.getElementById('btnResetList');

// Cores Pastel/Douradas alternadas
const sliceColors = [
  '#fff3a8', '#ffe89c', '#ffd98e', '#ffca80', 
  '#ffeaa7', '#fdcb6e', '#ffe0b2', '#fff176'
];

// === CARREGAR OS SONS ===
// === CARREGAR OS SONS ===
const spinSound = new Audio('som/roleta-inicio.mp3');
const winSound = new Audio('som/minecraft-firework.mp3');

spinSound.preload = 'auto';
winSound.preload = 'auto';
// Funções de Controle de Áudio
function playSpinSound() {
  spinSound.currentTime = 0;
  spinSound.play().catch(error => console.log("Erro áudio inicio:", error));

  // Desbloqueia o som de vitória no celular preparando o buffer no clique do usuário
  winSound.play().then(() => {
    winSound.pause();
    winSound.currentTime = 0;
  }).catch(() => {});
}

function stopSpinSound() {
  spinSound.pause();
  spinSound.currentTime = 0;
}

function playWinSound() {
  winSound.currentTime = 0;
  winSound.play().catch(error => console.log("Aguardando interação:", error));
}

// === CARREGAR E SALVAR FILMES ===
function loadMovies() {
  const saved = localStorage.getItem('my_movie_wheel_data_v3');
  if (saved) {
    movies = JSON.parse(saved);
  } else {
    movies = INITIAL_MOVIES.map(title => ({ title, watched: false, rating: 0 }));
  }
}

function saveMovies() {
  localStorage.setItem('my_movie_wheel_data_v3', JSON.stringify(movies));
}

// === DESENHO DA ROLETA ===
function drawWheel() {
  const activeMovies = movies.filter(m => !m.watched);
  const total = activeMovies.length;
  const width = canvas.width;
  const center = width / 2;
  const radius = center - 12;

  ctx.clearRect(0, 0, width, width);

  if (total === 0) {
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#201b18';
    ctx.fill();
    ctx.fillStyle = '#ffe680';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Todos assistidos! 🎉', center, center);
    btnSpin.disabled = true;
    return;
  }

  btnSpin.disabled = false;
  const sliceAngle = (2 * Math.PI) / total;

  activeMovies.forEach((movie, index) => {
    const angle = index * sliceAngle + currentRotation;
    
    // 1. Desenho da Fatia
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = sliceColors[index % sliceColors.length];
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Desenho do Texto
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle + sliceAngle / 2);

    let text = movie.title;
    if (text.length > 20) text = text.substring(0, 18) + '...';

    const baseFontSize = total > 20 ? 12 : 15; 
    const textPositionX = radius * 0.58; 

    ctx.translate(textPositionX, 0);
    
    const scaleFactor = Math.max(0.85, 1 - (total * 0.008)); 
    ctx.scale(scaleFactor * 1.15, scaleFactor); 

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${baseFontSize}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#4a3b32';

    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 3;

    ctx.fillText(text, 0, 0);

    ctx.restore();
  });
}

// === FUNÇÃO PARA GIRAR A ROLETA ===
function spinWheel() {
  if (isSpinning) return;
  const activeMovies = movies.filter(m => !m.watched);
  if (activeMovies.length === 0) return;

  // Toca o som do início do giro no clique
  playSpinSound();

  isSpinning = true;
  btnSpin.disabled = true;
  resultArea.classList.add('hidden');

  const totalSlices = activeMovies.length;
  const sliceAngle = (2 * Math.PI) / totalSlices;
  const selectedActiveIndex = Math.floor(Math.random() * totalSlices);
  
  const extraSpins = (Math.floor(Math.random() * 5) + 8) * 2 * Math.PI;
  const targetAngle = (3 * Math.PI / 2) - (selectedActiveIndex * sliceAngle) - (sliceAngle / 2);
  
  const startRotation = currentRotation % (2 * Math.PI);
  const totalRotation = startRotation + extraSpins + (targetAngle - startRotation);

  const duration = 9000; // Duração de 4 segundos
  const startTime = performance.now();

  function animate(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 4);
    
    currentRotation = startRotation + (totalRotation - startRotation) * easeOut;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      
      // Stop no som de giro e Play no som de vitória
      stopSpinSound();
      playWinSound();

      const selectedMovie = activeMovies[selectedActiveIndex];
      pendingMovieIndex = movies.findIndex(m => m.title === selectedMovie.title);

      selectedMovieTitle.textContent = selectedMovie.title;
      resultArea.classList.remove('hidden');

      if (typeof confetti === 'function') {
        confetti({
          particleCount: 90,
          spread: 65,
          origin: { y: 0.7 },
          colors: ['#ffe680', '#ffd9b3', '#a8e6cf', '#ffaaa5']
        });
      }
    }
  }

  requestAnimationFrame(animate);
}

// === OUTRAS FUNÇÕES DA APLICAÇÃO ===
function confirmSelection() {
  if (pendingMovieIndex !== null) {
    movies[pendingMovieIndex].watched = true;
    saveMovies();
    resultArea.classList.add('hidden');
    pendingMovieIndex = null;
    drawWheel();
    renderList();
  }
}

function renderList() {
  if (!movieList) return;
  movieList.innerHTML = '';
  movies.forEach((movie, index) => {
    const li = document.createElement('li');
    li.className = `movie-item ${movie.watched ? 'watched' : ''}`;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'movie-title';
    titleSpan.textContent = movie.title;

    const starsDiv = document.createElement('div');
    starsDiv.className = 'stars';
    
    for (let i = 1; i <= 5; i++) {
      const trophy = document.createElement('img');
      trophy.src = oscarIconUrl;
      trophy.className = `oscar-trophy ${i <= movie.rating ? 'active' : ''}`;
      trophy.addEventListener('click', () => setRating(index, i));
      starsDiv.appendChild(trophy);
    }

    li.appendChild(titleSpan);
    li.appendChild(starsDiv);
    movieList.appendChild(li);
  });
}

function setRating(index, rating) {
  if (movies[index].rating === rating) {
    movies[index].rating = 0;
  } else {
    movies[index].rating = rating;
  }
  saveMovies();
  renderList();
}

function resetAllMovies() {
  if (confirm("Deseja restaurar todos os filmes desmarcados?")) {
    movies.forEach(m => {
      m.watched = false;
      m.rating = 0;
    });
    saveMovies();
    drawWheel();
    renderList();
  }
}

// === REGISTRO DE EVENTOS DE BOTÃO ===
if (btnSpin) btnSpin.addEventListener('click', spinWheel);
if (btnConfirm) btnConfirm.addEventListener('click', confirmSelection);
if (btnResetList) btnResetList.addEventListener('click', resetAllMovies);

if (btnToBack && card) btnToBack.addEventListener('click', () => card.classList.add('flipped'));
if (btnToFront && card) btnToFront.addEventListener('click', () => card.classList.remove('flipped'));

// === INICIALIZAÇÃO DA PÁGINA (Corrigido para evitar erro de init/initWheel) ===
document.addEventListener('DOMContentLoaded', () => {
  loadMovies();
  drawWheel();
  renderList();
});