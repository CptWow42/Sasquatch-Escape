class SasquatchGame {
    constructor() {
        this.boardSize = 15;
        this.level = 1;
        this.hunterCount = 1;
        this.mushrooms = 0;
        this.isInvisible = false;
        this.invisibilityTimer = null;
        this.gameLoop = null;
        this.animalLoop = null;
        
        // Movement cooldown
        this.canMove = true;
        this.moveCooldown = 400; // milliseconds - adjust this value to change speed
        this.moveTimer = null;

        // Footprints system - now time-based
        this.footprints = []; // Array of {x, y, timestamp} objects
        this.footprintDuration = 3000; // Footprints last for 3 seconds (3000ms)

        // Get references to HTML elements
        this.gameBoard = document.getElementById('gameBoard');
        this.levelElement = document.getElementById('levelNumber');
        this.hunterCountElement = document.getElementById('hunterCount');
        this.mushroomCountElement = document.getElementById('mushroomCount');
        this.messageElement = document.getElementById('message');
        
        this.initializeEventListeners();
        // Don't generate level automatically - wait for start
        this.showStartScreen();
        
        // Make game accessible globally for mobile controls
        window.game = this;
    }
    
    // Show start screen instead of auto-starting
    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
    }
    
    // Game loop for automatic hunter movement
    startGameLoop() {
        // Clear any existing game loops first
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        if (this.animalLoop) {
            clearInterval(this.animalLoop);
        }
        
        // Start new game loop - hunters move every 800ms
        this.gameLoop = setInterval(() => {
            this.moveHunters();
            this.renderBoard();
            this.checkGameOver();
        }, 800);
        
        // Start animal movement loop - animals move every 1200ms (slower)
        this.animalLoop = setInterval(() => {
            this.moveAnimals();
            this.renderBoard();
        }, 1200);
    }
    
    // Stop game loops (useful for pausing)
    stopGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.animalLoop) {
            clearInterval(this.animalLoop);
            this.animalLoop = null;
        }
    }
    
    initializeEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('makeNoise').addEventListener('click', () => this.makeNoise());
        document.getElementById('bangTree').addEventListener('click', () => this.bangTree());
        document.getElementById('eatMushroom').addEventListener('click', () => this.eatMushroom());
        document.getElementById('startButton').addEventListener('click', () => this.startGame());
        document.getElementById('nextLevelButton').addEventListener('click', () => this.nextLevel());
        document.getElementById('restartButton').addEventListener('click', () => this.restartGame());
        
        // Initialize mobile touch controls
        this.initializeMobileControls();
    }
    
    // NEW METHOD: Initialize mobile touch controls
    initializeMobileControls() {
        // Check if we're on a mobile device
        const isMobile = window.innerWidth <= 768 || 
                        'ontouchstart' in window || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Show mobile controls
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.classList.remove('hidden');
            }
            
            // Connect touch buttons to game movement
            this.connectMobileButtons();
        }
    }
    
    // Connect mobile buttons to movement
    connectMobileButtons() {
        const upBtn = document.querySelector('.touch-btn.up');
        const downBtn = document.querySelector('.touch-btn.down');
        const leftBtn = document.querySelector('.touch-btn.left');
        const rightBtn = document.querySelector('.touch-btn.right');
        
        if (upBtn && downBtn && leftBtn && rightBtn) {
            // Remove any existing listeners
            const newUp = upBtn.cloneNode(true);
            const newDown = downBtn.cloneNode(true);
            const newLeft = leftBtn.cloneNode(true);
            const newRight = rightBtn.cloneNode(true);
            
            upBtn.parentNode.replaceChild(newUp, upBtn);
            downBtn.parentNode.replaceChild(newDown, downBtn);
            leftBtn.parentNode.replaceChild(newLeft, leftBtn);
            rightBtn.parentNode.replaceChild(newRight, rightBtn);
            
            // Add new listeners
            newUp.addEventListener('click', () => {
                this.moveSasquatch(this.sasquatch.x, this.sasquatch.y - 1);
            });
            
            newDown.addEventListener('click', () => {
                this.moveSasquatch(this.sasquatch.x, this.sasquatch.y + 1);
            });
            
            newLeft.addEventListener('click', () => {
                this.moveSasquatch(this.sasquatch.x - 1, this.sasquatch.y);
            });
            
            newRight.addEventListener('click', () => {
                this.moveSasquatch(this.sasquatch.x + 1, this.sasquatch.y);
            });
            
            // Also add touch handlers
            newUp.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveSasquatch(this.sasquatch.x, this.sasquatch.y - 1);
            });
            
            newDown.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveSasquatch(this.sasquatch.x, this.sasquatch.y + 1);
            });
            
            newLeft.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveSasquatch(this.sasquatch.x - 1, this.sasquatch.y);
            });
            
            newRight.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.moveSasquatch(this.sasquatch.x + 1, this.sasquatch.y);
            });
        }
    }
    
    // Handle Enter key to start game
    handleKeyPress(e) {
        // Check if we're on a start screen and Enter is pressed
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const levelCompleteScreen = document.getElementById('levelCompleteScreen');
        
        // If Enter is pressed and we're on start screen or game over screen
        if (e.key === 'Enter') {
            if (!startScreen.classList.contains('hidden')) {
                this.startGame();
                return;
            } else if (!gameOverScreen.classList.contains('hidden')) {
                this.restartGame();
                return;
            } else if (!levelCompleteScreen.classList.contains('hidden')) {
                this.nextLevel();
                return;
            }
        }
        
        // Only process game controls if we're actually playing
        if (!startScreen.classList.contains('hidden') || 
            !gameOverScreen.classList.contains('hidden') ||
            !levelCompleteScreen.classList.contains('hidden')) {
            return;
        }
        
        // Movement cooldown check
        if (!this.canMove) return;
        
        let newX = this.sasquatch.x;
        let newY = this.sasquatch.y;
        
        switch(e.key) {
            case 'ArrowUp': newY--; break;
            case 'ArrowDown': newY++; break;
            case 'ArrowLeft': newX--; break;
            case 'ArrowRight': newX++; break;
            case 'n': case 'N': this.makeNoise(); return;
            case 'b': case 'B': this.bangTree(); return;
            case 'm': case 'M': this.eatMushroom(); return;
            default: return;
        }
        
        this.moveSasquatch(newX, newY);
    }
    
    // Game World
    generateLevel() {
        this.grid = [];
        this.trees = [];
        this.hunters = [];
        this.rivers = [];
        this.bridges = [];
        this.ponds = []; // Multi-square ponds
        this.animals = []; // Woodland animals
        this.footprints = []; // Reset footprints for new level

        this.createEmptyGrid();
        this.placeSasquatch();
        this.placeCave();
        this.placeTrees();
        this.placeHunters();
        
        // Add rivers starting at level 3
        if (this.level >= 3) {
            this.placeRivers();
        }
        
        // Add mushrooms at level 6
        if (this.level >= 6) {
            this.placeMushrooms();
        }
        
        // Randomly add ponds (not in every level)
        if (Math.random() < 0.7) { // 70% chance for ponds
            this.placePonds();
        }
        
        // Add woodland animals (more in later levels)
        this.placeAnimals();
        
        this.renderBoard();
        this.updateUI();
        
        // Start the automatic game loops
        this.startGameLoop();
    }
    
    // Building the game grid
    createEmptyGrid() {
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill('empty'));
    }
    
    // Keeps trying random positions until it finds an empty square
    placeSasquatch() {
        do {
            this.sasquatch = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.grid[this.sasquatch.y][this.sasquatch.x] !== 'empty');
        
        this.grid[this.sasquatch.y][this.sasquatch.x] = 'sasquatch';
    }
    
    // Place Cave 
    placeCave() {
        let cavePlaced = false;
        while (!cavePlaced) {
            const x = Math.floor(Math.random() * this.boardSize);
            const y = Math.floor(Math.random() * this.boardSize);
            
            if (this.grid[y][x] === 'empty') {
                const distance = Math.abs(x - this.sasquatch.x) + Math.abs(y - this.sasquatch.y);
                if (distance >= 10) {
                    this.cave = { x, y };
                    this.grid[y][x] = 'cave';
                    cavePlaced = true;
                }
            }
        }
    }
    
    // Place Trees and hunters
    placeTrees() {
        const treeCount = 20 + this.level * 2; // More trees each level
        
        for (let i = 0; i < treeCount; i++) {
            let treePlaced = false;
            while (!treePlaced) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                
                if (this.grid[y][x] === 'empty') {
                    this.trees.push({ x, y });
                    this.grid[y][x] = 'tree';
                    treePlaced = true;
                }
            }
        }
    }
    
    placeHunters() {
        this.hunterCount = this.level; // Place More hunters each level
        
        for (let i = 0; i < this.hunterCount; i++) {
            let hunterPlaced = false;
            while (!hunterPlaced) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                
                if (this.grid[y][x] === 'empty') {
                    // Keeps hunters from spawning too close to start or cave
                    const distanceToSasquatch = Math.abs(x - this.sasquatch.x) + Math.abs(y - this.sasquatch.y);
                    const distanceToCave = Math.abs(x - this.cave.x) + Math.abs(y - this.cave.y);
                    
                    if (distanceToSasquatch > 3 && distanceToCave > 3) {
                        this.hunters.push({ 
                            x, 
                            y,
                            scared: false, // hunters will not start scared
                            scaredTimer: null,
                            mushrooms: 0, // Hunters can collect mushrooms too!
                            invisible: false, // Hunters can become invisible
                            invisibleTimer: null, // Track invisibility
                            trackingFootprint: null // Track which footprint the hunter is following
                        });
                        this.grid[y][x] = 'hunter';
                        hunterPlaced = true;
                    }
                }
            }
        }
    }
    
    placeRivers() {
        const riverCount = 2;
        
        for (let i = 0; i < riverCount; i++) {
            const isHorizontal = Math.random() > 0.5;
            const startPos = Math.floor(Math.random() * (this.boardSize - 5));
            const riverY = isHorizontal ? Math.floor(Math.random() * this.boardSize) : startPos + 2;
            const riverX = isHorizontal ? startPos + 2 : Math.floor(Math.random() * this.boardSize);
            const length = 4 + Math.floor(Math.random() * 3);
            
            for (let j = 0; j < length; j++) {
                const x = isHorizontal ? riverX + j : riverX;
                const y = isHorizontal ? riverY : riverY + j;
                
                if (x >= 0 && x < this.boardSize && y >= 0 && y < this.boardSize && this.grid[y][x] === 'empty') {
                    this.rivers.push({ x, y });
                    this.grid[y][x] = 'river';
                }
            }
        }
    }
    
    placeMushrooms() {
        const mushroomCount = 2;
        
        for (let i = 0; i < mushroomCount; i++) {
            let mushroomPlaced = false;
            while (!mushroomPlaced) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                
                if (this.grid[y][x] === 'empty') {
                    this.grid[y][x] = 'mushroom';
                    mushroomPlaced = true;
                }
            }
        }
    }
    
    // Create multi-square ponds
    placePonds() {
        const pondCount = 1 + Math.floor(Math.random() * 2); // 1-2 ponds
        
        for (let i = 0; i < pondCount; i++) {
            // Find a suitable area for the pond
            let centerFound = false;
            let attempts = 0;
            
            while (!centerFound && attempts < 20) {
                const centerX = 3 + Math.floor(Math.random() * (this.boardSize - 6));
                const centerY = 3 + Math.floor(Math.random() * (this.boardSize - 6));
                
                // Check if center is empty and not too close to important features
                if (this.grid[centerY][centerX] === 'empty' &&
                    Math.abs(centerX - this.sasquatch.x) > 3 &&
                    Math.abs(centerY - this.sasquatch.y) > 3 &&
                    Math.abs(centerX - this.cave.x) > 3 &&
                    Math.abs(centerY - this.cave.y) > 3) {
                    
                    const pondSize = 2 + Math.floor(Math.random() * 3); // 2-4 squares
                    this.createPond(centerX, centerY, pondSize);
                    centerFound = true;
                }
                attempts++;
            }
        }
    }
    
    // Create a pond of specified size around a center point
    createPond(centerX, centerY, size) {
        const pondCells = [];
        
        // Simple flood fill for pond creation
        const queue = [{x: centerX, y: centerY}];
        const visited = new Set();
        
        while (queue.length > 0 && pondCells.length < size) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            // Only add if it's empty and not too close to important features
            if (this.grid[current.y][current.x] === 'empty' &&
                Math.abs(current.x - this.sasquatch.x) > 2 &&
                Math.abs(current.y - this.sasquatch.y) > 2 &&
                Math.abs(current.x - this.cave.x) > 2 &&
                Math.abs(current.y - this.cave.y) > 2) {
                
                pondCells.push({x: current.x, y: current.y});
                this.grid[current.y][current.x] = 'pond';
                
                // Add neighbors to queue
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1}
                ];
                
                for (const dir of directions) {
                    const newX = current.x + dir.dx;
                    const newY = current.y + dir.dy;
                    
                    if (newX >= 0 && newX < this.boardSize && 
                        newY >= 0 && newY < this.boardSize) {
                        queue.push({x: newX, y: newY});
                    }
                }
            }
        }
        
        this.ponds.push(pondCells);
    }
    
    // Place woodland animals
    placeAnimals() {
        const animalTypes = ['bunny', 'squirrel', 'deer', 'bird'];
        const animalCount = 3 + this.level; // More animals in later levels
        
        for (let i = 0; i < animalCount; i++) {
            const animalType = animalTypes[Math.floor(Math.random() * animalTypes.length)];
            let animalPlaced = false;
            let attempts = 0;
            
            while (!animalPlaced && attempts < 20) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                
                if (this.grid[y][x] === 'empty') {
                    // Animals avoid important features
                    const distanceToSasquatch = Math.abs(x - this.sasquatch.x) + Math.abs(y - this.sasquatch.y);
                    const distanceToC
