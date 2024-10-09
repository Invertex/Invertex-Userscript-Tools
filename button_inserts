const dlSVG = '<g><path d="M 8 51 C 5 54 5 48 5 42 L 5 -40 C 5 -45 -5 -45 -5 -40 V 42 C -5 48 -5 54 -8 51 L -48 15 C -51 12 -61 17 -56 22 L -12 61 C 0 71 0 71 12 61 L 56 22 C 61 17 52 11 48 15 Z"></path>' +
    '<path d="M 56 -58 C 62 -58 62 -68 56 -68 H -56 C -62 -68 -62 -58 -56 -58 Z"></path></g>';

addGlobalStyle(`.ng-latest-supporter-wide { display: none; }
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

function createButton(title, className, innerHtml)
{
  let dlBtn = document.createElement("button");
  dlBtn.className = className;
  dlBtn.innerHTML = innerHtml;
  dlBtn.title = title;
}
               
function createDLButton()
{
  return createButton("Download", "vxDlBtn", dlSVG);
}
