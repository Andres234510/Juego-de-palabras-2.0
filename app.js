// Sistema de puntuación mejorado
const scoringSystem = {
    getWordBasePoints: (word) => {
        if (word.length >= 8) return 5;
        if (word.length >= 6) return 3;
        return 1;
    },
    getUniqueWordBonus: (word, allPlayerWords) => {
        const isUnique = !allPlayerWords.some(playerWord => 
            playerWord.toLowerCase() === word.toLowerCase() && 
            playerWord !== word
        );
        return isUnique ? 2 : 0;
    },
    categories: {
        NAMES: 'names',
        COUNTRIES: 'countries',
        ANIMALS: 'animals',
        FOOD: 'food'
    },
    categoryWords: {
        names: ['JUAN', 'PEDRO', 'MARIA', 'ANA', 'ANTONIO', 'ALEJANDRO'],
        countries: ['ARGENTINA', 'ALEMANIA', 'AUSTRALIA', 'ANGOLA'],
        animals: ['AGUILA', 'ANTILOPE', 'ARDILLA', 'ABEJA'],
        food: ['ARROZ', 'ATUN', 'AJO', 'AGUACATE']
    },
    getCategoryBonus: (word) => {
        let bonus = 0;
        Object.entries(scoringSystem.categoryWords).forEach(([category, words]) => {
            if (words.includes(word)) bonus += 3;
        });
        return bonus;
    }
};

// Características de juego adicionales
const gameFeatures = {
    powerups: {
        EXTRA_TIME: 'extraTime',
        MULTIPLIER: 'multiplier',
        ANY_LETTER: 'anyLetter',
        SKIP_TURN: 'skipTurn'
    },
    POWERUP_CHANCE: 0.2,
    getRandomPowerup: () => {
        const powerups = Object.values(gameFeatures.powerups);
        return powerups[Math.floor(Math.random() * powerups.length)];
    }
};

// Modos de juego
const gameModes = {
    CLASSIC: 'classic',
    STORY: 'story',
    PRACTICE: 'practice',
    CHAIN: 'chain',
    BATTLE: 'battle'
};

// Configuración de modos de juego
const modeConfigs = {
    classic: {
        timeLimit: 60,
        minWordLength: 3
    },
    story: {
        levels: [
            { timeLimit: 90, minWordLength: 3, requirement: 5 },
            { timeLimit: 75, minWordLength: 4, requirement: 6 },
            { timeLimit: 60, minWordLength: 5, requirement: 7 }
        ]
    },
    practice: {
        timeLimit: 120,
        minWordLength: 3,
        hints: true
    },
    chain: {
        timeLimit: 45,
        chainRequired: true
    },
    battle: {
        timeLimit: 30,
        simultaneous: true
    }
};

// Variables globales del juego
let players = [];
let currentPlayerIndex = 0;
let gameState = {
    words: [],
    letter: '',
    timeLeft: 60,
    timerInterval: null,
    isSpinning: false,
    currentMode: gameModes.CLASSIC,
    scoreMultiplier: 1,
    wildcardActive: false,
    currentLevel: 1,
    achievements: [],
    powerups: [],
    chainLastWord: '',
    soundEnabled: true
};

const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

// Efectos de sonido
const soundEffects = {
    spin: new Audio('sounds/spin.mp3'),
    wordValid: new Audio('sounds/valid.mp3'),
    wordInvalid: new Audio('sounds/invalid.mp3'),
    timeWarning: new Audio('sounds/warning.mp3'),
    victory: new Audio('sounds/victory.mp3'),
    powerup: new Audio('sounds/powerup.mp3'),
    playSound: (sound) => {
        if (gameState.soundEnabled && soundEffects[sound]) {
            soundEffects[sound].play().catch(err => console.log('Error playing sound:', err));
        }
    }
};

// Funciones principales del juego
function initializeGame() {
    document.querySelector('.welcome-screen').style.display = 'block';
    setupSoundToggle();
    setupModeSelection();
}

