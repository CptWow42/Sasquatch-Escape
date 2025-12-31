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
                    const distanceToCave = Math.abs(x - this.cave.x) + Math.abs(y - this.cave.y);
                    
                    if (distanceToSasquatch > 3 && distanceToCave > 3) {
                        this.animals.push({ 
                            x, 
                            y, 
                            type: animalType,
                            moveCounter: 0
                        });
                        // Animals don't occupy grid cells - they're just visual
                        animalPlaced = true;
                    }
                }
                attempts++;
            }
        }
    }
    
    // Move animals randomly
    moveAnimals() {
        this.animals.forEach(animal => {
            animal.moveCounter++;
            
            // Animals move less frequently than hunters
            if (animal.moveCounter >= 2) { // Move every 2 animal cycles
                animal.moveCounter = 0;
                
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1},
                    {dx: 0, dy: 0} // Chance to stay still
                ];
                
                const move = directions[Math.floor(Math.random() * directions.length)];
                const newX = animal.x + move.dx;
                const newY = animal.y + move.dy;
                
                // Check if new position is valid (empty and in bounds)
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.grid[newY][newX] === 'empty') {
                    
                    animal.x = newX;
                    animal.y = newY;
                }
            }
        });
    }
    
    // DISPLAY GAME BOARD 
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 30px)`;
        this.gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 30px)`;
        
        for (let y = 0; y < this.boardSize; y++) {
            for (let x = 0; x < this.boardSize; x++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                // Get what should be displayed in this cell
                const cellContent = this.grid[y][x];
                
                // Check if there's a footprint at this position
                const footprintHere = this.footprints.find(f => f.x === x && f.y === y);
                
                // Skip rendering invisible hunters completely
                if (cellContent === 'hunter') {
                    const hunter = this.hunters.find(h => h.x === x && h.y === y);
                    if (hunter && hunter.invisible) {
                        // Don't render invisible hunters - show empty cell instead
                        this.gameBoard.appendChild(cell);
                        continue; // Skip to next cell
                    }
                }
                
                // Check if there's an animal at this position
                const animalHere = this.animals.find(a => a.x === x && a.y === y);
                
                // add content for visible elements
                switch (cellContent) {
                    case 'sasquatch':
                        cell.classList.add('sasquatch');
                        cell.textContent = this.isInvisible ? '👁️' : '🦧';
                        if (this.isInvisible) cell.classList.add('invisible');
                        break;
                    case 'hunter':
                        const hunter = this.hunters.find(h => h.x === x && h.y === y);
                        cell.classList.add('hunter');
                        if (hunter) {
                            if (hunter.scared) {
                                cell.textContent = '😨';
                                cell.classList.add('scared');
                            } else {
                                cell.textContent = '🤠';
                            }
                        }
                        break;
                    case 'tree':
                        cell.classList.add('tree');
                        cell.textContent = '🌲';
                        break;
                    case 'cave':
                        cell.classList.add('cave');
                        cell.textContent = '🍙';
                        break;
                    case 'river':
                        // Check if this river cell has been bridged
                        if (this.bridges.some(b => b.x === x && b.y === y)) {
                            cell.classList.add('bridge');
                            cell.textContent = '🪵';
                        } else {
                            cell.classList.add('river');
                            cell.textContent = '🌊';
                        }
                        break;
                    case 'mushroom':
                        cell.classList.add('mushroom');
                        cell.textContent = '🍄';
                        break;
                    case 'pond':
                        cell.classList.add('pond');
                        cell.textContent = '🏞️';
                        break;
                    default:
                        // Regular empty cell or other elements
                        if (this.bridges.some(b => b.x === x && b.y === y)) {
                            cell.classList.add('bridge');
                            cell.textContent = '🪵';
                        }
                }
                
                // Overlay footprint if present (footprints don't block cells)
                if (footprintHere && cellContent === 'empty') {
                    // Calculate footprint opacity based on remaining time
                    const elapsed = Date.now() - footprintHere.timestamp;
                    const remaining = Math.max(0, this.footprintDuration - elapsed);
                    const opacity = remaining / this.footprintDuration;
                    
                    cell.style.opacity = opacity;
                    cell.textContent = '👣';
                    cell.classList.add('footprint');
                }
                
                // Overlay animal if present (animals don't block cells)
                if (animalHere && cellContent === 'empty' && !footprintHere) {
                    switch (animalHere.type) {
                        case 'bunny':
                            cell.textContent = '🐇';
                            cell.classList.add('animal', 'bunny');
                            break;
                        case 'squirrel':
                            cell.textContent = '🐿️';
                            cell.classList.add('animal', 'squirrel');
                            break;
                        case 'deer':
                            cell.textContent = '🦌';
                            cell.classList.add('animal', 'deer');
                            break;
                        case 'bird':
                            cell.textContent = '🐦';
                            cell.classList.add('animal', 'bird');
                            break;
                    }
                }
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    // Add a new footprint at Sasquatch's current position
    addFootprint(x, y) {
        // Don't leave footprints when invisible
        if (this.isInvisible) return;
        
        // Don't leave footprints on special terrain
        const cellContent = this.grid[y][x];
        if (cellContent === 'river' || cellContent === 'pond' || cellContent === 'tree') {
            return;
        }
        
        // Check if there's already a footprint here (don't stack)
        const existingFootprint = this.footprints.find(f => f.x === x && f.y === y);
        if (existingFootprint) {
            // Reset the timestamp if we step on an existing footprint
            existingFootprint.timestamp = Date.now();
            return;
        }
        
        // Add new footprint with current timestamp
        this.footprints.push({ x, y, timestamp: Date.now() });
    }
    
    // Remove expired footprints
    cleanupFootprints() {
        const now = Date.now();
        this.footprints = this.footprints.filter(footprint => {
            const elapsed = now - footprint.timestamp;
            return elapsed < this.footprintDuration;
        });
    }
    
    // Get freshness of a footprint (0 = brand new, 1 = about to expire)
    getFootprintFreshness(footprint) {
        const elapsed = Date.now() - footprint.timestamp;
        return elapsed / this.footprintDuration;
    }
    
    // Checks if position is Valid
    moveSasquatch(newX, newY) {
        if (newX < 0 || newX >= this.boardSize || newY < 0 || newY >= this.boardSize) return;
        
        const targetCell = this.grid[newY][newX];
        
        // Check for both visible AND invisible hunters
        const hunterAtPosition = this.hunters.find(h => h.x === newX && h.y === newY);
        
        // Can't move through trees, hunters, or ponds
        if (targetCell === 'tree' || 
            targetCell === 'pond' ||
            (targetCell === 'hunter' && hunterAtPosition && !hunterAtPosition.invisible)) {
            return;
        }
        
        // River crossing rules - check if it's a river without a bridge
        if (targetCell === 'river') {
            const hasBridge = this.bridges.some(bridge => bridge.x === newX && bridge.y === newY);
            if (!hasBridge) {
                this.showMessage("You need to create a bridge first!");
                return;
            }
        }
        
        // ADD MOVEMENT COOLDOWN - prevent further movement until timer expires
        this.canMove = false;
        if (this.moveTimer) clearTimeout(this.moveTimer);
        this.moveTimer = setTimeout(() => {
            this.canMove = true;
        }, this.moveCooldown);
        
        // Leave footprint at current position before moving
        this.addFootprint(this.sasquatch.x, this.sasquatch.y);
        
        // Move Sasquatch
        this.grid[this.sasquatch.y][this.sasquatch.x] = 'empty';
        this.sasquatch.x = newX;
        this.sasquatch.y = newY;
        
        if (targetCell === 'mushroom') {
            this.mushrooms++;
            this.updateUI();
            this.showMessage("Found a mushroom! Press M to become invisible.");
        }
        
        this.grid[newY][newX] = 'sasquatch';
        
        if (newX === this.cave.x && newY === this.cave.y) {
            this.completeLevel();
            return;
        }
        
        // Clean up expired footprints
        this.cleanupFootprints();
        
        // Only render board, game loop handles hunter movement and game over check
        this.renderBoard();
    }
    
    // Hunters also respect terrain obstacles
    moveHunters() {
        // Clean up footprints before hunter movement
        this.cleanupFootprints();
        
        this.hunters.forEach(hunter => {
            // Scared hunters prioritize moving away from Sasquatch
            if (hunter.scared) {
                const distanceToSasquatch = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
                
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1}
                ];
                
                const awayMoves = directions.filter(dir => {
                    const newX = hunter.x + dir.dx;
                    const newY = hunter.y + dir.dy;
                    const newDistance = Math.abs(newX - this.sasquatch.x) + Math.abs(newY - this.sasquatch.y);
                    
                    return newDistance > distanceToSasquatch && 
                           newX >= 0 && newX < this.boardSize && 
                           newY >= 0 && newY < this.boardSize && 
                           this.grid[newY][newX] !== 'tree' && 
                           this.grid[newY][newX] !== 'river' && 
                           this.grid[newY][newX] !== 'cave' && 
                           this.grid[newY][newX] !== 'hunter' &&
                           this.grid[newY][newX] !== 'pond';
                });
                
                if (awayMoves.length > 0) {
                    const move = awayMoves[Math.floor(Math.random() * awayMoves.length)];
                    this.moveHunter(hunter, hunter.x + move.dx, hunter.y + move.dy);
                    return; // Skip normal movement for scared hunters
                }
                // If no away moves, scared hunter might stay still or move randomly
            }
            
            // Normal hunter movement with footprint tracking
            this.moveHunterWithTracking(hunter);
        });
    }
    
    // NEW METHOD: Hunter movement with footprint tracking
    moveHunterWithTracking(hunter) {
        // If hunter is already tracking a footprint, follow it
        if (hunter.trackingFootprint) {
            const footprint = hunter.trackingFootprint;
            
            // Check if the tracked footprint still exists and is fresh enough
            const footprintExists = this.footprints.some(f => f.x === footprint.x && f.y === footprint.y);
            const footprintFreshness = this.getFootprintFreshness(footprint);
            
            if (!footprintExists || footprintFreshness > 0.8) { // Stop tracking if footprint is gone or too old
                hunter.trackingFootprint = null;
            } else {
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1}
                ];
                
                // Find move that gets closer to the tracked footprint
                const movesToFootprint = directions.filter(dir => {
                    const newX = hunter.x + dir.dx;
                    const newY = hunter.y + dir.dy;
                    const newDistance = Math.abs(newX - footprint.x) + Math.abs(newY - footprint.y);
                    const currentDistance = Math.abs(hunter.x - footprint.x) + Math.abs(hunter.y - footprint.y);
                    
                    return newDistance < currentDistance && 
                           newX >= 0 && newX < this.boardSize && 
                           newY >= 0 && newY < this.boardSize && 
                           this.grid[newY][newX] !== 'tree' && 
                           this.grid[newY][newX] !== 'river' && 
                           this.grid[newY][newX] !== 'cave' && 
                           this.grid[newY][newX] !== 'hunter' &&
                           this.grid[newY][newX] !== 'pond';
                });
                
                if (movesToFootprint.length > 0) {
                    const move = movesToFootprint[Math.floor(Math.random() * movesToFootprint.length)];
                    this.moveHunter(hunter, hunter.x + move.dx, hunter.y + move.dy);
                    
                    // If hunter reached the footprint, stop tracking it
                    if (hunter.x === footprint.x && hunter.y === footprint.y) {
                        hunter.trackingFootprint = null;
                    }
                    return;
                }
            }
        }
        
        // If not tracking a footprint, look for nearby footprints
        const nearbyFootprints = this.footprints.filter(footprint => {
            const distance = Math.abs(footprint.x - hunter.x) + Math.abs(footprint.y - hunter.y);
            const freshness = this.getFootprintFreshness(footprint);
            return distance <= 3 && freshness < 0.7; // Hunters detect footprints within 3 squares, prefer fresher ones
        });
        
        // Sort footprints by freshness (freshest first)
        nearbyFootprints.sort((a, b) => this.getFootprintFreshness(a) - this.getFootprintFreshness(b));
        
        // Start tracking the freshest nearby footprint
        if (nearbyFootprints.length > 0) {
            hunter.trackingFootprint = nearbyFootprints[0];
            return; // Will follow it on next move
        }
        
        // If no footprints nearby, move randomly
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
            {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        
        // Find valid moves (hunters can't move through terrain either)
        const validMoves = directions.filter(dir => {
            const newX = hunter.x + dir.dx;
            const newY = hunter.y + dir.dy;
            
            if (newX < 0 || newX >= this.boardSize || newY < 0 || newY >= this.boardSize) {
                return false;
            }
            
            const targetCell = this.grid[newY][newX];
            return targetCell !== 'tree' && 
                   targetCell !== 'river' && 
                   targetCell !== 'cave' && 
                   targetCell !== 'hunter' &&
                   targetCell !== 'pond';
        });
        
        // Move randomly if valid moves available
        if (validMoves.length > 0) {
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            const newX = hunter.x + move.dx;
            const newY = hunter.y + move.dy;
            
            this.moveHunter(hunter, newX, newY);
        }
    }
    
    // NEW HELPER METHOD: Handle hunter movement with mushroom collection
    moveHunter(hunter, newX, newY) {
        // Check if hunter is moving onto a mushroom
        if (this.grid[newY][newX] === 'mushroom') {
            hunter.mushrooms++;
            this.showMessage(`A hunter found a mushroom and became invisible!`);
            
            // Hunters use mushrooms immediately when they find them
            if (hunter.mushrooms > 0) {
                this.hunterEatMushroom(hunter);
            }
        }
        
        // Update grid and hunter position
        // Only remove hunter from old position if they were visible
        if (!hunter.invisible) {
            this.grid[hunter.y][hunter.x] = 'empty';
        }
        
        hunter.x = newX;
        hunter.y = newY;
        
        // Only mark cell as 'hunter' if the hunter is visible
        if (!hunter.invisible) {
            this.grid[newY][newX] = 'hunter';
        }
        // If hunter is invisible, the cell remains as whatever it was (empty, etc.)
    }
    
    // Hunter mushroom consumption
    hunterEatMushroom(hunter) {
        if (hunter.mushrooms > 0) {
            hunter.mushrooms--;
            hunter.invisible = true;
            
            // Remove hunter from grid when invisible
            this.grid[hunter.y][hunter.x] = 'empty';
            
            this.showMessage("A hunter ate a mushroom and vanished!");
            
            // Hunters stay invisible for 5 seconds (shorter than player)
            if (hunter.invisibleTimer) clearTimeout(hunter.invisibleTimer);
            hunter.invisibleTimer = setTimeout(() => {
                hunter.invisible = false;
                // Only put hunter back on grid if they're still in bounds and not on another object
                if (hunter.x >= 0 && hunter.x < this.boardSize && 
                    hunter.y >= 0 && hunter.y < this.boardSize &&
                    this.grid[hunter.y][hunter.x] === 'empty') {
                    this.grid[hunter.y][hunter.x] = 'hunter';
                }
                this.renderBoard();
            }, 5000);
            
            this.renderBoard();
        }
    }
    
    // Bang Tree - Now creates bridges on water squares
    bangTree() {
        // Check if Sasquatch is next to a tree
        const adjacentTree = this.trees.find(tree => {
            const distance = Math.abs(tree.x - this.sasquatch.x) + Math.abs(tree.y - this.sasquatch.y);
            return distance === 1;
        });
        
        if (adjacentTree) {
            // First check if we can create a bridge on adjacent water
            const bridgeCreated = this.tryCreateBridge(adjacentTree);
            
            if (bridgeCreated) {
                this.showMessage("You created a bridge across the river!");
            } else {
                this.showMessage("You bang on the tree loudly!");
            }
            
            // Always scare hunters when banging on any tree
            this.scareHunters();
            
        } else {
            this.showMessage("You need to be next to a tree to bang on it!");
        }
    }
    
    // Method to create bridges on water squares
    tryCreateBridge(tree) {
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
            {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        
        // Check all directions around the tree for rivers
        for (const dir of directions) {
            const waterX = tree.x + dir.dx;
            const waterY = tree.y + dir.dy;
            
            // Check if adjacent cell is a river
            if (waterX >= 0 && waterX < this.boardSize && 
                waterY >= 0 && waterY < this.boardSize && 
                this.grid[waterY][waterX] === 'river') {
                
                // Check if there's land on the opposite side of the river
                const oppositeX = waterX + dir.dx;
                const oppositeY = waterY + dir.dy;
                
                if (oppositeX >= 0 && oppositeX < this.boardSize && 
                    oppositeY >= 0 && oppositeY < this.boardSize && 
                    this.grid[oppositeY][oppositeX] !== 'river') {
                    
                    // Remove the tree
                    this.removeTree(tree.x, tree.y);
                    
                    // Add bridge at the WATER position (not the tree position)
                    this.bridges.push({ x: waterX, y: waterY });
                    
                    return true;
                }
            }
        }
        return false;
    }
    
    // Helper method to remove a tree
    removeTree(x, y) {
        // Remove from trees array
        const treeIndex = this.trees.findIndex(tree => tree.x === x && tree.y === y);
        if (treeIndex !== -1) {
            this.trees.splice(treeIndex, 1);
        }
        
        // Remove from grid
        this.grid[y][x] = 'empty';
    }
    
    // Extracted scare hunters logic
    scareHunters() {
        this.hunters.forEach(hunter => {
            // Invisible hunters aren't scared by tree banging
            if (hunter.invisible) return;
            
            const distance = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
            
            if (distance <= 4) {
                hunter.scared = true;
                hunter.trackingFootprint = null; // Stop tracking when scared
                
                // Hunters stay scared for 3 seconds
                if (hunter.scaredTimer) clearTimeout(hunter.scaredTimer);
                hunter.scaredTimer = setTimeout(() => {
                    hunter.scared = false;
                    this.renderBoard();
                }, 3000);
            }
        });
        
        this.renderBoard();
    }
    
    // Abilities
    makeNoise() {
        this.showMessage("You make a loud noise...");
        
        this.hunters.forEach(hunter => {
            // Invisible hunters aren't affected by noise
            if (hunter.invisible) return;
            
            const distance = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
            // Hunters within 5 squares hear the noise
            if (distance <= 5) {
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1}
                ];
                
                const moveToSasquatch = directions.find(dir => {
                    const newX = hunter.x + dir.dx;
                    const newY = hunter.y + dir.dy;
                    const newDistance = Math.abs(newX - this.sasquatch.x) + Math.abs(newY - this.sasquatch.y);
                    return newDistance < distance && 
                           newX >= 0 && newX < this.boardSize && 
                           newY >= 0 && newY < this.boardSize && 
                           this.grid[newY][newX] !== 'tree' && 
                           this.grid[newY][newX] !== 'river' && 
                           this.grid[newY][newX] !== 'cave' && 
                           this.grid[newY][newX] !== 'hunter' &&
                           this.grid[newY][newX] !== 'pond';
                });
                
                if (moveToSasquatch) {
                    // Use the new moveHunter method
                    this.moveHunter(hunter, hunter.x + moveToSasquatch.dx, hunter.y + moveToSasquatch.dy);
                }
            }
        });
        
        // Only render board, game loop handles game over check
        this.renderBoard();
    }
    
    // Mushroom powers
    eatMushroom() {
        if (this.mushrooms > 0) {
            this.mushrooms--;
            this.isInvisible = true;
            this.showMessage("You turned invisible for 3 seconds!");
            
            if (this.invisibilityTimer) clearTimeout(this.invisibilityTimer);
            this.invisibilityTimer = setTimeout(() => {
                this.isInvisible = false;
                this.showMessage("You are visible again!");
                this.renderBoard();
            }, 3000);
            
            this.updateUI();
            this.renderBoard();
        } else {
            this.showMessage("No mushrooms available!");
        }
    }
    
    // Game Management
    checkGameOver() {
        const hunterNearby = this.hunters.some(hunter => {
            const distance = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
            // Game over conditions:
            // - Hunter is within 1 square
            // - Hunter is not scared
            // - Sasquatch is not invisible
            // - Hunter is not invisible (invisible hunters can't catch you)
            return distance <= 1 && !hunter.scared && !this.isInvisible && !hunter.invisible;
        });
        
        if (hunterNearby) {
            this.stopGameLoop(); // Stop game loop when game over
            this.gameOver();
        }
    }
    
    completeLevel() {
        this.stopGameLoop(); // Stop game loop when level complete
        document.getElementById('levelCompleteScreen').classList.remove('hidden');
    }
    
    gameOver() {
        document.getElementById('gameOverScreen').classList.remove('hidden');
    }
    
    nextLevel() {
        this.level++;
        document.getElementById('levelCompleteScreen').classList.add('hidden');
        this.generateLevel();
    }
    
    startGame() {
        document.getElementById('startScreen').classList.add('hidden');
        this.level = 1;
        this.mushrooms = 0;
        this.generateLevel();
    }
    
    restartGame() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        this.startGame();
    }
    
    updateUI() {
        this.levelElement.textContent = this.level;
        this.hunterCountElement.textContent = this.hunterCount;
        this.mushroomCountElement.textContent = this.mushrooms;
    }
    
    showMessage(text) {
        this.messageElement.textContent = text;
        setTimeout(() => {
            this.messageElement.textContent = '';
        }, 3000);
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new SasquatchGame();
});
