// Konata.js | Show a Konata gif with music 

function showKonata() {
    const audio = new Audio('assets/audio/bailando.mp3');
    audio.loop = true;

    const gifContent = `
        <div style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            width: 100%; 
            height: 100%; 
            background: none;
        ">
            <img src="assets/vids/konata.gif" 
                 alt="Bailando" 
                 style="
                     max-width: 100%; 
                     max-height: 100%; 
                     object-fit: contain;
                 " 
                 onload="this.parentNode.parentNode.parentNode.querySelector('audio')?.play()"
                 onerror="this.style.display='none'; this.parentNode.innerHTML += '<div style=color:white;text-align:center>404</div>'"
            />
        </div>
    `;

    const win = ClassicWindow.createWindow({
        title: 'Konata.... hell yeah',
        content: gifContent,
        width: 600,
        height: 450,
        x: Math.round((window.innerWidth - 600) / 2),
        y: Math.round((window.innerHeight - 450) / 2),
        theme: 'dark',
        resizable: true,
        onClose: function () {
            audio.pause();
            audio.currentTime = 0;
            audio.remove();
        }
    });

    startAchievement('Konata Dancer');

    const audioElement = document.createElement('audio');
    audioElement.src = 'assets/audio/bailando.mp3';
    audioElement.loop = true;
    audioElement.style.display = 'none';
    win.appendChild(audioElement);

    let achievementGiven = false;
    let lastTime = 0;

    audioElement.addEventListener('timeupdate', () => {
        // detect loop by watching time jump from near duration to near 0
        if (lastTime > audioElement.duration - 0.5 && audioElement.currentTime < 0.5) {
            if (!achievementGiven) {
                achievementGiven = true;
                addAchievement('Konata Dancer');
            }
        }
        lastTime = audioElement.currentTime;
    });

    setTimeout(() => {
        audioElement.play();
    }, 100);

    return win;
}
