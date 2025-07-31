// Games Panel JavaScript
(function() {
    const vscode = acquireVsCodeApi();
    
    let gameState = null;
    let currentGameType = '2048';
    let gameBoard = null;
    let minesweeperBoard = null;
    let isGameActive = false;

    // Initialize the game panel
    function init() {
        gameBoard = document.getElementById('gameBoard');
        minesweeperBoard = document.getElementById('minesweeperBoard');
        
        // Set up event listeners
        document.getElementById('newGameBtn').addEventListener('click', () => {
            vscode.postMessage({
                type: 'gameAction',
                action: 'reset'
            });
        });

        // Game selector
        document.getElementById('gameSelector').addEventListener('change', (event) => {
            const selectedGame = event.target.value;
            switchToGame(selectedGame);
        });

        // Difficulty selector for minesweeper
        document.getElementById('difficultySelector').addEventListener('change', (event) => {
            const selectedDifficulty = event.target.value;
            vscode.postMessage({
                type: 'gameAction',
                action: 'changeDifficulty',
                payload: { difficulty: selectedDifficulty }
            });
        });

        // Keyboard controls (only for 2048)
        document.addEventListener('keydown', handleKeyPress);
        
        // Request initial game state
        vscode.postMessage({
            type: 'requestGameState'
        });

        console.log('Games panel initialized');
    }

    function handleKeyPress(event) {
        // Only handle keyboard for 2048 game
        if (!isGameActive || currentGameType !== '2048') {
            return;
        }
        
        let direction = null;
        
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                direction = 'up';
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                direction = 'down';
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                direction = 'left';
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                direction = 'right';
                break;
            default:
                return;
        }
        
        if (direction) {
            event.preventDefault();
            vscode.postMessage({
                type: 'gameAction',
                action: 'move',
                payload: { direction }
            });
        }
    }

    function switchToGame(gameType, notifyBackend = true) {
        currentGameType = gameType;
        
        // Hide all game content
        document.getElementById('game2048').style.display = 'none';
        document.getElementById('gameMinesweeper').style.display = 'none';
        
        // Show selected game content
        document.getElementById('game' + gameType.charAt(0).toUpperCase() + gameType.slice(1)).style.display = 'block';
        
        // Update game selector
        document.getElementById('gameSelector').value = gameType;
        
        // Only notify backend if this is a user-initiated switch
        if (notifyBackend) {
            vscode.postMessage({
                type: 'gameAction',
                action: 'switchGame',
                payload: { gameType }
            });
        }
    }

    function updateGameDisplay(state) {
        gameState = state;
        const newGameType = state.gameType;
        isGameActive = !state.isGameOver;
        
        // Only switch games if the game type actually changed
        if (currentGameType !== newGameType) {
            currentGameType = newGameType;
            switchToGame(currentGameType, false); // Don't notify backend - this is a state update
        }
        
        // Clear existing message
        const existingMessage = document.querySelector('.game-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Show message if exists
        if (state.message) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `game-message ${state.gameData?.hasWon ? 'win' : 'game-over'}`;
            messageDiv.textContent = state.message;
            document.getElementById('gameArea').insertBefore(messageDiv, document.getElementById('gameArea').firstChild);
        }
        
        // Update specific game display
        if (currentGameType === '2048') {
            update2048Display(state);
        } else if (currentGameType === 'minesweeper') {
            updateMinesweeperDisplay(state);
        }
    }

    function update2048Display(state) {
        // Update score
        document.getElementById('score').textContent = state.score || 0;
        document.getElementById('best').textContent = state.gameData?.bestScore || 0;
        
        // Update board
        if (state.gameData && state.gameData.board) {
            update2048Board(state.gameData.board);
        }
    }

    function updateMinesweeperDisplay(state) {
        // Update status
        document.getElementById('remainingMines').textContent = state.gameData?.remainingMines || 0;
        
        // Update difficulty selector
        const difficultySelector = document.getElementById('difficultySelector');
        if (difficultySelector && state.gameData?.currentDifficulty) {
            difficultySelector.value = state.gameData.currentDifficulty;
        }
        
        // Add expert mode class for special styling
        const minesweeperDiv = document.getElementById('gameMinesweeper');
        if (state.gameData?.currentDifficulty === 'expert' || state.gameData?.currentDifficulty === 'intermediate') {
            minesweeperDiv.classList.add('expert-mode');
        } else {
            minesweeperDiv.classList.remove('expert-mode');
        }
        
        // Update board
        if (state.gameData && state.gameData.board) {
            updateMinesweeperBoard(state.gameData);
        }
    }

    function update2048Board(board) {
        if (!gameBoard) {
            return;
        }
        
        gameBoard.innerHTML = '';
        
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const tile = document.createElement('div');
                const value = board[row][col];
                
                tile.className = `game-tile tile-${value}`;
                tile.textContent = value > 0 ? value.toString() : '';
                
                // Add special styling for higher values
                if (value > 2048) {
                    tile.classList.add('tile-super');
                }
                
                gameBoard.appendChild(tile);
            }
        }
    }

    function updateMinesweeperBoard(gameData) {
        if (!minesweeperBoard) {
            return;
        }
        
        const { board, width, height, currentDifficulty } = gameData;
        
        // Clear existing classes and set difficulty class
        minesweeperBoard.className = '';
        minesweeperBoard.classList.add(currentDifficulty || 'beginner');
        minesweeperBoard.innerHTML = '';
        
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                const cell = board[row][col];
                const cellElement = document.createElement('div');
                
                cellElement.className = 'mine-cell';
                cellElement.dataset.row = row;
                cellElement.dataset.col = col;
                
                // Add event listeners
                cellElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleMinesweeperClick('reveal', row, col);
                });
                
                cellElement.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    handleMinesweeperClick('flag', row, col);
                });
                
                // Update cell appearance
                if (cell.isRevealed) {
                    cellElement.classList.add('revealed');
                    if (cell.isMine) {
                        cellElement.classList.add('mine');
                        cellElement.textContent = '💣';
                    } else if (cell.neighborMines > 0) {
                        cellElement.textContent = cell.neighborMines.toString();
                        cellElement.classList.add(`num-${cell.neighborMines}`);
                    }
                } else if (cell.isFlagged) {
                    cellElement.classList.add('flagged');
                    cellElement.textContent = '🚩';
                }
                
                minesweeperBoard.appendChild(cellElement);
            }
        }
    }

    function handleMinesweeperClick(action, row, col) {
        vscode.postMessage({
            type: 'gameAction',
            action: action,
            payload: { row, col }
        });
    }

    // Handle messages from the extension
    window.addEventListener('message', event => {
        const message = event.data;
        
        switch (message.type) {
            case 'gameState':
            case 'gameUpdate':
                updateGameDisplay(message.data);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    });

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
