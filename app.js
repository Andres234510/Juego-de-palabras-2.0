let players = [];
        let currentPlayerIndex = 0;
        let gameState = {
            words: [],
            letter: '',
            timeLeft: 60,
            timerInterval: null,
            isSpinning: false
        };

        const letters = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

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
            const inputs = document.querySelectorAll('.player-input input');
            players = Array.from(inputs).map(input => ({
                name: input.value || `Jugador ${players.length + 1}`,
                letter: '',
                words: [],
                points: 0
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
                
                // Calcular la posición en el círculo
                const angle = (index * (360 / letters.length));
                const radius = 200; // Radio del círculo
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
        
            gameState.isSpinning = true;
            const carousel = document.querySelector('.carousel-viewport');
            
            const numLetters = letters.length;
            const selectedIndex = Math.floor(Math.random() * numLetters);
        
            // Ángulo exacto para cada letra
            const anglePerLetter = 360 / numLetters;
            
            // Giramos entre 2 y 5 vueltas antes de llegar a la letra correcta
            const extraRotations = 4 + Math.random() * 6;
            const totalDegrees = (extraRotations * 360) - (selectedIndex * anglePerLetter);
        
            // Aplicamos la rotación con animación suave
            carousel.style.transition = "transform 3s ease-out";
            carousel.style.transform = `rotateY(${totalDegrees}deg)`;
        
            // Guardamos la letra seleccionada
            players[currentPlayerIndex].letter = letters[selectedIndex];
            gameState.letter = letters[selectedIndex];
        
            // Esperamos a que termine la animación para actualizar la interfaz
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
            
            gameState.words = [];
            gameState.timeLeft = 60;
            startTimer();
        }

        function startTimer() {
            updateTimerDisplay();
            gameState.timerInterval = setInterval(() => {
                gameState.timeLeft--;
                updateTimerDisplay();
                
                if (gameState.timeLeft <= 0) {
                    endPlayerTurn();
                }
            }, 1000);
        }

        function updateTimerDisplay() {
            const timer = document.querySelector('.timer');
            timer.textContent = `${gameState.timeLeft}s`;
            
            // Añadir efecto visual cuando quede poco tiempo
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
                } else {
                    // Efecto visual para palabra inválida
                    input.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        input.style.animation = '';
                    }, 500);
                }
            }
        }

        function isValidWord(word) {
            return word &&
                   word.startsWith(gameState.letter) &&
                   /^[A-ZÑ]+$/.test(word) &&
                   !gameState.words.includes(word);
        }

        function addWord(word) {
            gameState.words.push(word);
            const wordList = document.querySelector('.word-list');
            const wordElement = document.createElement('div');
            wordElement.textContent = word;
            wordElement.style.animation = 'slideIn 0.3s ease-out';
            wordList.appendChild(wordElement);
            wordList.scrollTop = wordList.scrollHeight;
        }

        function endPlayerTurn() {
            clearInterval(gameState.timerInterval);
            document.querySelector('.game-screen').style.display = 'none';
            
            players[currentPlayerIndex].words = [...gameState.words];
            players[currentPlayerIndex].points = gameState.words.length;
            
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
            
            // Crear filas de la tabla con animación
            players.forEach((player, index) => {
                const row = document.createElement('tr');
                row.style.animation = `fadeIn ${0.3 + index * 0.1}s ease-out`;
                row.innerHTML = `
                    <td>${player.name}</td>
                    <td>${player.letter}</td>
                    <td>${player.words.join(', ')}</td>
                    <td>${player.points}</td>
                `;
                tbody.appendChild(row);
            });

            // Resaltar al ganador
            const winnerRow = tbody.firstElementChild;
            if (winnerRow) {
                winnerRow.style.background = 'rgba(255, 215, 0, 0.2)';
                winnerRow.style.fontWeight = 'bold';
            }
        }

        function resetGame() {
            currentPlayerIndex = 0;
            players = [];
            gameState = {
                words: [],
                letter: '',
                timeLeft: 60,
                timerInterval: null,
                isSpinning: false
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

        // Agregar algunos estilos dinámicos
        const style = document.createElement('style');
        style.textContent = `
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }

            .word-list::-webkit-scrollbar {
                width: 8px;
            }

            .word-list::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
            }

            .word-list::-webkit-scrollbar-thumb {
                background: rgba(255, 215, 0, 0.5);
                border-radius: 4px;
            }

            .word-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 215, 0, 0.7);
            }
        `;
        document.head.appendChild(style);