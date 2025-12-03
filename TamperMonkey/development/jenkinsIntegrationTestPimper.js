// ==UserScript==
// @name         Jenkins Integration Test List Pimper
// @namespace    http://tampermonkey.net/
// @version      6.6
// @description  Jenkins Integration Test List Pimper
// @author       mcormier, marobert
// @match        https://jenkins.omnimed.com/*/job/*/*/
// @grant        none
// ==/UserScript==

// color test by team
const jq = jQuery.noConflict();

jq(document).ready(function() {
  const styles = `
    .qaDos { background-color: blue !important; color: white !important; display: inline-block; padding: 2px 4px; }
    .qaMed { background-color: black !important; color: white !important; display: inline-block; padding: 2px 4px; }
    .qaReq { background-color: red !important; color: white !important; display: inline-block; padding: 2px 4px; }
    .qaMad { background-color: #D8780D !important; color: white !important; display: inline-block; padding: 2px 4px; }
    .qaPor { background-color: green !important; color: white !important; display: inline-block; padding: 2px 4px; }
    .qaInt { background-color: darkred !important; color: white !important; display: inline-block; padding: 2px 4px; }
    .qaAll { background-color: grey !important; color: white !important; display: inline-block; padding: 2px 4px; }
  `;

  jq('<style type="text/css"></style>').text(styles).appendTo('head');
});

// Remove cukes from failed test
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
        if(currentChildNodeText.includes("@")) {
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


//*[@id="failedtestresult"]/tbody/tr[1]/td[1]/a[3]/text()

function colorTestTagForQA(tag, qa) {
    const tagLower = tag.toLowerCase();
    const links = [...document.querySelectorAll('#failedtestresult a')].filter(a => a.getAttribute('href')?.toLowerCase().includes(tagLower));
    if (links.length > 0) {
        links.forEach(link => {
            link.parentElement.querySelector('a').classList.remove('qaDos', 'qaReq', 'qaMed', 'qaMad', 'qaPor', 'qaInt');
            link.parentElement.querySelector('a').classList.add('qa' + qa);
        });
    } else {
        console.warn('Test tag "' + tag + '" does not exist in any link');
    }
}


function colorTestTags() {
	var qa = '';
	//Équipe Requetes et resultats
	//Cette condition doit être considérée au début car certains tests ont du texte comme badRequest dans le nom et ne sont pas tagués à la bonne équipe
	qa = 'Req';
	colorTestTagForQA('request', qa);

	//Équipe Dossier
	qa = 'Dos';
	colorTestTagForQA('antecedent', qa);
	colorTestTagForQA('clinical.access', qa);
	colorTestTagForQA('form', qa);
	colorTestTagForQA('clinicalnote', qa);
	colorTestTagForQA('diseasefollowup', qa);
	colorTestTagForQA('immunization', qa);
	colorTestTagForQA('social', qa);
	colorTestTagForQA('allergy', qa);
	colorTestTagForQA('consultation', qa);
	colorTestTagForQA('notification', qa);
	colorTestTagForQA('vitalsign', qa);
	colorTestTagForQA('vitalsign', qa);
	colorTestTagForQA('userworkload', qa);
	colorTestTagForQA('report.clinical', qa);
	colorTestTagForQA('clinicalnoteactionlog', qa);

	//Équipe Médico admin
	qa = 'Mad';
	colorTestTagForQA('calendar', qa);
	colorTestTagForQA('patient', qa);
	colorTestTagForQA('patientdocumentgroup', qa);
	colorTestTagForQA('relationship', qa);
	colorTestTagForQA('activity', qa);
	colorTestTagForQA('availability', qa);
	colorTestTagForQA('event', qa);
	colorTestTagForQA('institutionpatienttag', qa);
	colorTestTagForQA('mergepatientrequest', qa);
	colorTestTagForQA('patientadministrativerecord', qa);
	colorTestTagForQA('patientcontactinformation', qa);
	colorTestTagForQA('provisionalpatient', qa);
	colorTestTagForQA('timeslotwindow', qa);
	colorTestTagForQA('waitingroom', qa);

	 //Équipe Requetes et resultats
	qa = 'Req';
	colorTestTagForQA('safir', qa);
    colorTestTagForQA('result', qa);
    colorTestTagForQA('adt', qa);
    colorTestTagForQA('document', qa);
    colorTestTagForQA('ramq', qa);
    colorTestTagForQA('order', qa);
    colorTestTagForQA('file', qa);
    colorTestTagForQA('route', qa);
    colorTestTagForQA('labo', qa);
    colorTestTagForQA('push', qa);


    //Équipe portail patient
	qa = 'Por';
	colorTestTagForQA('task', qa);
	colorTestTagForQA('institutioncontact', qa);
    colorTestTagForQA('crm', qa);
    colorTestTagForQA('portal', qa);
	colorTestTagForQA('keycloak', qa);

	//Équipe Médication
	qa = 'Med';
	colorTestTagForQA('bff.dsq', qa);
	colorTestTagForQA('communication', qa);
	colorTestTagForQA('dictionary', qa);
	colorTestTagForQA('customization', qa);
	colorTestTagForQA('medication', qa);
	colorTestTagForQA('prescription', qa);

    //Équipe facturation
    qa = 'Med';
	colorTestTagForQA('privatebilling', qa);


	//Équipe Intégration
	qa = 'Int';
	//----SessionOnimed----
	colorTestTagForQA('Authorization', qa);
    colorTestTagForQA('accesslayer', qa);
    colorTestTagForQA('broker', qa);
    colorTestTagForQA('healthcareworker', qa);
    colorTestTagForQA('identity', qa);
    colorTestTagForQA('accessinstitution', qa);
    colorTestTagForQA('foreign', qa);
    colorTestTagForQA('institution', qa);
    colorTestTagForQA('webapp', qa);
    colorTestTagForQA('patient.search', qa);

	//Équipe Dossier
    //Cette condition doit être considérée à la fin sinon le tag patient l'emporte
	qa = 'Dos';
    colorTestTagForQA('patientform', qa);
	
	//All
	qa = 'All'

}

openAllFailedTest();
parseAndCleanList();
colorTestTags();
