document.addEventListener('DOMContentLoaded', function() {
    const audioPlayer = document.getElementById('audioPlayer');
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusMessage = document.getElementById('statusMessage');
    const vuMeter = document.getElementById('vu-meter');
    const starsContainer = document.getElementById('stars');
    const audioStreamUrl = 'https://cbdj.homelinux.org:8443/cbdj?type=http&nocache=14';
    let isPlaying = false;
    let animationFrame = null;
    const audioSimulation = {
        bands: [
            { min: 0.4, max: 0.9, current: 0.5, target: 0.7, speed: 0.02 },
            { min: 0.3, max: 0.8, current: 0.4, target: 0.6, speed: 0.03 },
            { min: 0.2, max: 0.7, current: 0.3, target: 0.5, speed: 0.04 },
            { min: 0.1, max: 0.6, current: 0.2, target: 0.4, speed: 0.05 }
        ],
        transients: {
            chance: 0.03,
            duration: 3,
            current: 0
        },
        lastTargetUpdate: 0,
        targetUpdateInterval: 100
    };
    const barsCount = 36;
    const bars = [];
    for (let i = 0; i < barsCount; i++) {
        const bar = document.createElement('div');
        bar.className = 'vu-bar';
        bar.style.transform = `translate(-50%, 0) rotate(${i * (360 / barsCount)}deg)`;
        bar.style.transformOrigin = '50% 0%';
        bar.style.opacity = '0.2';
        bar.style.height = '80px';
        vuMeter.appendChild(bar);
        bars.push(bar);
    }
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 4 + 1}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 5}s`;
        starsContainer.appendChild(star);
    }
    function stopAnimation() {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
        bars.forEach(bar => {
            bar.style.height = '80px';
            bar.style.opacity = '0.2';
        });
    }
    function updateAudioSimulation() {
        const now = Date.now();
        if (now - audioSimulation.lastTargetUpdate > audioSimulation.targetUpdateInterval) {
            audioSimulation.bands.forEach(band => {
                band.target = band.min + Math.random() * (band.max - band.min);
                band.speed = 0.01 + Math.random() * 0.04;
            });
            audioSimulation.lastTargetUpdate = now;
        }
        audioSimulation.bands.forEach(band => {
            if (band.current < band.target) {
                band.current = Math.min(band.target, band.current + band.speed);
            } else {
                band.current = Math.max(band.target, band.current - band.speed);
            }
        });
        if (audioSimulation.transients.current > 0) {
            audioSimulation.transients.current--;
        } else if (Math.random() < audioSimulation.transients.chance) {
            audioSimulation.transients.current = audioSimulation.transients.duration;
        }
    }
    function getBandValue(bandIndex) {
        const band = audioSimulation.bands[bandIndex];
        let value = band.current;
        if (audioSimulation.transients.current > 0) {
            const transientFactor = 1 - (bandIndex * 0.2);
            value += (band.max - value) * transientFactor * 0.5;
        }
        return value;
    }
    function animateVUMeter() {
        if (!isPlaying) {
            stopAnimation();
            return;
        }
        updateAudioSimulation();
        for (let i = 0; i < bars.length; i++) {
            let bandIndex;
            const normalizedPosition = i / bars.length;
            if (normalizedPosition < 0.3) {
                bandIndex = 0;
            } else if (normalizedPosition < 0.5) {
                bandIndex = 1;
            } else if (normalizedPosition < 0.7) {
                bandIndex = 2;
            } else {
                bandIndex = 3;
            }
            let value = getBandValue(bandIndex);
            const randomFactor = Math.random() * 0.1 * (1 + bandIndex * 0.5);
            value = Math.min(1, Math.max(0.1, value + (randomness() * randomFactor)));
            const minHeight = 80;
            const maxHeight = 160;
            const height = minHeight + (maxHeight - minHeight) * value;
            bars[i].style.height = `${height}px`;
            bars[i].style.opacity = 0.2 + value * 0.8;
        }
        animationFrame = requestAnimationFrame(animateVUMeter);
    }
    function randomness() {
        return Math.random() * 2 - 1;
    }
    function initAudioPlayer() {
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        audioPlayer.load();
        audioPlayer.src = `${audioStreamUrl}&t=${Date.now()}`;
        audioPlayer.preload = 'auto';
        audioPlayer.onplay = function() {
            isPlaying = true;
            playBtn.innerHTML = '❚❚';
            statusMessage.textContent = 'Reproduciendo...';
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(animateVUMeter);
            }
        };
        audioPlayer.onpause = function() {
            isPlaying = false;
            playBtn.innerHTML = '▶';
            statusMessage.textContent = 'Pausado';
            stopAnimation();
        };
        audioPlayer.onended = function() {
            isPlaying = false;
            playBtn.innerHTML = '▶';
            statusMessage.textContent = 'Finalizado';
            stopAnimation();
        };
        audioPlayer.onerror = function(e) {
            console.error('Audio error:', e);
            statusMessage.textContent = 'Error al reproducir el audio. Intenta de nuevo.';
            isPlaying = false;
            playBtn.innerHTML = '▶';
            stopAnimation();
            tryAlternativeMethod();
        };
    }
    function tryAlternativeMethod() {
        statusMessage.textContent = 'Intentando método alternativo...';
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = audioStreamUrl;
        document.body.appendChild(iframe);
        statusMessage.textContent = 'Reproduciendo (método alternativo)';
        isPlaying = true;
        playBtn.innerHTML = '❚❚';
        if (!animationFrame) {
            animationFrame = requestAnimationFrame(animateVUMeter);
        }
        window.audioIframe = iframe;
    }
    function cleanup() {
        stopAnimation();
        audioPlayer.pause();
        audioPlayer.removeAttribute('src');
        audioPlayer.load();
        if (window.audioIframe) {
            document.body.removeChild(window.audioIframe);
            window.audioIframe = null;
        }
        isPlaying = false;
        playBtn.innerHTML = '▶';
    }
    playBtn.addEventListener('click', function() {
        if (isPlaying) {
            cleanup();
            statusMessage.textContent = 'Pausado';
        } else {
            initAudioPlayer();
            statusMessage.textContent = 'Intentando reproducir...';
            const playPromise = audioPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Error playing audio:', error);
                    statusMessage.textContent = 'Error al reproducir. Intentando método alternativo...';
                    tryAlternativeMethod();
                });
            }
        }
    });
    stopBtn.addEventListener('click', function() {
        cleanup();
        statusMessage.textContent = 'Detenido';
    });
    statusMessage.textContent = 'Haz clic en Play para comenzar la reproducción';
});
