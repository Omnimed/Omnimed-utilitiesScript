// ==UserScript==
// @name         Jenkins Integration Test List Pimper
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Jenkins Integration Test List Pimper
// @author       mcormier
// @match        https://jenkins.omnimed.com/*/job/*/*/
// @grant        none
// ==/UserScript==
function openAllFailedTest() {
    if (document.getElementById('showLink') != null){
    document.getElementById('showLink').click();
    }
}

function getElementByXpath(path) {
          return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function parseAndCleanList(tableId){
    var listTag = [];
    var list = getElementByXpath("/html/body[@id='jenkins']/div[@id='page-body']/div[@id='main-panel']/table['failedtestresult']/tbody")
    var nbCuke = 0
    var nbTestIntegration = 0
    try {
        for (var i = 0; i < list.children.length; i++) {
        var currentChildNode = list.childNodes[i]
        var currentChildNodeText = currentChildNode.textContent
        if(currentChildNodeText.includes("test-e2e")) {
            listTag[nbCuke] = getTagOfCuke(currentChildNode);
            deleteCukeFromList(currentChildNode);
             nbCuke++
        } else{
            buildNewElementList(currentChildNode);
            reduceSizeOfElement(currentChildNode);
            nbTestIntegration++;
               }
        }
        buildNewPage(list,nbCuke,nbTestIntegration,listTag);
    } catch (error) {

    }
}
function getTagOfCuke(element){
    var tag = element.textContent
    tag = tag.replace(element.textContent, element.textContent.match("[^\/]*?---"));
    tag = tag.replace("---","");
    return tag.trim();
    }

function buildNewPage(element,nbCuke,nbIT,tagList){
    var result = tagList.reduce((r,c) => (r[c] = (r[c] || 0) + 1, r), {});
    var tagsArray = [];
    for (var tag in result){
      tagsArray.push(["" +tag + " : " + result[tag]] + "<br />")
    }
    var parent = element.offsetParent
    parent.outerHTML = parent.outerHTML.replace("failedtestresult\"\>", "failedtestresult\"<br /><br /></a><b>" + nbCuke + " cukes en erreur :</b><br /> &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp@" + tagsArray.join('&nbsp &nbsp &nbsp &nbsp &nbsp &nbsp &nbsp@') + "<br /><b>" + nbIT + " tests d'intégrations en erreur :</b> <br />" );
}

function deleteCukeFromList(element) {
     element.innerHTML = "";
}

function buildNewElementList(element) {
    element.innerHTML = element.innerHTML.replace(element.textContent, element.textContent.match("[^\/]*$"));
}

function reduceSizeOfElement(element) {
    element.style.fontSize = "normal";
}

openAllFailedTest();
//depending on the page the list can be on various postions
parseAndCleanList();
