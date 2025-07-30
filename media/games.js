// Games Panel JavaScript
(function() {
    const vscode = acquireVsCodeApi();
    
    let gameState = null;
    let gameBoard = null;
    let isGameActive = false;

    // Initialize the game panel
    function init() {
        gameBoard = document.getElementById('gameBoard');
        
        // Set up event listeners
        document.getElementById('newGameBtn').addEventListener('click', () => {
            vscode.postMessage({
                type: 'gameAction',
                action: 'reset'
            });
        });

        // Keyboard controls
        document.addEventListener('keydown', handleKeyPress);
        
        // Request initial game state
        vscode.postMessage({
            type: 'requestGameState'
        });

        console.log('Games panel initialized');
    }

    function handleKeyPress(event) {
        if (!isGameActive) {
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

    function updateGameDisplay(state) {
        gameState = state;
        isGameActive = !state.isGameOver;
        
        // Update score
        document.getElementById('score').textContent = state.score || 0;
        document.getElementById('best').textContent = state.gameData?.bestScore || 0;
        
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
            document.getElementById('gameArea').insertBefore(messageDiv, gameBoard);
        }
        
        // Update board
        if (state.gameData && state.gameData.board) {
            updateBoard(state.gameData.board);
        }
    }

    function updateBoard(board) {
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
