function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
        'info': 'color: white;',
        'success': 'color: green; font-weight: bold;',
        'warning': 'color: orange;',
        'error': 'color: red; font-weight: bold;'
    };
    console.log(`%c[${timestamp}] ${message}`, colors[type] || 'color: black;');

    const logContainers = document.querySelectorAll('.console');
    logContainers.forEach(consoleEl => {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = `[${timestamp}] ${message}`;
        consoleEl.appendChild(line);
        consoleEl.scrollTop = consoleEl.scrollHeight;
        setTimeout(() => line.classList.add('visible'), 50);
    });
}

function showNotification(innerHTML) {
    const existing = document.getElementById('notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = 'notification';
    notification.innerHTML = innerHTML;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.add('hide');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

class ScriptLoader {
    constructor(consoleElement) {
        this.consoleElement = consoleElement;
        this.scripts = [
            'https://cdn.jsdelivr.net/npm/typed.js@2.0.11',
            'https://challenges.cloudflare.com/turnstile/v0/api.js',
            'https://lbr.noskid.today/nskd-lbr.min.js',
            'assets/js/achievements.js',
            'assets/js/achievements.utils.js',
            'assets/js/again.js',
            'assets/js/awesome.js',
            'assets/js/badapl.js',
            'assets/js/boom.js',
            'assets/js/browser.js',
            'assets/js/certif.js',
            'assets/js/check.js',
            'assets/js/comments.js',
            'assets/js/console.js',
            'assets/js/cookies.js',
            'assets/js/cool.js',
            'assets/js/cursor.js',
            'assets/js/cw.js',
            'assets/js/cw.utils.js',
            'assets/js/downfall.js',
            'assets/js/exploit.js',
            'assets/js/gary.js',
            'assets/js/konata.js',
            'assets/js/localinfo.js',
            'assets/js/night.js',
            'assets/js/noskid.js',
            'assets/js/pong.js',
            'assets/js/rick.js',
            'assets/js/rq.js',
            'assets/js/sstv.js',
            'assets/js/terminal.js',
            'assets/js/track.js',
            'assets/js/update.js',
            'assets/js/url.js',
            'assets/js/warning.js',
            'assets/js/websocket.js',
            'assets/js/zkeys.js',
        ];
        this.loadedCount = 0;
        this.startTime = null;

        this.pendingHashFunction = null;
        this.checkHashFunction();
    }

    checkHashFunction() {
        const hash = window.location.hash;

        if (hash && hash.length > 1) {
            const functionName = hash.substring(1);
            log(`Func found in url: ${functionName}`, 'info');

            this.pendingHashFunction = functionName;
        }
    }

    executeHashFunction() {
        if (!this.pendingHashFunction) return;

        const functionName = this.pendingHashFunction;

        try {
            const event = {
                preventDefault: function () {
                    this.defaultPrevented = true;
                },
                defaultPrevented: false,
                type: 'hashFunction',
                target: document
            };

            let functionToCall;

            if (typeof window[functionName] === 'function') {
                functionToCall = window[functionName];
            }
            // its dangerous, but who cares
            else {
                try {
                    functionToCall = eval(functionName);
                } catch (evalError) {
                    log(`Cannot find: ${functionName}`, 'error');
                    return;
                }
            }

            if (typeof functionToCall === 'function') {
                functionToCall(event);
            } else {
                log(`${functionName} is not a function`, 'error');
            }

            addAchievement('URL Hacker');
        } catch (error) {
            log(`Error while running ${functionName}: ${error.message}`, 'error');
            console.error(error);
        }
    }

    async getFileComment(src) {
        if (src.startsWith('http') && !src.includes(window.location.hostname)) {
            return null;
        }

        try {
            const response = await fetch(src);
            if (!response.ok) return null;

            const content = await response.text();
            const lines = content.split('\n');
            const firstLine = lines[0].trim();

            if (firstLine.startsWith('//')) {
                const comment = firstLine.substring(2).trim();
                return comment;
            }

            return null;
        } catch (error) {
            return null;
        }
    }

    getFileName(src) {
        return src.split('/').pop().replace('.js', '');
    }

    async loadScript(src) {
        return new Promise(async (resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                const fileName = this.getFileName(src);
                log(`Already loaded: ${fileName}`, 'warning');
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;

            const startTime = performance.now();

            script.onload = async () => {
                const endTime = performance.now();
                const loadTime = (endTime - startTime).toFixed(2);
                this.loadedCount++;

                const comment = await this.getFileComment(src);
                const fileName = this.getFileName(src);

                let displayMessage;
                if (comment) {
                    displayMessage = `Loaded: ${comment} in ${loadTime}ms`;
                } else {
                    displayMessage = `Loaded: ${fileName} in ${loadTime}ms`;
                }

                log(displayMessage, 'success');
                resolve(script);
            };

            script.onerror = () => {
                const fileName = this.getFileName(src);
                reject(new Error(`Script load error: ${fileName}`));
            };

            document.body.appendChild(script);
        });
    }

    async loadAll() {
        this.startTime = performance.now();
        log('Starting loading resources...');

        for (const src of this.scripts) {
            try {
                await this.loadScript(src);
            } catch (error) {
                log(`Error loading ${src}`, 'error');
                console.error(error);
            }
        }

        const endTime = performance.now();
        const totalLoadTime = (endTime - this.startTime).toFixed(2);
        log(`All resources loaded successfully in ${totalLoadTime}ms!`, 'success');

        if (this.pendingHashFunction) {
            log(`Executing: ${this.pendingHashFunction}`, 'warning');
            this.executeHashFunction();
        }

        setTimeout(() => {
            const loaderContainer = document.getElementById('loader-container');
            if (loaderContainer) {
                loaderContainer.style.opacity = '0';
                setTimeout(() => loaderContainer.style.display = 'none', 500);
            }
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const consoleElement = document.getElementById('console');
    const loader = new ScriptLoader(consoleElement);
    loader.loadAll();

    window.addEventListener('hashchange', () => {
        loader.checkHashFunction();
        if (loader.loadedCount === loader.scripts.length) {
            loader.executeHashFunction();
        }
    });
});
