function download(url, filename)
{
     return new Promise((resolve, reject) =>
    {
         GM_download(
             {
                 name: filename,
                 url: url,
                 onload: resolve,
                 onerror: reject,
                 ontimeout: reject
             });
    });
}

function watchForChange(root, obsArguments, onChange)
{
    const rootObserver = new MutationObserver(function (mutations)
    {
        rootObserver?.disconnect();
        mutations.forEach((mutation) => onChange(root, mutation));
        rootObserver?.observe(root, obsArguments);
    });
    rootObserver.observe(root, obsArguments);
    return rootObserver;
}

function watchForChangeFull(root, obsArguments, onChange)
{
    const rootObserver = new MutationObserver(function (mutations)
    {
        rootObserver.disconnect();
        onChange(root, mutations);
        rootObserver.observe(root, obsArguments);
    });
    rootObserver.observe(root, obsArguments);
    return rootObserver;
}

async function watchForAddedNodes(root, stopAfterFirstMutation, obsArguments, executeAfter)
{
    const rootObserver = new MutationObserver(
        function (mutations)
        {
            rootObserver.disconnect();
            //  LogMessage("timeline mutated");
            mutations.forEach(function (mutation)
            {
                if (mutation.addedNodes == null || mutation.addedNodes.length == 0) { return; }
                executeAfter(mutation.addedNodes);
            });
            if (!stopAfterFirstMutation) { rootObserver.observe(root, obsArguments); }
        });

    rootObserver.observe(root, obsArguments);
}

function findElem(rootElem, query, observer, resolve)
{
    const elem = rootElem.querySelector(query);
    if (elem != null && elem != undefined)
    {
        observer?.disconnect();
        resolve(elem);
    }
    return elem;
}

async function awaitElem(root, query, obsArguments)
{
    return new Promise((resolve, reject) =>
    {
        if (findElem(root, query, null, resolve)) { return; }
        const rootObserver = new MutationObserver((mutes, obs) => {
            findElem(root, query, obs, resolve);
        });
        rootObserver.observe(root, obsArguments);
    });
}

function doOnAttributeChange(elem, onChange, repeatOnce = false)
{
    let rootObserver = new MutationObserver((mutes, obvs) => async function()
    {
        obvs.disconnect();
        await onChange(elem);
        if (repeatOnce == true) { return; }
        obvs.observe(elem, { childList: false, subtree: false, attributes: true })
    });
    rootObserver.observe(elem, { childList: false, subtree: false, attributes: true });
}

function addHasAttribute(elem, attr)
{
    if (elem.hasAttribute(attr)) { return true; }
    elem.setAttribute(attr, "");
    return false;
}

function getCookie(name)
{
    let match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) { return match[2].toString(); }
    return null;
}

async function getUserPref(key, defaultVal)
{
    if (isGM) { return await GM.getValue(key, defaultVal); }
    return await GM_getValue(key, defaultVal);
}
async function setUserPref(key, value)
{
    if (isGM) { return await GM.setValue(key, value); }
    return await GM_setValue(key, value);
}

function addGlobalStyle(css, id)
{
    if(id && document.querySelector('#' + id)) { return; }
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    style = document.createElement('style');
    style.type = 'text/css';
    if(id) { style.id = id; }
    if (style.styleSheet) {
        style.styleSheet.cssText = css;
    } else
    {
        style.appendChild(document.createTextNode(css));
    }
    head.appendChild(style);
    return style;
}

function removeGlobalStyle(id)
{
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { return; }
    /*
    if(styleElem == null){ return; }
    let head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) { console.warn("Couldn't find HEAD element, style not removed, and likely doesn't exist anyways."); return; }
    head.removeChild(styleElem);*/
    let styleElem = document.querySelector('#' + id);
    if(styleElem)
    {
        head.removeChild(styleElem);
    }
}