function setupSoundToggle() {
    const soundToggle = document.createElement('button');
    soundToggle.className = 'sound-toggle';
    soundToggle.innerHTML = '🔊';
    soundToggle.onclick = toggleSound;
    document.querySelector('.container').appendChild(soundToggle);
}

function toggleSound() {
    gameState.soundEnabled = !gameState.soundEnabled;
    document.querySelector('.sound-toggle').innerHTML = gameState.soundEnabled ? '🔊' : '🔇';
}

function setupModeSelection() {
    const modeSelect = document.createElement('div');
    modeSelect.className = 'mode-selection';
    modeSelect.innerHTML = `
        <h3>Selecciona el modo de juego:</h3>
        <select id="gameMode">
            <option value="classic">Clásico</option>
            <option value="story">Historia</option>
            <option value="practice">Práctica</option>
            <option value="chain">Cadena</option>
            <option value="battle">Batalla</option>
        </select>
    `;
    document.querySelector('.welcome-screen').appendChild(modeSelect);
}

function setPlayers(count) {
    document.querySelector('.welcome-screen').style.display = 'none';
    document.querySelector('.players-setup').style.display = 'block';
    
    const inputsContainer = document.getElementById('player-inputs');
    inputsContainer.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const div = document.createElement('div');
        div.className = 'player-input';
        div.innerHTML = `
            <input type="text" placeholder="Nombre del Jugador ${i + 1}" 
                   id="player${i}" required>
        `;
        inputsContainer.appendChild(div);
    }
}

function startGame() {
    const selectedMode = document.getElementById('gameMode').value;
    gameState.currentMode = selectedMode;
    const modeConfig = modeConfigs[selectedMode];
    gameState.timeLeft = modeConfig.timeLimit;

    const inputs = document.querySelectorAll('.player-input input');
    players = Array.from(inputs).map(input => ({
        name: input.value || `Jugador ${players.length + 1}`,
        letter: '',
        words: [],
        points: 0,
        achievements: [],
        powerups: []
    }));

    document.querySelector('.players-setup').style.display = 'none';
    setupCarousel();
    showLetterSelection();
}

function setupCarousel() {
    const carousel = document.querySelector('.carousel-viewport');
    carousel.innerHTML = '';
    
    letters.split('').forEach((letter, index) => {
        const card = document.createElement('div');
        card.className = 'letter-card';
        card.textContent = letter;
        
        const angle = (index * (360 / letters.length));
        const radius = 200;
        card.style.transform = `
            translate(-50%, -50%)
            rotateY(${angle}deg) 
            translateZ(${radius}px)
        `;
        
        carousel.appendChild(card);
    });
}

function showLetterSelection() {
    document.querySelector('.letter-selection').style.display = 'block';
    document.querySelector('.letter-selection .current-player').textContent = 
        `Turno de: ${players[currentPlayerIndex].name}`;
    document.querySelector('.start-button').style.display = 'none';
    document.querySelector('.selected-letter-display').textContent = '';
    document.querySelector('.letter-indicator').classList.remove('visible');
}

function spinCarousel() {
    if (gameState.isSpinning) return;
    
    soundEffects.playSound('spin');
    gameState.isSpinning = true;
    
    if (Math.random() < gameFeatures.POWERUP_CHANCE) {
        const powerup = gameFeatures.getRandomPowerup();
        players[currentPlayerIndex].powerups.push(powerup);
        soundEffects.playSound('powerup');
        showPowerupAnimation(powerup);
    }

    const carousel = document.querySelector('.carousel-viewport');
    const numLetters = letters.length;
    const selectedIndex = Math.floor(Math.random() * numLetters);
    const anglePerLetter = 360 / numLetters;
    const extraRotations = 4 + Math.random() * 6;
    const totalDegrees = (extraRotations * 360) - (selectedIndex * anglePerLetter);

    carousel.style.transition = "transform 3s ease-out";
    carousel.style.transform = `rotateY(${totalDegrees}deg)`;

    players[currentPlayerIndex].letter = letters[selectedIndex];
    gameState.letter = letters[selectedIndex];

    setTimeout(() => {
        document.querySelectorAll('.letter-card').forEach((card, index) => {
            if (index === selectedIndex) {
                card.classList.add('selected');
                document.querySelector('.selected-letter-display').textContent = letters[selectedIndex];
                document.querySelector('.letter-indicator').classList.add('visible');
            } else {
                card.classList.remove('selected');
            }
        });

        document.querySelector('.start-button').style.display = 'inline-block';
        document.querySelector('.spin-button').disabled = true;
        gameState.isSpinning = false;
    }, 3000);
}

