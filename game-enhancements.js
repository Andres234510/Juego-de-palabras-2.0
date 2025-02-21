// 

// Sistema de puntuación mejorado
const scoringSystem = {
    // Puntos base por palabra
    getWordBasePoints: (word) => {
        if (word.length >= 8) return 5;
        if (word.length >= 6) return 3;
        return 1;
    },

    // Bonus por palabras únicas
    getUniqueWordBonus: (word, allPlayerWords) => {
        const isUnique = !allPlayerWords.some(playerWord => 
            playerWord.toLowerCase() === word.toLowerCase() && 
            playerWord !== word
        );
        return isUnique ? 2 : 0;
    },

    // Bonus por categorías
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

    // Probabilidad de powerup al girar (20%)
    POWERUP_CHANCE: 0.2,

    // Generar un powerup aleatorio
    getRandomPowerup: () => {
        const powerups = Object.values(gameFeatures.powerups);
        return powerups[Math.floor(Math.random() * powerups.length)];
    },

    // Aplicar efectos de powerup
    applyPowerup: (powerup, gameState) => {
        switch (powerup) {
            case gameFeatures.powerups.EXTRA_TIME:
                gameState.timeLeft += 15;
                break;
            case gameFeatures.powerups.MULTIPLIER:
                gameState.scoreMultiplier = 2;
                setTimeout(() => gameState.scoreMultiplier = 1, 15000);
                break;
            case gameFeatures.powerups.ANY_LETTER:
                gameState.wildcardActive = true;
                break;
            case gameFeatures.powerups.SKIP_TURN:
                endPlayerTurn();
                break;
        }
    }
};

// Efectos de sonido
const soundEffects = {
    spin: new Audio('/sounds/spin.mp3'),
    wordValid: new Audio('/sounds/valid.mp3'),
    wordInvalid: new Audio('/sounds/invalid.mp3'),
    timeWarning: new Audio('/sounds/warning.mp3'),
    victory: new Audio('/sounds/victory.mp3'),
    powerup: new Audio('/sounds/powerup.mp3')
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
    [gameModes.CLASSIC]: {
        timeLimit: 60,
        minWordLength: 3
    },
    [gameModes.STORY]: {
        levels: [
            { timeLimit: 90, minWordLength: 3, requirement: 5 },
            { timeLimit: 75, minWordLength: 4, requirement: 6 },
            { timeLimit: 60, minWordLength: 5, requirement: 7 }
        ]
    },
    [gameModes.PRACTICE]: {
        timeLimit: 120,
        minWordLength: 3,
        hints: true
    },
    [gameModes.CHAIN]: {
        timeLimit: 45,
        chainRequired: true
    },
    [gameModes.BATTLE]: {
        timeLimit: 30,
        simultaneous: true
    }
};

// Gestión de logros
const achievements = {
    FAST_WRITER: { id: 'fastWriter', name: '¡Escritor Veloz!', requirement: '5 palabras en 10 segundos' },
    LONG_WORD: { id: 'longWord', name: 'Palabras Kilométricas', requirement: 'Palabra de 10+ letras' },
    CATEGORY_MASTER: { id: 'categoryMaster', name: 'Maestro de Categorías', requirement: 'Palabras en todas las categorías' },
    COMBO_KING: { id: 'comboKing', name: 'Rey del Combo', requirement: '3 palabras únicas seguidas' }
};

// Sistema de progreso
const progressSystem = {
    levels: [
        { name: 'Principiante', minPoints: 0 },
        { name: 'Aprendiz', minPoints: 100 },
        { name: 'Experto', minPoints: 250 },
        { name: 'Maestro', minPoints: 500 },
        { name: 'Leyenda', minPoints: 1000 }
    ],

    getLevel: (totalPoints) => {
        return progressSystem.levels.reduce((current, level) => {
            return totalPoints >= level.minPoints ? level : current;
        });
    }
};