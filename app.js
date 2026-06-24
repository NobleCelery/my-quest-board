// 1. Load data from LocalStorage
let totalGold = parseInt(localStorage.getItem('totalGold')) || 0;
let dailyQuests = JSON.parse(localStorage.getItem('dailyQuests')) || [
    { id: 1, text: "30 Push-ups", gold: 20, type: "recurring", completedToday: false }
];
let lastOpenDate = localStorage.getItem('lastOpenDate') || "";

// Streak State tracking
let normalStreak = parseInt(localStorage.getItem('normalStreak')) || 0;
let goldStreak = parseInt(localStorage.getItem('goldStreak')) || 0;

// Store history for the last 7 days array
let streakHistory = JSON.parse(localStorage.getItem('streakHistory')) || [];

// Custom unlocks tracking
let activeCursor = localStorage.getItem('activeCursor') || "normal";
let activeTheme = localStorage.getItem('activeTheme') || "theme-default";
let petLevel = parseInt(localStorage.getItem('petLevel')) || 1;

// INVENTORY SYSTEM
let unlockedItems = JSON.parse(localStorage.getItem('unlockedItems')) || ["c3", "t3"];

const petStages = {
    1: { name: "Mysterious Bird Egg", stage: "Stage 1: Unhatched", avatar: "🥚" },
    2: { name: "Fire Fledgeling", stage: "Stage 2: Hatchling", avatar: "🐥" },
    3: { name: "Cosmic Phoenix", stage: "Stage 3: Max Level", avatar: "🦅" }
};

const shopCategories = [
    {
        title: "Cursors",
        items: [
            { id: "c1", text: "Equip Sword Cursor ⚔️", cost: 30, type: "cursor", value: "sword-cursor" },
            { id: "c2", text: "Equip Magic Wand 🪄", cost: 60, type: "cursor", value: "magic-cursor" },
            { id: "c3", text: "Equip Normal Cursor", cost: 0, type: "cursor", value: "normal" }
        ]
    },
    {
        title: "Layout Themes",
        items: [
            { id: "t1", text: "Cyberpunk Neon Theme 🌆", cost: 75, type: "theme", value: "theme-cyberpunk" },
            { id: "t2", text: "Forest Druid Theme 🌿", cost: 75, type: "theme", value: "theme-forest" },
            { id: "t3", text: "Classic Dark Theme", cost: 0, type: "theme", value: "theme-default" }
        ]
    },
    {
        title: "Pet Upgrades",
        items: [
            { id: "p2", text: "Evolve your pet ✨", cost: 100, type: "pet", levelReq: 2 },
            { id: "p3", text: "Evolve your pet ✨ (Final Form)", cost: 250, type: "pet", levelReq: 3 }
        ]
    }
];

// Grab HTML elements
const scoreDisplay = document.getElementById('score');
const taskInput = document.getElementById('task-input');
const difficultyInput = document.getElementById('difficulty-input');
const typeInput = document.getElementById('type-input');
const addBtn = document.getElementById('add-btn');
const resetGoldBtn = document.getElementById('reset-gold-btn');
const taskList = document.getElementById('task-list');
const adminTaskList = document.getElementById('admin-task-list');
const shopContainer = document.getElementById('shop-container');
const rolloverLog = document.getElementById('rollover-log');

const petAvatar = document.getElementById('pet-avatar');
const petName = document.getElementById('pet-name');
const petStage = document.getElementById('pet-stage');

// Numeric Counters
const normalCount = document.getElementById('normal-count');
const goldCount = document.getElementById('gold-count');
const timelineContainer = document.getElementById('streak-timeline-container');

// Apply cosmetics on launch
applyCosmetics();

