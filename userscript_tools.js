const argsChildAndSub = { attributes: false, childList: true, subtree: true };
const argsChildOnly = { attributes: false, childList: true, subtree: false };
const argsChildAndAttr = { attributes: true, childList: true, subtree: false };
const argsAll = { attributes: true, childList: true, subtree: true };
const argsAttrOnly = { attributes: true, childList: false, subtree: false };

//Greasemonkey does not have this functionality, so helpful way to check which function to use
const isGM = (typeof GM_addValueChangeListener === 'undefined');

async function sleep(seconds) {
    return new Promise((resolve) =>setTimeout(resolve, seconds * 1000));
}

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

if(typeof GM_download !== 'undefined')
{
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
                    reject(null);
                }, timeout);
            }
        });
    }
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

async function awaitElem(root, query, obsArguments = {childList: true, subtree: true, attributes: false})
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
    if (elem == null || elem.hasAttribute(attr)) { return true; }
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

const dlSVG = `<svg class="vxDlSVG" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="white" d="m 3.9472656,2.0820312 c -0.9135398,0 -0.9135398,1.4375 0,1.4375 H 21 c 0.913541,0 0.913541,-1.4375 0,-1.4375 z m 8.5253904,3.484375 c -0.380641,0 -0.759765,
      0.1798801 -0.759765,0.5390626 V 17.886719 c 0,0.862037 -2.6e-4,1.723988 -0.457032,1.292969 L 5.1660156,14.007812 c -0.4567702,-0.431018 -1.9800328,0.287496 -1.21875,1.00586 l 6.6992184,5.603516 c 1.82708,1.43673 1.827215,1.43673 3.654297,0 L 21,15.013672 c 0.761283,
      -0.718364 -0.609723,-1.580552 -1.21875,-1.00586 l -6.089844,5.171876 c -0.456769,0.431019 -0.457031,-0.430932 -0.457031,-1.292969 V 6.1054688 c 0,-0.3591825 -0.381078,-0.5390626 -0.761719,-0.5390626 z"></path></svg>`;


function createButton(title, className, innerHtml)
{
    let btn = document.createElement("button");
    btn.className = className;
    btn.innerHTML = innerHtml;
    btn.title = title;
    return btn;
}
if(typeof GM_addStyle !== 'undefined')
{
    GM_addStyle(`
    .vxDlBtn {
      background-color: transparent;
      border: none;
      margin-right: 6px !important;
      margin-left: 8px !important;
    }
    .vxDlBtn[disabled] {
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
    }`);
}

function createDLButton()
{
  return createButton("Download", "vxDlBtn", dlSVG);
}
