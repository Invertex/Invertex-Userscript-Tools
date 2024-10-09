
const dlSVG = '<g><path d="M 8 51 C 5 54 5 48 5 42 L 5 -40 C 5 -45 -5 -45 -5 -40 V 42 C -5 48 -5 54 -8 51 L -48 15 C -51 12 -61 17 -56 22 L -12 61 C 0 71 0 71 12 61 L 56 22 C 61 17 52 11 48 15 Z"></path>' +
    '<path d="M 56 -58 C 62 -58 62 -68 56 -68 H -56 C -62 -68 -62 -58 -56 -58 Z"></path></g>';

//Greasemonkey does not have this functionality, so helpful way to check which function to use
const isGM = (typeof GM_addValueChangeListener === 'undefined');

function StringBuilder(value)
{
    this.strings = new Array();
    this.append(value);
}
StringBuilder.prototype.append = function (value)
{
    if (value)
    {
        this.strings.push(value);
    }
}
StringBuilder.prototype.clear = function ()
{
    this.strings.length = 0;
}
StringBuilder.prototype.toString = function ()
{
    return this.strings.join("");
}


function download(url, filename, timeout = -1)
{
     return new Promise((resolve, reject) =>
    {
         const dl = GM_download(
             {
                 name: filename,
                 url: url,
                 onload: resolve,
                 onerror: reject,
                 ontimeout: reject
             });
        if(timeout >= 0)
        {
              window.setTimeout(()=> {
                dl?.abort();
                reject()
            }, timeout);
        }
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

function getCSSRuleContainingStyle(styleName, selectors, styleCnt = 0, matchingValue = "")
{
    let sheets = document.styleSheets;
    for (let i = 0, l = sheets.length; i < l; i++)
    {
        let curSheet = sheets[i];

        if (!curSheet.cssRules) { continue; }

        for (let j = 0, k = curSheet.cssRules.length; j < k; j++)
        {
            let rule = curSheet.cssRules[j];
            if (styleCnt != 0 && styleCnt != rule.style.length) { return null; }
            if (rule.selectorText && rule.style.length > 0 /* && rule.selectorText.split(',').indexOf(selector) !== -1*/ )
            {
                for (let s = 0; s < selectors.length; s++)
                {
                    if (rule.selectorText.includes(selectors[s]) && rule.style[0] == styleName)
                    {
                        if (matchingValue === "" || matchingValue == rule.style[styleName])
                        {
                            return rule;
                        }
                    }
                }
            }
        }
    }
    return null;
}

const dlSVG = '<g><path d="M 8 51 C 5 54 5 48 5 42 L 5 -40 C 5 -45 -5 -45 -5 -40 V 42 C -5 48 -5 54 -8 51 L -48 15 C -51 12 -61 17 -56 22 L -12 61 C 0 71 0 71 12 61 L 56 22 C 61 17 52 11 48 15 Z"></path>' +
    '<path d="M 56 -58 C 62 -58 62 -68 56 -68 H -56 C -62 -68 -62 -58 -56 -58 Z"></path></g>';


function createButton(title, className, innerHtml)
{
  let dlBtn = document.createElement("button");
  dlBtn.className = className;
  dlBtn.innerHTML = innerHtml;
  dlBtn.title = title;
}
               
function createDLButton()
{ 
    addGlobalStyle(`
    .vxDlBtn {
      background-color: transparent;
      border: none;
      margin-right: 6px !important;
      margin-left: 8px !important;
    }
    .vxDlBtn[downloading],.vxDlBtn[disabled] {
      pointer-events: none !important;
    }
    .vxDlBtn[downloading] > .vxDlSVG {
      pointer-events: none !important;
      background-color: rgba(143, 44, 242, 0.5);
      border-radius: 12px;
      animation-iteration-count: infinite;
      animation-duration: 2s;
      animation-name: dl-animation;
    }
    .vxDlBtn[downloading] > .vxDlSVG > path,.vxDlBtn[disabled] > .vxDlSVG > path {
        fill: rgba(255,255,255,0.2);
    }
    .vxDlSVG:hover {
      background-color: rgba(143, 44, 242, 0.5);
      border-radius: 12px;
    }
    .vxDlSVG:hover {
      background-color: rgba(200, 200, 200, 0.25);
      border-radius: 12px;
    }
    .vxDlSVG:focus {
      padding-top: 3px;
      padding-bottom: 3px;
    }
    @keyframes dl-animation
    {
        0%
        {
            background-color: cyan;
        }
        33%
        {
            background-color: magenta;
        }
        66%
        {
            background-color: yellow;
        }
        100%
        {
            background-color: cyan;
        }
    }
    `);
  return createButton("Download", "vxDlBtn", dlSVG);
}
