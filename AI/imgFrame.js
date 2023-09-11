console.log("Img Frame")

let imgUrl;


window.addEventListener("message", ev => {
    if (typeof ev.data !== 'string')
        return;
    if (ev.data !== 'Are we there yet?') 
        return;

    ev.source.postMessage(imgUrl ? ('Img url: ' + imgUrl) : 'Still waiting', '*');
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

    imgUrl = img.src;
    window.parent.postMessage('Img url: ' + imgUrl, '*');
});

// function openImg(src) {
//     const id = randomId(6);
//     const newTab = window.open();
//     newTab?.document.write(`
//         <html>
//             <head><title>${id}</title></head>
//             <body style="margin: 0;">
//                 <a download="${id}.jpg" href="${src}">
//                     <img src="${src}" style="display: block; background: #0e0e0e; width: 100%; height: 100%; object-fit: scale-down;">
//                 </a>
//             </body>
//         </html>
//     `);
//     newTab?.document.close();
    
// }

observer.observe(document.body, { childList: true, subtree: true });
console.log("Img Frame")