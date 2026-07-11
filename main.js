// main.js - Global Interactions and App Logic

// Simple Confetti effect for Celebration Page
function fireConfetti() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    (function frame() {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ffb6c1', '#ff4d6d', '#fff']
        });
        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ffb6c1', '#ff4d6d', '#fff']
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// Log Visit
window.addEventListener('DOMContentLoaded', () => {
    fetch('/api/stats').catch(() => console.log('Stats log failed (offline mode)'));
});

// Runaway Button Logic for sorry.html
function setupSorryPage() {
    const noBtn = document.getElementById('no-btn');
    const yesBtn = document.getElementById('yes-btn');
    if (!noBtn || !yesBtn) return;

    // Move button away when hovered
    noBtn.addEventListener('mouseover', () => {
        const x = Math.random() * (window.innerWidth - 100);
        const y = Math.random() * (window.innerHeight - 100);
        noBtn.style.position = 'fixed';
        noBtn.style.left = `${x}px`;
        noBtn.style.top = `${y}px`;
    });

    yesBtn.addEventListener('click', async () => {
        fireConfetti();
        document.getElementById('sorry-content').innerHTML = `
            <h2 class="title" style="margin-top:20px;">Yay! You are the best! ❤️</h2>
            <img src="https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif" alt="Happy Cat" style="border-radius:15px; margin-top:20px; max-width:100%;">
            <br><br>
            <a href="celebration.html" class="btn">Let's Celebrate!</a>
        `;
        try {
            await fetch('/api/sorry-accepted', { method: 'POST' });
        } catch(e){}
    });
}

// Quiz Submission Logic
function setupQuizPage() {
    const form = document.getElementById('quiz-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const question = "Best memory";
        const answer = document.getElementById('answer').value;

        try {
            await fetch('/api/save-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question, answer })
            });
            form.innerHTML = `<h3 style="color:var(--accent-rose)">Your answer is saved! Love you! 💖</h3>
            <a href="game.html" class="btn">Play a Game!</a>`;
        } catch(e) {
            alert('Could not save... But I still love you!');
        }
    });
}

function setupMemoryGallery() {
    const gallery = document.getElementById('memory-gallery');
    if (!gallery) return;

    const leftPanel = document.getElementById('memory-left');
    const centerPanel = document.getElementById('memory-center');
    const rightPanel = document.getElementById('memory-right');
    const thumbnailRow = document.getElementById('memory-thumbnails');

    const memories = [
        'IMG-20250704-WA0016.jpg',
        'WhatsApp Image 2026-05-15 at 10.53.08 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.04 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.09 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.09 PM (1).jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.07 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.27 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.27 PM (1).jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.27 PM (2).jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.28 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.28 PM (1).jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.29 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.30 PM.jpeg',
        'WhatsApp Image 2026-05-15 at 10.53.32 PM.jpeg'
    ];

    let activeIndex = 0;

    function safePath(path) {
        return encodeURI(path);
    }

    function renderMemory(index) {
        activeIndex = index;
        centerPanel.innerHTML = `
            <div class="memory-main-card">
                <img src="${safePath(memories[index])}" alt="Memory ${index + 1}">
            </div>
        `;

        leftPanel.innerHTML = memories
            .slice(0, index)
            .reverse()
            .map((image, idx) => `
                <img src="${safePath(image)}" alt="Memory ${index - idx}" class="memory-side-thumb">
            `)
            .join('');

        rightPanel.innerHTML = memories
            .slice(index + 1)
            .map((image, idx) => `
                <img src="${safePath(image)}" alt="Memory ${index + idx + 2}" class="memory-side-thumb">
            `)
            .join('');

        thumbnailRow.querySelectorAll('.memory-thumb').forEach((thumb, idx) => {
            thumb.classList.toggle('active', idx === index);
        });
    }

    memories.forEach((image, idx) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'memory-thumb';
        button.innerHTML = `<img src="${safePath(image)}" alt="Memory ${idx + 1}">`;
        button.addEventListener('click', () => renderMemory(idx));
        thumbnailRow.appendChild(button);
    });

    renderMemory(activeIndex);
}