// 2. AUTOMATIC MIDNIGHT CALCULATOR ENGINE
function checkDailyRollover() {
    const todayDateStr = new Date().toDateString();

    if (!lastOpenDate) {
        localStorage.setItem('lastOpenDate', todayDateStr);
        initializeBlankHistory();
        return;
    }

    if (lastOpenDate !== todayDateStr) {
        const dailyTrackers = dailyQuests.filter(q => q.type === "recurring");
        let statusResult = "missed";

        if (dailyTrackers.length > 0) {
            const completedCount = dailyTrackers.filter(q => q.completedToday).length;
            const completionRatio = completedCount / dailyTrackers.length;

            if (completionRatio === 1.0) {
                goldStreak += 1;
                normalStreak += 1;
                totalGold += 50;
                statusResult = "gold";
                rolloverLog.innerText = "Yesterday: 100% Complete! Gold Streak! (+50g)";
            } else if (completionRatio >= 0.50) {
                normalStreak += 1;
                goldStreak = 0;
                totalGold += 20;
                statusResult = "orange";
                rolloverLog.innerText = "Yesterday: Over 50% Complete! Streak Up! (+20g)";
            } else {
                normalStreak = 0;
                goldStreak = 0;
                statusResult = "missed";
                rolloverLog.innerText = "Yesterday: Under 50%. Streak reset to 0.";
            }
        }

        const yesterdayObj = new Date();
        yesterdayObj.setDate(yesterdayObj.getDate() - 1);

        streakHistory.push({
            dayLabel: yesterdayObj.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
            status: statusResult
        });

        if (streakHistory.length > 7) streakHistory.shift();

        dailyQuests.forEach(q => {
            if (q.type === "recurring") q.completedToday = false;
        });

        localStorage.setItem('lastOpenDate', todayDateStr);
        saveData();
    }
}

function initializeBlankHistory() {
    streakHistory = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        streakHistory.push({
            dayLabel: d.toLocaleDateString('en-US', { weekday: 'short' }).substring(0, 2),
            status: "empty"
        });
    }
    saveData();
}

checkDailyRollover();

// 3. Main Dashboard Render Engine
function updateInterface() {
    scoreDisplay.innerText = totalGold;
    taskList.innerHTML = "";
    adminTaskList.innerHTML = "";
    shopContainer.innerHTML = "";

    normalCount.innerText = "Regular: " + normalStreak + "d";
    goldCount.innerText = "Max: " + goldStreak + "d";

    // --- DRAW VISUAL STREAK TIMELINE LINE ---
    timelineContainer.innerHTML = "";
    let currentDisplayItems = [...streakHistory];
    while (currentDisplayItems.length < 7) {
        currentDisplayItems.unshift({ dayLabel: "??", status: "empty" });
    }

    currentDisplayItems.forEach(day => {
        const node = document.createElement('div');
        node.className = "timeline-node";

        const circle = document.createElement('div');
        circle.className = "node-circle";

        if (day.status === "gold") {
            circle.classList.add("status-gold");
            circle.innerText = "👑";
        } else if (day.status === "orange") {
            circle.classList.add("status-orange");
            circle.innerText = "✓";
        } else if (day.status === "missed") {
            circle.classList.add("status-missed");
            circle.innerText = "✕";
        } else {
            circle.innerText = "•";
        }

        const label = document.createElement('span');
        label.className = "node-label";
        label.innerText = day.dayLabel;

        node.appendChild(circle);
        node.appendChild(label);
        timelineContainer.appendChild(node);
    });

    const currentPet = petStages[petLevel];
    petAvatar.innerText = currentPet.avatar;
    petName.innerText = currentPet.name;
    petStage.innerText = currentPet.stage;

    // --- DRAW ACTIVE QUESTS ---
    dailyQuests.forEach(quest => {
        const playerLi = document.createElement('li');
        const prefix = quest.type === "recurring" ? "🔄" : "⚡";
        playerLi.style.borderLeft = quest.completedToday ? "5px solid #4caf50" : "5px solid #ffd700";

        if (quest.completedToday) {
            playerLi.style.opacity = "0.5";
            playerLi.innerHTML = `
                <span style="text-decoration: line-through;">${prefix} ${quest.text}</span>
                <span class="done-badge">Completed today!</span>
            `;
        } else {
            playerLi.innerHTML = `
                <span>${prefix} ${quest.text}</span>
                <button class="complete-btn">Complete (+${quest.gold}g)</button>
            `;
            playerLi.querySelector('.complete-btn').addEventListener('click', function () {
                totalGold += quest.gold;
                if (quest.type === "onetime") {
                    dailyQuests = dailyQuests.filter(q => q.id !== quest.id);
                } else {
                    quest.completedToday = true;
                }
                saveData();
                updateInterface();
            });
        }
        taskList.appendChild(playerLi);

        const adminLi = document.createElement('li');
        const typeLabel = quest.type === "recurring" ? "Daily" : "One-Time";
        adminLi.innerHTML = `
            <span>[${typeLabel}] ${quest.text} (${quest.gold}g)</span>
            <button class="delete-btn">Delete</button>
        `;
        adminLi.querySelector('.delete-btn').addEventListener('click', function () {
            dailyQuests = dailyQuests.filter(q => q.id !== quest.id);
            saveData();
            updateInterface();
        });
        adminTaskList.appendChild(adminLi);
    });

    // --- DRAW CATEGORIZED REWARD SHOP ---
    shopCategories.forEach(category => {
        const title = document.createElement('div');
        title.className = "shop-section-title";
        title.innerText = category.title;
        shopContainer.appendChild(title);

        const groupUl = document.createElement('ul');

        category.items.forEach(item => {
            const shopLi = document.createElement('li');
            shopLi.style.borderLeft = "5px solid #00bcd4";

            let isActive = false;
            if (item.type === "cursor" && activeCursor === item.value) isActive = true;
            if (item.type === "theme" && activeTheme === item.value) isActive = true;
            if (item.type === "pet" && petLevel === item.levelReq) isActive = true;

            let isUnlocked = unlockedItems.includes(item.id);

            if (isActive) {
                shopLi.style.opacity = "0.6";
                shopLi.innerHTML = `
                    <span>${item.text}</span>
                    <span class="done-badge" style="color: #00bcd4; font-weight:bold;">Equipped</span>
                `;
            } else if (item.type === "pet" && petLevel >= item.levelReq) {
                // Keep the pet cards locked visually on "Evolved"
                shopLi.innerHTML = `
                    <span>${item.text}</span>
                    <span class="done-badge" style="color: #4a90e2; font-weight:bold;">Evolved</span>
                `;
            } else if (isUnlocked) {
                // FIXED: Cursors and Themes now successfully render their active swap buttons
                shopLi.innerHTML = `
                    <span>${item.text}</span>
                    <button class="buy-btn" style="background-color: #4a90e2;">Equip (Free)</button>
                `;
                shopLi.querySelector('.buy-btn').addEventListener('click', function () {
                    if (item.type === "cursor") activeCursor = item.value;
                    if (item.type === "theme") activeTheme = item.value;

                    saveData();
                    applyCosmetics();
                    updateInterface();
                });
            } else {
                shopLi.innerHTML = `
                    <span>${item.text}</span>
                    <button class="buy-btn">Buy (${item.cost}g)</button>
                `;
                shopLi.querySelector('.buy-btn').addEventListener('click', function () {
                    if (totalGold >= item.cost) {
                        totalGold -= item.cost;
                        unlockedItems.push(item.id);

                        if (item.type === "cursor") activeCursor = item.value;
                        if (item.type === "theme") activeTheme = item.value;
                        if (item.type === "pet") petLevel = item.levelReq;

                        saveData();
                        applyCosmetics();
                        updateInterface();
                    } else {
                        alert("Not enough gold on hand!");
                    }
                });
            }
            groupUl.appendChild(shopLi);
        });
        shopContainer.appendChild(groupUl);
    });
}

