// ************************************************************
// 1. SETUP & GLOBAL VARIABLES
// ************************************************************
let progress = 1; 
let score = 0;
const howManyQs = 10; 
const howManyOptions = 4; 
const proxyUrl = 'https://corsproxy.io/?';

const masterArray = [];
const summaryArray = [];
const usedHeadlines = []; // Tracks headlines already shown to the user

const paperData = [
    { name: "The Guardian", url: 'https://www.theguardian.com/uk/rss', exclusions: ["Guardian", "|"], img: "images/guardian.png" },
    { name: "The Basingstoke Gazette", url: 'https://www.basingstokegazette.co.uk/news/rss/news', exclusions: ["Basingstoke", "Gazette", "Hook", "Basing"], img: "images/gazette.jpg" },
    { name: "The New Statesman", url: 'https://www.newstatesman.com/rss', exclusions: ["New Statesman"], img: "images/newstatesman.jpg" },
    { name: "The Sun", url: 'https://www.thesun.co.uk/news/rss', exclusions: ["The Sun", "Sun Online"], img: "images/sun.jpg" },
    { name: "The Telegraph", url: 'https://www.telegraph.co.uk/news/rss.xml', exclusions: ["Telegraph"], img: "images/telegraph.jpg" },
    { name: "New York Times", url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml', exclusions: ["New York Times", "NYT", "New York"], img: "images/nyt.jpg" },
    { name: "The Scotsman", url: 'https://www.scotsman.com/rss', exclusions: ["Scotsman", "Rangers", "Celtic", "Glasgow", "Edinburgh", "Scotland", "Scottish"], img: "images/scotsman.jpg" },
    { name: "The Eastern Daily Press", url: 'https://www.edp24.co.uk/news/rss/', exclusions: ["Eastern Daily Press", "Norfolk", "EDP", "Norwich"], img: "images/edp.jpg" },
    { name: "The Onion", url: 'https://theonion.com/news/rss', exclusions: ["Onion"], img: "images/onion.jpg" },
    { name: "Christian Today", url: 'https://www.christiantoday.com/rss.xml', exclusions: ["Christian Today", "Christian", "God", "church", "archbishop", "bishop", "pope"], img: "images/christiantoday.jpg" },
    { name: "The Standard", url: 'https://www.standard.co.uk/news/rss', exclusions: ["Standard", "Evening Standard"], img: "images/standard.jpg" },
    { name: "Pink News", url: 'https://www.thepinknews.com/news/rss', exclusions: ["PinkNews", "Pink News", "trans", "gay", "lesbian", "pink", "queer", "LGBTQ+"], img: "images/pink.jpg" },
    { name: "The Daily Mail", url: 'https://www.dailymail.co.uk/news/index.rss', exclusions: ["MailOnline", "Daily Mail", "MAIL"], img: "images/mail.png" },
	{ name: "The Poke", url: 'https://www.thepoke.com/rss', exclusions: ["Poke"], img: "images/poke.jpg" },
	{ name: "News Thump", url: 'https://newsthump.com/rss', exclusions: ["Thump"], img: "images/thump.jpg" }
];

// ************************************************************
// 2. LOADING ENGINE (Updated for Image Preloading)
// ************************************************************

async function initGame() {
    const startBtn = document.getElementById("start");
    
    if(startBtn) {
        startBtn.disabled = true;
        // Updated text to reflect both headlines and images are loading
        startBtn.textContent = "Loading Assets..."; 
    }

    paperData.forEach(() => masterArray.push([]));

    // 1. Create promises for Headlines
    const fetchPromises = paperData.map((paper, index) => 
        getHeadLines(paper.name, paper.url, masterArray[index], paper.exclusions)
    );

    // 2. Create promises for Images
    const imagePromises = paperData.map(paper => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = paper.img;
            img.onload = resolve;
            img.onerror = resolve; // Resolve anyway so the game starts even if an image fails
        });
    });

    try {
        // Wait for BOTH headlines and images to finish
        await Promise.all([...fetchPromises, ...imagePromises]);
        
        if(startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = "START QUIZ";
            startBtn.style.backgroundColor = "#4CAF50";
            startBtn.style.color = "white";
        }
    } catch (error) {
        document.getElementById("top").innerHTML = "<h3>Error loading feeds.</h3>";
    }
}

// Updated getHeadLines Function
function getHeadLines(name, url, arr, exclusions) {
    return fetch(proxyUrl + url)
        .then(response => response.text())
        .then(str => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(str, "text/xml");
            const items = xmlDoc.querySelectorAll("item");

            items.forEach(item => {
                const titleTemp = item.querySelector("title")?.textContent.trim();
                const link = item.querySelector("link")?.textContent.trim();

                if (titleTemp) {
                    const lowTitle = titleTemp.toLowerCase();
                    
                    // .some() returns true if ANY of the exclusions are found in the title
                    const isExcluded = exclusions.some(ex => 
                        lowTitle.includes(ex.toLowerCase())
                    );

                    if (!isExcluded) {
                        arr.push({ name: name, title: titleTemp, link: link });
                    }
                }
            });
        });
}
//console.log(masterArray);

// ************************************************************
// 3. GAMEPLAY FUNCTIONS
// ************************************************************

