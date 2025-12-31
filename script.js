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
        this.moveCooldown = 400;
        this.moveTimer = null;

        // Footprints system
        this.footprints = [];
        this.footprintDuration = 3000;

        // Get references to HTML elements
        this.gameBoard = document.getElementById('gameBoard');
        this.levelElement = document.getElementById('levelNumber');
        this.hunterCountElement = document.getElementById('hunterCount');
        this.mushroomCountElement = document.getElementById('mushroomCount');
        this.messageElement = document.getElementById('message');
        
        this.initializeEventListeners();
        this.showStartScreen();
        
        // Make game accessible globally for mobile controls
        window.game = this;
    }
    
    showStartScreen() {
        document.getElementById('startScreen').classList.remove('hidden');
    }
    
    startGameLoop() {
        if (this.gameLoop) clearInterval(this.gameLoop);
        if (this.animalLoop) clearInterval(this.animalLoop);
        
        this.gameLoop = setInterval(() => {
            this.moveHunters();
            this.renderBoard();
            this.checkGameOver();
        }, 800);
        
        this.animalLoop = setInterval(() => {
            this.moveAnimals();
            this.renderBoard();
        }, 1200);
    }
    
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
    
    initializeMobileControls() {
        const isMobile = window.innerWidth <= 768 || 
                        'ontouchstart' in window || 
                        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.classList.remove('hidden');
            }
            
            this.connectMobileButtons();
        }
    }
    
    connectMobileButtons() {
        const upBtn = document.querySelector('.touch-btn.up');
        const downBtn = document.querySelector('.touch-btn.down');
        const leftBtn = document.querySelector('.touch-btn.left');
        const rightBtn = document.querySelector('.touch-btn.right');
        
        if (upBtn && downBtn && leftBtn && rightBtn) {
            // Clone buttons to remove old listeners
            const newUp = upBtn.cloneNode(true);
            const newDown = downBtn.cloneNode(true);
            const newLeft = leftBtn.cloneNode(true);
            const newRight = rightBtn.cloneNode(true);
            
            upBtn.parentNode.replaceChild(newUp, upBtn);
            downBtn.parentNode.replaceChild(newDown, downBtn);
            leftBtn.parentNode.replaceChild(newLeft, leftBtn);
            rightBtn.parentNode.replaceChild(newRight, rightBtn);
            
            // Add click handlers
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
            
            // Add touch handlers
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
    
    handleKeyPress(e) {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const levelCompleteScreen = document.getElementById('levelCompleteScreen');
        
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
        
        if (!startScreen.classList.contains('hidden') || 
            !gameOverScreen.classList.contains('hidden') ||
            !levelCompleteScreen.classList.contains('hidden')) {
            return;
        }
        
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
    
    generateLevel() {
        this.grid = [];
        this.trees = [];
        this.hunters = [];
        this.rivers = [];
        this.bridges = [];
        this.ponds = [];
        this.animals = [];
        this.footprints = [];

        this.createEmptyGrid();
        this.placeSasquatch();
        this.placeCave();
        this.placeTrees();
        this.placeHunters();
        
        if (this.level >= 3) {
            this.placeRivers();
        }
        
        if (this.level >= 6) {
            this.placeMushrooms();
        }
        
        if (Math.random() < 0.7) {
            this.placePonds();
        }
        
        this.placeAnimals();
        
        this.renderBoard();
        this.updateUI();
        this.startGameLoop();
    }
    
    createEmptyGrid() {
        this.grid = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill('empty'));
    }
    
    placeSasquatch() {
        do {
            this.sasquatch = {
                x: Math.floor(Math.random() * this.boardSize),
                y: Math.floor(Math.random() * this.boardSize)
            };
        } while (this.grid[this.sasquatch.y][this.sasquatch.x] !== 'empty');
        
        this.grid[this.sasquatch.y][this.sasquatch.x] = 'sasquatch';
    }
    
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
    
    placeTrees() {
        const treeCount = 20 + this.level * 2;
        
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
        this.hunterCount = this.level;
        
        for (let i = 0; i < this.hunterCount; i++) {
            let hunterPlaced = false;
            while (!hunterPlaced) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                
                if (this.grid[y][x] === 'empty') {
                    const distanceToSasquatch = Math.abs(x - this.sasquatch.x) + Math.abs(y - this.sasquatch.y);
                    const distanceToCave = Math.abs(x - this.cave.x) + Math.abs(y - this.cave.y);
                    
                    if (distanceToSasquatch > 3 && distanceToCave > 3) {
                        this.hunters.push({ 
                            x, 
                            y,
                            scared: false,
                            scaredTimer: null,
                            mushrooms: 0,
                            invisible: false,
                            invisibleTimer: null,
                            trackingFootprint: null
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
    
    placePonds() {
        const pondCount = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < pondCount; i++) {
            let centerFound = false;
            let attempts = 0;
            
            while (!centerFound && attempts < 20) {
                const centerX = 3 + Math.floor(Math.random() * (this.boardSize - 6));
                const centerY = 3 + Math.floor(Math.random() * (this.boardSize - 6));
                
                if (this.grid[centerY][centerX] === 'empty' &&
                    Math.abs(centerX - this.sasquatch.x) > 3 &&
                    Math.abs(centerY - this.sasquatch.y) > 3 &&
                    Math.abs(centerX - this.cave.x) > 3 &&
                    Math.abs(centerY - this.cave.y) > 3) {
                    
                    const pondSize = 2 + Math.floor(Math.random() * 3);
                    this.createPond(centerX, centerY, pondSize);
                    centerFound = true;
                }
                attempts++;
            }
        }
    }
    
    createPond(centerX, centerY, size) {
        const pondCells = [];
        const queue = [{x: centerX, y: centerY}];
        const visited = new Set();
        
        while (queue.length > 0 && pondCells.length < size) {
            const current = queue.shift();
            const key = `${current.x},${current.y}`;
            
            if (visited.has(key)) continue;
            visited.add(key);
            
            if (this.grid[current.y][current.x] === 'empty' &&
                Math.abs(current.x - this.sasquatch.x) > 2 &&
                Math.abs(current.y - this.sasquatch.y) > 2 &&
                Math.abs(current.x - this.cave.x) > 2 &&
                Math.abs(current.y - this.cave.y) > 2) {
                
                pondCells.push({x: current.x, y: current.y});
                this.grid[current.y][current.x] = 'pond';
                
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
    
    placeAnimals() {
        const animalTypes = ['bunny', 'squirrel', 'deer', 'bird'];
        const animalCount = 3 + this.level;
        
        for (let i = 0; i < animalCount; i++) {
            const animalType = animalTypes[Math.floor(Math.random() * animalTypes.length)];
            let animalPlaced = false;
            let attempts = 0;
            
            while (!animalPlaced && attempts < 20) {
                const x = Math.floor(Math.random() * this.boardSize);
                const y = Math.floor(Math.random() * this.boardSize);
                
                if (this.grid[y][x] === 'empty') {
                    const distanceToSasquatch = Math.abs(x - this.sasquatch.x) + Math.abs(y - this.sasquatch.y);
                    const distanceToCave = Math.abs(x - this.cave.x) + Math.abs(y - this.cave.y);
                    
                    if (distanceToSasquatch > 3 && distanceToCave > 3) {
                        this.animals.push({ 
                            x, 
                            y, 
                            type: animalType,
                            moveCounter: 0
                        });
                        animalPlaced = true;
                    }
                }
                attempts++;
            }
        }
    }
    
    moveAnimals() {
        this.animals.forEach(animal => {
            animal.moveCounter++;
            
            if (animal.moveCounter >= 2) {
                animal.moveCounter = 0;
                
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1},
                    {dx: 0, dy: 0}
                ];
                
                const move = directions[Math.floor(Math.random() * directions.length)];
                const newX = animal.x + move.dx;
                const newY = animal.y + move.dy;
                
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.grid[newY][newX] === 'empty') {
                    
                    animal.x = newX;
                    animal.y = newY;
                }
            }
        });
    }
    
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
                
                const cellContent = this.grid[y][x];
                const footprintHere = this.footprints.find(f => f.x === x && f.y === y);
                
                if (cellContent === 'hunter') {
                    const hunter = this.hunters.find(h => h.x === x && h.y === y);
                    if (hunter && hunter.invisible) {
                        this.gameBoard.appendChild(cell);
                        continue;
                    }
                }
                
                const animalHere = this.animals.find(a => a.x === x && a.y === y);
                
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
                        if (this.bridges.some(b => b.x === x && b.y === y)) {
                            cell.classList.add('bridge');
                            cell.textContent = '🪵';
                        }
                }
                
                if (footprintHere && cellContent === 'empty') {
                    const elapsed = Date.now() - footprintHere.timestamp;
                    const remaining = Math.max(0, this.footprintDuration - elapsed);
                    const opacity = remaining / this.footprintDuration;
                    
                    cell.style.opacity = opacity;
                    cell.textContent = '👣';
                    cell.classList.add('footprint');
                }
                
                if (animalHere && cellContent === 'empty' && !footprintHere) {
                    switch (animalHere.type) {
                        case 'bunny': cell.textContent = '🐇'; cell.classList.add('animal', 'bunny'); break;
                        case 'squirrel': cell.textContent = '🐿️'; cell.classList.add('animal', 'squirrel'); break;
                        case 'deer': cell.textContent = '🦌'; cell.classList.add('animal', 'deer'); break;
                        case 'bird': cell.textContent = '🐦'; cell.classList.add('animal', 'bird'); break;
                    }
                }
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    addFootprint(x, y) {
        if (this.isInvisible) return;
        
        const cellContent = this.grid[y][x];
        if (cellContent === 'river' || cellContent === 'pond' || cellContent === 'tree') {
            return;
        }
        
        const existingFootprint = this.footprints.find(f => f.x === x && f.y === y);
        if (existingFootprint) {
            existingFootprint.timestamp = Date.now();
            return;
        }
        
        this.footprints.push({ x, y, timestamp: Date.now() });
    }
    
    cleanupFootprints() {
        const now = Date.now();
        this.footprints = this.footprints.filter(footprint => {
            const elapsed = now - footprint.timestamp;
            return elapsed < this.footprintDuration;
        });
    }
    
    getFootprintFreshness(footprint) {
        const elapsed = Date.now() - footprint.timestamp;
        return elapsed / this.footprintDuration;
    }
    
    moveSasquatch(newX, newY) {
        if (newX < 0 || newX >= this.boardSize || newY < 0 || newY >= this.boardSize) return;
        
        const targetCell = this.grid[newY][newX];
        const hunterAtPosition = this.hunters.find(h => h.x === newX && h.y === newY);
        
        if (targetCell === 'tree' || 
            targetCell === 'pond' ||
            (targetCell === 'hunter' && hunterAtPosition && !hunterAtPosition.invisible)) {
            return;
        }
        
        if (targetCell === 'river') {
            const hasBridge = this.bridges.some(bridge => bridge.x === newX && bridge.y === newY);
            if (!hasBridge) {
                this.showMessage("You need to create a bridge first!");
                return;
            }
        }
        
        this.canMove = false;
        if (this.moveTimer) clearTimeout(this.moveTimer);
        this.moveTimer = setTimeout(() => {
            this.canMove = true;
        }, this.moveCooldown);
        
        this.addFootprint(this.sasquatch.x, this.sasquatch.y);
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
        
        this.cleanupFootprints();
        this.renderBoard();
    }
    
    moveHunters() {
        this.cleanupFootprints();
        
        this.hunters.forEach(hunter => {
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
                    return;
                }
            }
            
            this.moveHunterWithTracking(hunter);
        });
    }
    
    moveHunterWithTracking(hunter) {
        if (hunter.trackingFootprint) {
            const footprint = hunter.trackingFootprint;
            const footprintExists = this.footprints.some(f => f.x === footprint.x && f.y === footprint.y);
            const footprintFreshness = this.getFootprintFreshness(footprint);
            
            if (!footprintExists || footprintFreshness > 0.8) {
                hunter.trackingFootprint = null;
            } else {
                const directions = [
                    {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
                    {dx: 0, dy: 1}, {dx: 0, dy: -1}
                ];
                
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
                    
                    if (hunter.x === footprint.x && hunter.y === footprint.y) {
                        hunter.trackingFootprint = null;
                    }
                    return;
                }
            }
        }
        
        const nearbyFootprints = this.footprints.filter(footprint => {
            const distance = Math.abs(footprint.x - hunter.x) + Math.abs(footprint.y - hunter.y);
            const freshness = this.getFootprintFreshness(footprint);
            return distance <= 3 && freshness < 0.7;
        });
        
        nearbyFootprints.sort((a, b) => this.getFootprintFreshness(a) - this.getFootprintFreshness(b));
        
        if (nearbyFootprints.length > 0) {
            hunter.trackingFootprint = nearbyFootprints[0];
            return;
        }
        
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
            {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        
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
        
        if (validMoves.length > 0) {
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            const newX = hunter.x + move.dx;
            const newY = hunter.y + move.dy;
            
            this.moveHunter(hunter, newX, newY);
        }
    }
    
    moveHunter(hunter, newX, newY) {
        if (this.grid[newY][newX] === 'mushroom') {
            hunter.mushrooms++;
            this.showMessage(`A hunter found a mushroom and became invisible!`);
            
            if (hunter.mushrooms > 0) {
                this.hunterEatMushroom(hunter);
            }
        }
        
        if (!hunter.invisible) {
            this.grid[hunter.y][hunter.x] = 'empty';
        }
        
        hunter.x = newX;
        hunter.y = newY;
        
        if (!hunter.invisible) {
            this.grid[newY][newX] = 'hunter';
        }
    }
    
    hunterEatMushroom(hunter) {
        if (hunter.mushrooms > 0) {
            hunter.mushrooms--;
            hunter.invisible = true;
            this.grid[hunter.y][hunter.x] = 'empty';
            
            this.showMessage("A hunter ate a mushroom and vanished!");
            
            if (hunter.invisibleTimer) clearTimeout(hunter.invisibleTimer);
            hunter.invisibleTimer = setTimeout(() => {
                hunter.invisible = false;
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
    
    bangTree() {
        const adjacentTree = this.trees.find(tree => {
            const distance = Math.abs(tree.x - this.sasquatch.x) + Math.abs(tree.y - this.sasquatch.y);
            return distance === 1;
        });
        
        if (adjacentTree) {
            const bridgeCreated = this.tryCreateBridge(adjacentTree);
            
            if (bridgeCreated) {
                this.showMessage("You created a bridge across the river!");
            } else {
                this.showMessage("You bang on the tree loudly!");
            }
            
            this.scareHunters();
        } else {
            this.showMessage("You need to be next to a tree to bang on it!");
        }
    }
    
    tryCreateBridge(tree) {
        const directions = [
            {dx: 1, dy: 0}, {dx: -1, dy: 0}, 
            {dx: 0, dy: 1}, {dx: 0, dy: -1}
        ];
        
        for (const dir of directions) {
            const waterX = tree.x + dir.dx;
            const waterY = tree.y + dir.dy;
            
            if (waterX >= 0 && waterX < this.boardSize && 
                waterY >= 0 && waterY < this.boardSize && 
                this.grid[waterY][waterX] === 'river') {
                
                const oppositeX = waterX + dir.dx;
                const oppositeY = waterY + dir.dy;
                
                if (oppositeX >= 0 && oppositeX < this.boardSize && 
                    oppositeY >= 0 && oppositeY < this.boardSize && 
                    this.grid[oppositeY][oppositeX] !== 'river') {
                    
                    this.removeTree(tree.x, tree.y);
                    this.bridges.push({ x: waterX, y: waterY });
                    return true;
                }
            }
        }
        return false;
    }
    
    removeTree(x, y) {
        const treeIndex = this.trees.findIndex(tree => tree.x === x && tree.y === y);
        if (treeIndex !== -1) {
            this.trees.splice(treeIndex, 1);
        }
        this.grid[y][x] = 'empty';
    }
    
    scareHunters() {
        this.hunters.forEach(hunter => {
            if (hunter.invisible) return;
            
            const distance = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
            
            if (distance <= 4) {
                hunter.scared = true;
                hunter.trackingFootprint = null;
                
                if (hunter.scaredTimer) clearTimeout(hunter.scaredTimer);
                hunter.scaredTimer = setTimeout(() => {
                    hunter.scared = false;
                    this.renderBoard();
                }, 3000);
            }
        });
        
        this.renderBoard();
    }
    
    makeNoise() {
        this.showMessage("You make a loud noise...");
        
        this.hunters.forEach(hunter => {
            if (hunter.invisible) return;
            
            const distance = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
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
                    this.moveHunter(hunter, hunter.x + moveToSasquatch.dx, hunter.y + moveToSasquatch.dy);
                }
            }
        });
        
        this.renderBoard();
    }
    
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
    
    checkGameOver() {
        const hunterNearby = this.hunters.some(hunter => {
            const distance = Math.abs(hunter.x - this.sasquatch.x) + Math.abs(hunter.y - this.sasquatch.y);
            return distance <= 1 && !hunter.scared && !this.isInvisible && !hunter.invisible;
        });
        
        if (hunterNearby) {
            this.stopGameLoop();
            this.gameOver();
        }
    }
    
    completeLevel() {
        this.stopGame