function startPlayerTurn() {
    document.querySelector('.letter-selection').style.display = 'none';
    document.querySelector('.game-screen').style.display = 'block';
    
    const player = players[currentPlayerIndex];
    document.querySelector('.game-screen .current-player').textContent = `Turno de: ${player.name}`;
    document.querySelector('.game-screen .selected-letter-display').textContent = player.letter;
    document.querySelector('.word-list').innerHTML = '';
    document.getElementById('word-input').value = '';
    document.getElementById('word-input').focus();
    
    showActivePowerups(player);
    
    gameState.words = [];
    gameState.timeLeft = modeConfigs[gameState.currentMode].timeLimit;
    startTimer();
}

function showActivePowerups(player) {
    const powerupsContainer = document.createElement('div');
    powerupsContainer.className = 'active-powerups';
    player.powerups.forEach(powerup => {
        const powerupIcon = document.createElement('div');
        powerupIcon.className = 'powerup-icon';
        powerupIcon.textContent = getPowerupEmoji(powerup);
        powerupIcon.onclick = () => activatePowerup(powerup);
        powerupsContainer.appendChild(powerupIcon);
    });
    document.querySelector('.game-screen').appendChild(powerupsContainer);
}

function getPowerupEmoji(powerup) {
    const emojis = {
        extraTime: '⏰',
        multiplier: '✨',
        anyLetter: '🔄',
        skipTurn: '⏭️'
    };
    return emojis[powerup] || '🎲';
}

function activatePowerup(powerup) {
    const player = players[currentPlayerIndex];
    const powerupIndex = player.powerups.indexOf(powerup);
    if (powerupIndex > -1) {
        player.powerups.splice(powerupIndex, 1);
        applyPowerupEffect(powerup);
        updatePowerupsDisplay();
    }
}

function applyPowerupEffect(powerup) {
    switch (powerup) {
        case gameFeatures.powerups.EXTRA_TIME:
            gameState.timeLeft += 15;
            showPowerupAnimation('¡+15 segundos!');
            break;
        case gameFeatures.powerups.MULTIPLIER:
            gameState.scoreMultiplier = 2;
            showPowerupAnimation('¡Puntos x2!');
            setTimeout(() => gameState.scoreMultiplier = 1, 15000);
            break;
        case gameFeatures.powerups.ANY_LETTER:
            gameState.wildcardActive = true;
            showPowerupAnimation('¡Cualquier letra!');
            setTimeout(() => gameState.wildcardActive = false, 10000);
            break;
        case gameFeatures.powerups.SKIP_TURN:
            endPlayerTurn();
            showPowerupAnimation('¡Turno saltado!');
            break;
    }
}

function startTimer() {
    updateTimerDisplay();
    gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimerDisplay();
        
        if (gameState.timeLeft <= 10) {
            soundEffects.playSound('timeWarning');
        }
        
        if (gameState.timeLeft <= 0) {
            endPlayerTurn();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timer = document.querySelector('.timer');
    timer.textContent = `${gameState.timeLeft}s`;
    
    if (gameState.timeLeft <= 10) {
        timer.style.color = '#ff4444';
        timer.style.animation = 'pulsate 0.5s infinite';
    } else {
        timer.style.color = '#FFD700';
        timer.style.animation = 'none';
    }
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        const input = document.getElementById('word-input');
        const word = input.value.trim().toUpperCase();
        
        if (isValidWord(word)) {
            addWord(word);
            input.value = '';
            soundEffects.playSound('wordValid');
        } else {
            input.style.animation = 'shake 0.5s';
            setTimeout(() => input.style.animation = '', 500);
            soundEffects.playSound('wordInvalid');
        }
    }
}