// Puzzle Game Logic
function setupGamePage() {
    const board = document.getElementById('puzzle-board');
    const pool = document.getElementById('pieces-pool');
    const status = document.getElementById('game-status');
    const timerLabel = document.getElementById('timer');
    const scoreBoard = document.getElementById('score-board');
    const restart = document.getElementById('restart-game');
    if (!board || !pool || !status || !timerLabel || !scoreBoard || !restart) return;

    const imageUrl = 'IMG-20250704-WA0016.jpg';
    const totalTime = 60;
    let timeLeft = totalTime;
    let timerId = null;
    let placedCount = 0;
    let gameOver = false;

    const pieces = [
        { id: 'p1', width: 128, height: 140, x: 0, y: 0, clip: 'polygon(0 0, 90% 0, 90% 15%, 100% 15%, 100% 48%, 90% 48%, 90% 55%, 100% 55%, 100% 85%, 90% 85%, 90% 100%, 0 100%, 0 85%, 10% 85%, 10% 55%, 0 55%, 0 48%, 10% 48%, 10% 15%, 0 15%)' },
        { id: 'p2', width: 128, height: 140, x: 128, y: 0, clip: 'polygon(0 0, 100% 0, 100% 15%, 90% 15%, 90% 48%, 100% 48%, 100% 55%, 90% 55%, 90% 85%, 100% 85%, 100% 100%, 0 100%, 0 85%, 10% 85%, 10% 55%, 0 55%, 0 48%, 10% 48%, 10% 15%, 0 15%)' },
        { id: 'p3', width: 128, height: 140, x: 256, y: 0, clip: 'polygon(0 0, 100% 0, 100% 15%, 90% 15%, 90% 48%, 100% 48%, 100% 55%, 90% 55%, 90% 85%, 100% 85%, 100% 100%, 0 100%, 0 85%, 10% 85%, 10% 55%, 0 55%, 0 48%, 10% 48%, 10% 15%, 0 15%)' },
        { id: 'p4', width: 128, height: 140, x: 384, y: 0, clip: 'polygon(0 0, 100% 0, 100% 15%, 90% 15%, 90% 35%, 100% 35%, 100% 60%, 90% 60%, 90% 80%, 100% 80%, 100% 100%, 0 100%, 0 80%, 10% 80%, 10% 60%, 0 60%, 0 35%, 10% 35%, 10% 15%, 0 15%)' },
        { id: 'p5', width: 128, height: 140, x: 512, y: 0, clip: 'polygon(0 0, 100% 0, 100% 15%, 90% 15%, 90% 48%, 100% 48%, 100% 55%, 90% 55%, 90% 85%, 100% 85%, 100% 100%, 0 100%, 0 85%, 10% 85%, 10% 55%, 0 55%, 0 48%, 10% 48%, 10% 15%, 0 15%)' },
        { id: 'p6', width: 128, height: 140, x: 0, y: 140, clip: 'polygon(0 0, 100% 0, 100% 16%, 90% 16%, 90% 40%, 100% 40%, 100% 58%, 90% 58%, 90% 84%, 100% 84%, 100% 100%, 0 100%, 0 84%, 10% 84%, 10% 58%, 0 58%, 0 40%, 10% 40%, 10% 16%, 0 16%)' },
        { id: 'p7', width: 128, height: 140, x: 128, y: 140, clip: 'polygon(0 0, 100% 0, 100% 20%, 88% 20%, 88% 40%, 100% 40%, 100% 56%, 88% 56%, 88% 78%, 100% 78%, 100% 100%, 0 100%, 0 78%, 12% 78%, 12% 56%, 0 56%, 0 40%, 12% 40%, 12% 20%, 0 20%)' },
        { id: 'p8', width: 128, height: 140, x: 256, y: 140, clip: 'polygon(0 0, 100% 0, 100% 16%, 90% 16%, 90% 40%, 100% 40%, 100% 58%, 90% 58%, 90% 84%, 100% 84%, 100% 100%, 0 100%, 0 84%, 10% 84%, 10% 58%, 0 58%, 0 40%, 10% 40%, 10% 16%, 0 16%)' },
        { id: 'p9', width: 128, height: 140, x: 384, y: 140, clip: 'polygon(0 0, 100% 0, 100% 16%, 90% 16%, 90% 40%, 100% 40%, 100% 58%, 90% 58%, 90% 84%, 100% 84%, 100% 100%, 0 100%, 0 84%, 10% 84%, 10% 58%, 0 58%, 0 40%, 10% 40%, 10% 16%, 0 16%)' },
        { id: 'p10', width: 128, height: 140, x: 512, y: 140, clip: 'polygon(0 0, 100% 0, 100% 16%, 90% 16%, 90% 40%, 100% 40%, 100% 58%, 90% 58%, 90% 84%, 100% 84%, 100% 100%, 0 100%, 0 84%, 10% 84%, 10% 58%, 0 58%, 0 40%, 10% 40%, 10% 16%, 0 16%)' },
        { id: 'p11', width: 128, height: 140, x: 0, y: 280, clip: 'polygon(0 0, 100% 0, 100% 20%, 90% 20%, 90% 40%, 100% 40%, 100% 55%, 90% 55%, 90% 76%, 100% 76%, 100% 100%, 0 100%, 0 76%, 10% 76%, 10% 55%, 0 55%, 0 40%, 10% 40%, 10% 20%, 0 20%)' },
        { id: 'p12', width: 128, height: 140, x: 128, y: 280, clip: 'polygon(0 0, 100% 0, 100% 20%, 90% 20%, 90% 40%, 100% 40%, 100% 55%, 90% 55%, 90% 76%, 100% 76%, 100% 100%, 0 100%, 0 76%, 10% 76%, 10% 55%, 0 55%, 0 40%, 10% 40%, 10% 20%, 0 20%)' },
        { id: 'p13', width: 128, height: 140, x: 256, y: 280, clip: 'polygon(0 0, 100% 0, 100% 20%, 90% 20%, 90% 40%, 100% 40%, 100% 55%, 90% 55%, 90% 76%, 100% 76%, 100% 100%, 0 100%, 0 76%, 10% 76%, 10% 55%, 0 55%, 0 40%, 10% 40%, 10% 20%, 0 20%)' },
        { id: 'p14', width: 128, height: 140, x: 384, y: 280, clip: 'polygon(0 0, 100% 0, 100% 20%, 90% 20%, 90% 40%, 100% 40%, 100% 55%, 90% 55%, 90% 76%, 100% 76%, 100% 100%, 0 100%, 0 76%, 10% 76%, 10% 55%, 0 55%, 0 40%, 10% 40%, 10% 20%, 0 20%)' },
        { id: 'p15', width: 128, height: 140, x: 512, y: 280, clip: 'polygon(0 0, 100% 0, 100% 20%, 90% 20%, 90% 40%, 100% 40%, 100% 55%, 90% 55%, 90% 76%, 100% 76%, 100% 100%, 0 100%, 0 76%, 10% 76%, 10% 55%, 0 55%, 0 40%, 10% 40%, 10% 20%, 0 20%)' }
    ];

    function resetGame() {
        clearInterval(timerId);
        placedCount = 0;
        timeLeft = totalTime;
        gameOver = false;
        board.innerHTML = '';
        pool.innerHTML = '';
        board.style.backgroundImage = 'none';
        scoreBoard.textContent = `Pieces placed: ${placedCount} / ${pieces.length}`;
        timerLabel.textContent = `Time left: ${timeLeft}s`;
        status.textContent = 'Drag each jigsaw piece into its correct place before time runs out.';
        board.classList.remove('game-over');
        board.classList.add('empty');

        pieces.forEach(piece => createSlot(piece));
        pieces
            .slice()
            .sort(() => 0.5 - Math.random())
            .forEach(piece => createPiece(piece));

        timerId = setInterval(() => {
            if (gameOver) return;
            timeLeft -= 1;
            timerLabel.textContent = `Time left: ${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(timerId);
                endGame(false);
            }
        }, 1000);
    }

    function createSlot(piece) {
        const slot = document.createElement('div');
        slot.className = 'puzzle-slot';
        slot.style.width = `${piece.width}px`;
        slot.style.height = `${piece.height}px`;
        slot.style.left = `${piece.x}px`;
        slot.style.top = `${piece.y}px`;
        slot.style.clipPath = piece.clip;
        slot.dataset.id = piece.id;
        board.appendChild(slot);
    }

    function createPiece(piece) {
        const tile = document.createElement('div');
        tile.className = 'puzzle-piece';
        tile.draggable = true;
        tile.dataset.id = piece.id;
        tile.dataset.placed = 'false';
        tile.style.width = `${piece.width}px`;
        tile.style.height = `${piece.height}px`;
        tile.style.clipPath = piece.clip;
        tile.style.backgroundImage = `url('${imageUrl}')`;
        tile.style.backgroundSize = '640px 420px';
        tile.style.backgroundPosition = `-${piece.x}px -${piece.y}px`;
        tile.addEventListener('dragstart', e => {
            if (gameOver) {
                e.preventDefault();
                return;
            }
            e.dataTransfer.setData('text/plain', piece.id);
            e.dataTransfer.effectAllowed = 'move';
        });
        pool.appendChild(tile);
    }

    board.addEventListener('dragover', e => {
        if (gameOver) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    board.addEventListener('drop', e => {
        if (gameOver) return;
        e.preventDefault();
        const pieceId = e.dataTransfer.getData('text/plain');
        const piece = pieces.find(p => p.id === pieceId);
        if (!piece) return;

        const rect = board.getBoundingClientRect();
        const dropX = e.clientX - rect.left;
        const dropY = e.clientY - rect.top;
        const targetX = piece.x + piece.width / 2;
        const targetY = piece.y + piece.height / 2;

        const pieceElem = document.querySelector(`.puzzle-piece[data-id="${pieceId}"]`);
        if (!pieceElem || pieceElem.dataset.placed === 'true') return;

        const distance = Math.hypot(dropX - targetX, dropY - targetY);
        if (distance < 80) {
            pieceElem.dataset.placed = 'true';
            pieceElem.classList.add('placed');
            pieceElem.style.position = 'absolute';
            pieceElem.style.left = `${piece.x}px`;
            pieceElem.style.top = `${piece.y}px`;
            pieceElem.style.cursor = 'default';
            board.appendChild(pieceElem);
            board.classList.remove('empty');
            placedCount += 1;
            scoreBoard.textContent = `Pieces placed: ${placedCount} / ${pieces.length}`;
            if (placedCount === pieces.length) {
                endGame(true);
            }
        } else {
            status.textContent = 'Not quite right — try again!';
            setTimeout(() => {
                if (!gameOver) {
                    status.textContent = 'Drag each uneven piece into its correct spot before time runs out.';
                }
            }, 1200);
        }
    });

    function endGame(won) {
        gameOver = true;
        if (won) {
            board.innerHTML = '';
            board.style.backgroundImage = `url('${imageUrl}')`;
            board.style.backgroundSize = '640px 420px';
            board.style.backgroundPosition = 'center';
            status.innerHTML = 'Beautiful! The puzzle is complete with no gaps! 💕<br><a href="index.html" class="btn">Back Home</a>';
            fireConfetti();
        } else {
            status.textContent = 'Time is up! You can restart and try again.';
            board.classList.add('game-over');
            document.querySelectorAll('.puzzle-piece').forEach(piece => {
                piece.draggable = false;
            });
        }
    }

    restart.addEventListener('click', resetGame);
    resetGame();
}

// Init appropriate page logic
window.addEventListener('DOMContentLoaded', () => {
    setupSorryPage();
    setupQuizPage();
    setupMemoryGallery();
    setupGamePage();
    
    // Auto fire confetti on celebration page
    if(window.location.pathname.includes('celebration.html')) {
        setTimeout(fireConfetti, 500);
    }
});