function applyCosmetics() {
    document.body.className = "";
    if (activeCursor !== "normal") document.body.classList.add(activeCursor);
    if (activeTheme !== "theme-default") document.body.classList.add(activeTheme);
}

function saveData() {
    localStorage.setItem('totalGold', totalGold);
    localStorage.setItem('dailyQuests', JSON.stringify(dailyQuests));
    localStorage.setItem('activeCursor', activeCursor);
    localStorage.setItem('activeTheme', activeTheme);
    localStorage.setItem('petLevel', petLevel);
    localStorage.setItem('unlockedItems', JSON.stringify(unlockedItems));
    localStorage.setItem('normalStreak', normalStreak);
    localStorage.setItem('goldStreak', goldStreak);
    localStorage.setItem('streakHistory', JSON.stringify(streakHistory));
}

function addDailyQuest() {
    const taskText = taskInput.value.trim();
    const goldValue = parseInt(difficultyInput.value);
    const questType = typeInput.value;

    if (taskText === "") return;

    dailyQuests.push({
        id: Date.now(),
        text: taskText,
        gold: goldValue,
        type: questType,
        completedToday: false
    });
    saveData();
    updateInterface();
    taskInput.value = "";
}

addBtn.addEventListener('click', addDailyQuest);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addDailyQuest(); });

resetGoldBtn.addEventListener('click', () => {
    if (confirm("Reset everything? This clears your Gold, Streaks, Custom Cosmetics, and patches all locks back up.")) {
        totalGold = 0;
        petLevel = 1;
        normalStreak = 0;
        goldStreak = 0;
        activeCursor = "normal";
        activeTheme = "theme-default";
        unlockedItems = ["c3", "t3"];
        lastOpenDate = new Date().toDateString();
        initializeBlankHistory();

        saveData();
        applyCosmetics();
        updateInterface();
    }
});

updateInterface();