function isValidWord(word) {
    if (gameState.currentMode === gameModes.CHAIN && gameState.chainLastWord) {
        if (word[0] !== gameState.chainLastWord[gameState.chainLastWord.length - 1]) {
            return false;
        }
    }

    const validStart = gameState.wildcardActive || word.startsWith(gameState.letter);
    const validLength = word.length >= modeConfigs[gameState.currentMode].minWordLength;
    
    return word &&
           validStart &&
           /^[A-ZÑ]+$/.test(word) &&
           !gameState.words.includes(word) &&
           validLength;
}

function addWord(word) {
    gameState.words.push(word);
    const currentPlayer = players[currentPlayerIndex];
    
    // Calcular puntos
    let points = scoringSystem.getWordBasePoints(word);
    points += scoringSystem.getUniqueWordBonus(word, getAllPlayerWords());
    points += scoringSystem.getCategoryBonus(word);
    points *= gameState.scoreMultiplier;
    
    currentPlayer.points += points;

    // Actualizar UI
    const wordList = document.querySelector('.word-list');
    const wordElement = document.createElement('div');
    wordElement.className = 'word-item';
    wordElement.innerHTML = `
        <span class="word">${word}</span>
        <span class="points">+${points}</span>
        ${getCategoryTags(word)}
    `;
    wordElement.style.animation = 'slideIn 0.3s ease-out';
    wordList.appendChild(wordElement);
    wordList.scrollTop = wordList.scrollHeight;

    if (gameState.currentMode === gameModes.CHAIN) {
        gameState.chainLastWord = word;
    }

    checkAchievements(currentPlayer, word);
}

function getCategoryTags(word) {
    let tags = '';
    Object.entries(scoringSystem.categoryWords).forEach(([category, words]) => {
        if (words.includes(word)) {
            tags += `<span class="category-tag">${category}</span>`;
        }
    });
    return tags;
}

function getAllPlayerWords() {
    return players.reduce((words, player) => [...words, ...player.words], []);
}

function checkAchievements(player, word) {
    // Logro de palabra larga
    if (word.length >= 10 && !player.achievements.includes('longWord')) {
        unlockAchievement(player, 'longWord', '¡Palabra Kilométrica!');
    }

    // Logro de palabras rápidas
    const recentWords = gameState.words.slice(-5);
    if (recentWords.length === 5 && gameState.timeLeft >= 50 && !player.achievements.includes('fastWriter')) {
        unlockAchievement(player, 'fastWriter', '¡Escritor Veloz!');
    }

    // Logro de categorías
    const categories = Object.keys(scoringSystem.categories);
    const hasAllCategories = categories.every(category => 
        player.words.some(w => scoringSystem.categoryWords[category].includes(w))
    );
    if (hasAllCategories && !player.achievements.includes('categoryMaster')) {
        unlockAchievement(player, 'categoryMaster', '¡Maestro de Categorías!');
    }
}

function unlockAchievement(player, achievementId, achievementName) {
    player.achievements.push(achievementId);
    showAchievementAnimation(achievementName);
    soundEffects.playSound('victory');
}

function showAchievementAnimation(achievementName) {
    const achievementDiv = document.createElement('div');
    achievementDiv.className = 'achievement-animation';
    achievementDiv.innerHTML = `
        <h3>🏆 ¡Logro Desbloqueado!</h3>
        <p>${achievementName}</p>
    `;
    document.body.appendChild(achievementDiv);
    setTimeout(() => achievementDiv.remove(), 3000);
}

function showPowerupAnimation(message) {
    const powerupDiv = document.createElement('div');
    powerupDiv.className = 'powerup-animation';
    powerupDiv.textContent = message;
    document.body.appendChild(powerupDiv);
    setTimeout(() => powerupDiv.remove(), 2000);
}