function start() {
    if (progress > howManyQs) {
        finish();
        return;
    }

    clear("top");
    clear("buttons");

    document.getElementById("top").insertAdjacentHTML("beforeend", `<h4>Headline ${progress} of ${howManyQs}:</h4>`);

    let optionArray = [];
    let uniqueNumbers = new Set();
    while (uniqueNumbers.size < howManyOptions) {
        let randIndex = Math.floor(Math.random() * paperData.length);
        if (masterArray[randIndex].length > 0) {
            uniqueNumbers.add(randIndex);
        }
    }
    optionArray = Array.from(uniqueNumbers);

    let correctOptionSlot = Math.floor(Math.random() * optionArray.length); 
    let actualPaperIndex = optionArray[correctOptionSlot];
    
    // --- START OF CHANGE ---
    let headlineIndex;
    let correctHeadline;

    // Pick a headline, and if it's already been used, pick another one
    let attempts = 0;
    do {
        headlineIndex = Math.floor(Math.random() * masterArray[actualPaperIndex].length);
        correctHeadline = masterArray[actualPaperIndex][headlineIndex].title;
        attempts++;
    } while (usedHeadlines.includes(correctHeadline) && attempts < 10); 

    // Save this headline so it isn't used again
    usedHeadlines.push(correctHeadline);
    // --- END OF CHANGE ---

    document.getElementById("top").insertAdjacentHTML("beforeend", `<h3 style="color: DarkCyan;"><em>"${correctHeadline}"</em></h3>`);
	
	document.getElementById("choose").insertAdjacentHTML("beforeend", `<h4>Choose one of these papers:</h4>`);

    optionArray.forEach((paperIdx, i) => {
        const btn = document.createElement("button");
        btn.className = "quiz-button"; 
        
        const img = document.createElement("img");
        img.src = paperData[paperIdx].img;
        img.alt = paperData[paperIdx].name;
        img.style.width = "300px"; 
        btn.appendChild(img);
        
        btn.onclick = () => {
            handleResult(i === correctOptionSlot, actualPaperIndex, headlineIndex, paperData[paperIdx].name);
        };
        document.getElementById("buttons").appendChild(btn);
    });    
}

function handleResult(isCorrect, paperIdx, headIdx, userChoice) {
    clear("buttons");
	clear("choose")
    const headlineObj = masterArray[paperIdx][headIdx];
	const paperObj = masterArray[paperIdx][headIdx];

    if (isCorrect) {
        score++;
        document.getElementById("top").insertAdjacentHTML("beforeend", "<h2>CORRECT!! 😀</h2>");
    } else {
        document.getElementById("top").insertAdjacentHTML("beforeend", "<h2>UNLUCKY!! 😢</h2><br>");
		document.getElementById("top").insertAdjacentHTML("beforeend", "<h2>The correct answer was:</h2><br><br>");
		//document.getElementById("top").insertAdjacentHTML("beforeend", headlineObj.name);
		const img = document.createElement("img");
        img.src = paperData[paperIdx].img;
        img.alt = paperData[paperIdx].name;
        img.style.width = "300px"; 
		document.getElementById("buttons").appendChild(img);
		//document.body.appendChild(img);
    }
	

    summaryArray.push({
        head: headlineObj.title,
        link: headlineObj.link,
        newspaper: headlineObj.name,
        userChoice: userChoice, // Storing what the user picked
        result: isCorrect ? "Correct ✅" : "Incorrect ❌"
    });

    progress++;
    setTimeout(start, 2000);
}

function finish() {
    clear("top");
    clear("buttons");
    
    document.getElementById("top").insertAdjacentHTML("beforeend", `<br><h2 style="color: DarkRed;>Final Score: ${score} / ${howManyQs}</h3><hr>`);
	
	// 1. Update Total Count (how many games)
let totGoes = Number(localStorage.getItem('total')) || 0;
totGoes++;
localStorage.setItem('total', totGoes.toString());

// 2. Update Sum of All Scores (casting to Number to avoid "10" + 5 = "105")
let totalScores = Number(localStorage.getItem('sumofscores')) || 0;
totalScores += score;
localStorage.setItem('sumofscores', totalScores.toString());

// 3. Best Score Logic
let bestScore = localStorage.getItem('best');
if (bestScore === null || score > Number(bestScore)) {
    localStorage.setItem('best', score.toString());
    bestScore = score.toString();
}

// 4. Lowest Score Logic
let lowestScore = localStorage.getItem('lowest');
if (lowestScore === null || score < Number(lowestScore)) {
    localStorage.setItem('lowest', score.toString());
    lowestScore = score.toString();
}

// 5. Calculate Average (Dynamic calculation is safer)
let averageScore = (totalScores / totGoes).toFixed(1);
localStorage.setItem('average', averageScore); // Saving it if you need it elsewhere

// 6. Update UI
const topDiv = document.getElementById("top");
topDiv.insertAdjacentHTML("beforeend", `
    <h3>Total quizzes taken by you: ${totGoes}</h3>
    <h3>Your best score: ${bestScore}</h3>
    <h3>Your average score: ${averageScore}</h3>
    <h3>Your lowest score: ${lowestScore}</h3> <hr>
`);
	
    summaryArray.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "summary-item";
        // Updated innerHTML to show "Your choice"
        div.innerHTML = `
            <p><strong>${index + 1}. ${item.result}</strong><br>
            Correct Answer: ${item.newspaper}<br>
			Your Choice: ${item.userChoice}<br>
            <a href="${item.link}" target="_blank"><em>"${item.head}"</em></a></p><hr>
        `;
        document.getElementById("top").appendChild(div);
    });

    const againBtn = document.createElement("button");
    againBtn.textContent = "Another go?";
    againBtn.onclick = () => location.reload();
    document.getElementById("buttons").appendChild(againBtn);
}

function clear(id) {
    const el = document.getElementById(id);
    if(el) el.innerHTML = "";
}

initGame();