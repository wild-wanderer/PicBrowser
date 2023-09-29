
class Main {
    static running = false;
    static hiddenImgs = [];
    static restoredImgs = [];
    static editorActive = true;
    static prevScrollTime = 0;

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
            if (legitAncestor) {
                console.log("Not changing focus, because ancestor is:", legitAncestor);
            }
            else {
                console.log("Changing focus back");
                setTimeout(() => document.querySelector('.editor').focus(), 0);
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
        sendBtn.setAttribute('class', 'btn send');
        sendBtn.setAttribute('src', playSvg);
        sendBtn.addEventListener('click', this.startGenerator);
        topPanel.append(sendBtn);

        let stopSvg = chrome.runtime.getURL('img/stop.svg');
        let stopBtn = document.createElement('img');
        stopBtn.setAttribute('class', 'btn stop');
        stopBtn.setAttribute('src', stopSvg);
        stopBtn.addEventListener('click', this.stopGenerator);
        topPanel.append(stopBtn);

        let minimizeSvg = chrome.runtime.getURL('img/minimize.svg');
        let minimizeBtn = document.createElement('img');
        minimizeBtn.setAttribute('class', 'btn minimize');
        minimizeBtn.setAttribute('src', minimizeSvg);
        minimizeBtn.addEventListener('click', this.minimize);
        topPanel.append(minimizeBtn);

        let icon = document.createElement('div');
        icon.setAttribute('class', 'icon');
        topPanel.append(icon);


        document.body.addEventListener("keydown", ev => {
            switch (ev.key) {
                case "Tab":   
                    console.log("Focusing (perhaps)");
                    setTimeout(() => document.querySelector('.editor').focus(), 0);
                    break;
                    
                default:    
                    return;
            }

            ev.preventDefault();
        });

        document.addEventListener("wheel", this.scroll, { passive: false });


        window.addEventListener("message", ev => {
            if (typeof ev.data !== 'string')
                return;
            if (!ev.data.startsWith('Img url: ')) 
                return;

            this.appendImg(ev.data.substring(9));
        });
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
        let frames = document.querySelectorAll('iframe');
        frames.forEach(frame => {
            frame.contentWindow.postMessage('Stop the loop', '*');
        });
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
        img.classList.add('hidden');
        this.hiddenImgs.push(img);

        let iconType = saved ? 'download' : 'trash';
        let url = chrome.runtime.getURL(`img/${iconType}.svg`);

        let icon = document.querySelector('.icon');
        icon.setAttribute('style', `background: url(${url});`)
        icon.classList.add('activated');
        setTimeout(() => icon.classList.remove('activated'), 100);
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


    /** @param {MouseEvent} event */
    static scroll(event) {
        event.preventDefault();

        if (event.timeStamp - this.prevScrollTime < 10)
            return;
        this.prevScrollTime = event.timeStamp;

        let gallery = document.querySelector('.gallery')
        let images = [...gallery.querySelectorAll('img')];
        let rect = gallery.getBoundingClientRect();
        let center = (rect.top + rect.bottom) / 2;

        if (event['deltaY'] > 0) {
            var selectedImg = images.filter(img => Main.midYPos(img) > center + 20)[0];
        }
        else {
            var selectedImg = images.filter(img => Main.midYPos(img) < center - 20).at(-1);
        }

        if (selectedImg) {
            let y = gallery.scrollTop + Main.midYPos(selectedImg) - center;
            gallery.scroll(0, y);
        }
    };

    /** 
     * Returns Y position of a middle of the element
     * @param {Element} el 
     * */
    static midYPos(el) {
        let rect = el.getBoundingClientRect();
        return (rect.top + rect.bottom) / 2;
    }

}

Main.init();