function endPlayerTurn() {
    clearInterval(gameState.timerInterval);
    document.querySelector('.game-screen').style.display = 'none';
    
    const currentPlayer = players[currentPlayerIndex];
    currentPlayer.words = [...gameState.words];
    
    if (gameState.currentMode === gameModes.STORY) {
        checkStoryProgress();
    } else {
        proceedToNextPlayer();
    }
}

function checkStoryProgress() {
    const currentLevel = modeConfigs.story.levels[gameState.currentLevel - 1];
    const wordsRequired = currentLevel.requirement;
    
    if (gameState.words.length >= wordsRequired) {
        gameState.currentLevel++;
        if (gameState.currentLevel > modeConfigs.story.levels.length) {
            showStoryComplete();
        } else {
            showLevelComplete();
        }
    } else {
        showLevelFailed();
    }
}

function showLevelComplete() {
    const levelCompleteDiv = document.createElement('div');
    levelCompleteDiv.className = 'level-complete-screen';
    levelCompleteDiv.innerHTML = `
        <h2>¡Nivel ${gameState.currentLevel - 1} Completado!</h2>
        <p>Preparate para el siguiente nivel</p>
        <button onclick="startNextLevel()">Continuar</button>
    `;
    document.body.appendChild(levelCompleteDiv);
}

function startNextLevel() {
    document.querySelector('.level-complete-screen').remove();
    showLetterSelection();
}

function showLevelFailed() {
    const levelFailedDiv = document.createElement('div');
    levelFailedDiv.className = 'level-failed-screen';
    levelFailedDiv.innerHTML = `
        <h2>Nivel no superado</h2>
        <p>¡Inténtalo de nuevo!</p>
        <button onclick="retryLevel()">Reintentar</button>
        <button onclick="exitToMenu()">Menú Principal</button>
    `;
    document.body.appendChild(levelFailedDiv);
}

function proceedToNextPlayer() {
    currentPlayerIndex++;
    
    if (currentPlayerIndex < players.length) {
        document.querySelectorAll('.letter-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector('.spin-button').disabled = false;
        showLetterSelection();
    } else {
        showResults();
    }
}

function showResults() {
    document.querySelector('.results-screen').style.display = 'block';
    
    const tbody = document.querySelector('#results-table tbody');
    tbody.innerHTML = '';
    
    // Ordenar jugadores por puntos
    players.sort((a, b) => b.points - a.points);
    
    players.forEach((player, index) => {
        const row = document.createElement('tr');
        row.style.animation = `fadeIn ${0.3 + index * 0.1}s ease-out`;
        
        const achievements = player.achievements.length > 0 
            ? `<div class="achievements">🏆 x${player.achievements.length}</div>`
            : '';
            
        row.innerHTML = `
            <td>${player.name} ${index === 0 ? '👑' : ''}</td>
            <td>${player.letter}</td>
            <td>${player.words.join(', ')}</td>
            <td>${player.points} ${achievements}</td>
        `;
        
        if (index === 0) {
            row.classList.add('winner');
        }
        
        tbody.appendChild(row);
    });

    // Mostrar el confeti para el ganador
    if (players.length > 0) {
        showWinnerCelebration();
    }
}

function showWinnerCelebration() {
    soundEffects.playSound('victory');
    // Aquí podrías añadir una animación de confeti
}

function resetGame() {
    currentPlayerIndex = 0;
    players = [];
    gameState = {
        words: [],
        letter: '',
        timeLeft: 60,
        timerInterval: null,
        isSpinning: false,
        currentMode: gameModes.CLASSIC,
        scoreMultiplier: 1,
        wildcardActive: false,
        currentLevel: 1,
        achievements: [],
        powerups: [],
        chainLastWord: '',
        soundEnabled: gameState.soundEnabled
    };
    
    // Limpiar y resetear todas las pantallas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.querySelector('.welcome-screen').style.display = 'block';
    
    // Resetear estados visuales
    document.querySelectorAll('.letter-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector('.spin-button').disabled = false;
    document.querySelector('.letter-indicator').classList.remove('visible');
    document.querySelector('.selected-letter-display').textContent = '';
}

// Inicializar el juego cuando se carga la página
window.onload = initializeGame;