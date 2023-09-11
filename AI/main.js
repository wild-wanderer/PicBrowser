
class Main {
    static running = false;
    static hiddenImgs = [];
    static restoredImgs = [];
    static editorActive = true;

    static init() {
        if (!location.hostname.endsWith('.perchance.org'))
            return;

        let topPanel = document.createElement('div');
        topPanel.setAttribute('class', 'top-panel');
        document.body.append(topPanel);
        topPanel.addEventListener('focusout', ev => {
            console.log('Focus shift', ev.target, ev.relatedTarget);
            
            let focusedEl = ev.relatedTarget;
            let legitAncestor = focusedEl?.closest('.top-panel, #output-container');
            if (!legitAncestor) {
                ev.target.focus();
            }
        });

        let gallery = document.createElement('div');
        gallery.setAttribute('class', 'gallery');
        gallery.setAttribute('tabindex', 0);
        topPanel.append(gallery);

        let editorWrapper = document.createElement('div');
        editorWrapper.setAttribute('class', 'editor-wrapper');
        topPanel.append(editorWrapper);

        let editor = document.createElement('textarea');
        editor.setAttribute('class', 'editor');
        editor.addEventListener('input', () => this.resizeEditor(editor));
        editor.addEventListener('keypress', ev => {
            if (ev.key != "Enter") 
                return;
            this.startGenerator();
            ev.preventDefault();
        });
        editor.value = localStorage.getItem('query') ?? '{ old, mature, adult } white European girl';
        editorWrapper.append(editor);
        this.resizeEditor(editor);

        document.addEventListener('keydown', this.onKeyDown);


        let playSvg = chrome.runtime.getURL('img/play.svg');
        let sendBtn = document.createElement('img');
        sendBtn.setAttribute('class', 'send');
        sendBtn.setAttribute('src', playSvg);
        sendBtn.addEventListener('click', this.startGenerator);
        topPanel.append(sendBtn);

        let stopSvg = chrome.runtime.getURL('img/stop.svg');
        let stopBtn = document.createElement('img');
        stopBtn.setAttribute('class', 'stop');
        stopBtn.setAttribute('src', stopSvg);
        stopBtn.addEventListener('click', this.stopGenerator);
        topPanel.append(stopBtn);

        let minimizeSvg = chrome.runtime.getURL('img/minimize.svg');
        let minimizeBtn = document.createElement('img');
        minimizeBtn.setAttribute('class', 'minimize');
        minimizeBtn.setAttribute('src', minimizeSvg);
        minimizeBtn.addEventListener('click', this.minimize);
        topPanel.append(minimizeBtn);



        window.addEventListener("message", ev => {
            if (typeof ev.data !== 'string')
                return;
            if (!ev.data.startsWith('Img url: ')) 
                return;

            this.appendImg(ev.data.substring(9));

            let frames = [...document.querySelectorAll('iframe:not([finished])')];
            let sender = frames.find(frame => frame.contentWindow === ev.source);
            sender?.setAttribute('finished', true);
                
            this.refreshIfFinished();
        });

        setInterval(this.askAround, 3000);
    }


    static askAround() {
        Main.refreshIfFinished();
        let frames = document.querySelectorAll('iframe:not([finished])');
        frames.forEach(frame => {
            frame.contentWindow.postMessage('Are we there yet?', '*');
        });
    }


    static refreshIfFinished() {
        if (!Main.running)
            return;

        let frames = document.querySelectorAll('iframe:not([finished])');
        if (frames.length) 
            return;

        let anyFrames = document.querySelectorAll('iframe');
        if (anyFrames.length)
            document.querySelector('#generateButtonEl').click();
    }

    static startGenerator() {
        let editor = document.querySelector('.editor');
        let query = Main.convertInput(editor.value);

        let description = document.querySelector('textarea[data-name="description"]')
        description.value = query.positive;
        description.dispatchEvent(new Event('input', { bubbles: true }));

        let antyDesc = document.querySelector('input[data-name="negative"]')
        antyDesc.value = query.negative;
        antyDesc.dispatchEvent(new Event('input', { bubbles: true }));

        let button = document.querySelector('#generateButtonEl');
        setTimeout(() => button.click(), 0);

        Main.running = true;
        document.querySelector('.top-panel').classList.add('running');
    }

    static stopGenerator() {
        Main.running = false;
        document.querySelector('.top-panel').classList.remove('running');
    }

    static minimize() {
        document.querySelector('.top-panel')
            .classList.toggle('minimized');
    }

    static appendImg(src) {
        let gallery = document.querySelector('.gallery');

        let query = this.getCurrentQuery();
        let img = document.createElement('img');
        img.setAttribute('src', src);
        img.setAttribute('title', query)
        img.addEventListener('mouseup', ev => {
            if (ev.button == 1) {
                this.hideImg(img, false);
            }
            else if (ev.button == 0) {
                this.downloadImg(img);
            }
            ev.preventDefault();
        });
        gallery.append(img);
    }

    static hideImg(img, saved) {
        let className = saved ? 'saved' : 'rejected';
        img.classList.add(className);
        setTimeout(() => {
            img.classList.remove(className);
            img.classList.add('hidden');
            this.hiddenImgs.push(img);
        }, 500);
    }

    static onKeyDown(ev) {
        let editorFocused = document.querySelector('.editor') === document.activeElement;
        if (editorFocused)
            return;

        if (!ev.ctrlKey)
            return;

        if (ev.key == 'z') {
            ev.preventDefault();
            let img = Main.hiddenImgs.pop();
            if (!img)
                return;
            img.classList?.remove('hidden');
            Main.restoredImgs.push(img);
        }
        else if (ev.key == 'y') {
            ev.preventDefault();
            let img = Main.restoredImgs.pop();
            if (!img)
                return;
            img.classList?.add('hidden');
            Main.hiddenImgs.push(img);
        }
            
    }

    static downloadImg(img) {
        fetch('http://localhost:3000/upload', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ 
                imageBase64: img.src, 
                comment: img.title 
            }),
        })
        .then((response) => {
            if (response.ok) {
                this.hideImg(img, true);
            } else {
                console.error(error);
                alert('Failed to save the image:', response.status);
            }
        })
        .catch((error) => {
            console.error(error);
            alert('An error occurred');
        });
    }

    static convertInput(inputString) {
        const match = inputString.match(/\{([^}]+)\}/);
        let negative = "";
        let positive = inputString;
        if (match) {
            negative = match[1];
            positive = inputString.replace(match[0], "");
        }
        return { negative, positive };
    }

    static getCurrentQuery() {
        let query = document.querySelector('textarea[data-name="description"]').value;
        let negative = document.querySelector('input[data-name="negative"]').value;
        let artStyle = document.querySelector('select[data-name="artStyle"]').selectedOptions[0].text;

        query = query.trim();
        if (negative?.length)
            query += ` { ${negative.trim()} }`;
        return query + ` [${artStyle}]`;
    }

    static resizeEditor(editor) {
        editor.style.height = '0';
        editor.style.height = editor.scrollHeight + 'px'
        localStorage.setItem('query', editor.value);
    }
}

Main.init();