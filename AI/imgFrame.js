console.log("Img Frame")

let loopRunning = true;


window.addEventListener("message", ev => {
    if (typeof ev.data !== 'string')
        return;
    if (ev.data !== 'Stop the loop') 
        return;

    loopRunning = false;
});

let observer = new MutationObserver(mutations => {
    let img = mutations
        .filter(mutation => mutation.type === 'childList')
        .flatMap(mutation => [...mutation.addedNodes])
        .filter(node => node.nodeName === 'IMG')[0];

    if (!img)
        return;
    if (!img.src)
        alert("Img haven't got src");

    window.parent.postMessage('Img url: ' + img.src, '*');

    setTimeout(() => {
        if (loopRunning) {
            document.querySelector('#reloadButtonEl').click();
        }
    }, 1000);
});

observer.observe(document.body, { childList: true, subtree: true });
console.log("Img Frame")