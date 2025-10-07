// ==UserScript==
// @name         Cucumber pimper
// @namespace    http://tampermonkey.net/
// @version      8.6
// @description  Pimp cucumber reports
// @author       mquiron, mcormier, nguillet, shenault, marobert, msamson
// @match        https://jenkins.omnimed.com/*job/*/cucumber-html-reports/*overview-tags.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=jenkins.io
// @updateURL    https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/CucumberReports.js
// @downloadURL  https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/refs/heads/master/TamperMonkey/development/CucumberReports.js
// @grant        none
// ==/UserScript==
/* eslint-env jquery */

$(document).ready(function() {
    $(`<style type='text/css'>
.tagname > a[class^="cuke"] { color: white !important; font-weight: bold; text-shadow: 0px 1px 2px rgba(0, 0, 0, 0.3); line-height: 1.5;}
.tagname:has(.cukeDos) { background-color: #0000FFAA !important; } /* blue */
.tagname:has(.cukeMed) { background-color: #000000AA !important; } /* black */
.tagname:has(.cukeReq) { background-color: #FF0000AA !important; } /* red */
.tagname:has(.cukeMad) { background-color: #D8780DAA !important; } /* orange */
.tagname:has(.cukePor) { background-color: #008000AA !important; } /* green */
.tagname:has(.cukeInt) { background-color: #8B0000AA !important; } /* darkred */
.tagname:has(.cukeAll) { background-color: #808080AA !important; } /* grey */
 </style>`).appendTo("head");
});

function colorCucumberTagForQA(tag, qa) {
    var tagged = '.tagname > a:contains(' + tag + ')';
	if ($(tagged).length !== 0) {
		$(tagged).removeClass('cukeDos cukeReq cukeMed cukeMad cukePor cukeInt');
		$(tagged).addClass('cuke' + qa);
	} else {
		console.warn('Cucumber tag ' + tag + ' does not exists');
	}
}

function colorCucumberTags() {
	var qa = '';

	//Équipe Dossier
	qa = 'Dos';
	//----global---- //doit etre avant tous les tags specifiques des autres QA
	colorCucumberTagForQA('Dossier', qa);
	colorCucumberTagForQA('ActionLog', qa);
	//----global---- //
	colorCucumberTagForQA('AdministrationGabarit', qa);
	colorCucumberTagForQA('Antecedent', qa);
	colorCucumberTagForQA('AviseurHpn', qa);
	colorCucumberTagForQA('Cnesst', qa);
	colorCucumberTagForQA('Contexte', qa);
	colorCucumberTagForQA('MaladieChronique', qa);
	colorCucumberTagForQA('Note', qa);
	colorCucumberTagForQA('@Notification', qa);
	colorCucumberTagForQA('OCAngular', qa);
	colorCucumberTagForQA('Probleme', qa);
	colorCucumberTagForQA('Dictionnaire', qa);
	colorCucumberTagForQA('Programme', qa);
	colorCucumberTagForQA('Conclusion', qa);
	colorCucumberTagForQA('Sms', qa);
	//----Securite----
	colorCucumberTagForQA('@Droit', qa);
	colorCucumberTagForQA('Consentement', qa);
	colorCucumberTagForQA('Mandat', qa);
	//----Securite----
	colorCucumberTagForQA('Vitaux', qa);

	//Équipe Médico admin
	qa = 'Mad';
	colorCucumberTagForQA('AdministrationActivite', qa);
	colorCucumberTagForQA('AdministrationStatut', qa);
	colorCucumberTagForQA('AdministrationVisio', qa);
	colorCucumberTagForQA('@CentreAdmin', qa);
	colorCucumberTagForQA('@UCommunicationPatient', qa);
	colorCucumberTagForQA('RendezVous', qa);
	colorCucumberTagForQA('SalleAttente', qa);
	colorCucumberTagForQA('Omnidesk', qa);

	 //Équipe Requetes et resultats
	qa = 'Req';
	colorCucumberTagForQA('Requete', qa);
	colorCucumberTagForQA('Ramq', qa);
	colorCucumberTagForQA('DocumentStockageExterne', qa);
	colorCucumberTagForQA('@DossierResultat', qa);
	colorCucumberTagForQA('@DossierActionLogResultat', qa);
	colorCucumberTagForQA('@FiltrePatient', qa);
	colorCucumberTagForQA('RevisionResultat', qa);
	colorCucumberTagForQA('CourrielResultat', qa);

    //Équipe portail patient
	qa = 'Por';
	colorCucumberTagForQA('AdministrationDemande', qa);
	colorCucumberTagForQA('Portail', qa);
	colorCucumberTagForQA('PwaElna', qa);
	colorCucumberTagForQA('@Aide', qa);
	colorCucumberTagForQA('Tache', qa);
	colorCucumberTagForQA('@Nouvelle', qa);
	colorCucumberTagForQA('@Authentification', qa);

	//Équipe Médication
	qa = 'Med';
	colorCucumberTagForQA('acturation', qa);
	colorCucumberTagForQA('Cercle', qa);
	colorCucumberTagForQA('Contact', qa);
	colorCucumberTagForQA('@DossierAllergie', qa);
	colorCucumberTagForQA('@DossierActionLogAllergie', qa);
	colorCucumberTagForQA('@DossierActionLogImmunisation', qa);
	colorCucumberTagForQA('@DossierImmunisation', qa);
	colorCucumberTagForQA('@Immunisation', qa);
	colorCucumberTagForQA('@DsqSqim', qa);
	colorCucumberTagForQA('@DsqAcces', qa);
	colorCucumberTagForQA('@DsqSqii', qa);
	colorCucumberTagForQA('@DsqSqil', qa);
	colorCucumberTagForQA('Fax', qa);
	colorCucumberTagForQA('Medication', qa);
	colorCucumberTagForQA('PrescribeIt', qa);
	colorCucumberTagForQA('CentreCommunication', qa);
	colorCucumberTagForQA('CentreTransmission', qa);
	colorCucumberTagForQA('TransmissionDashboard', qa);
	colorCucumberTagForQA('@Profil', qa);
	colorCucumberTagForQA('@UProfil', qa);
	colorCucumberTagForQA('@IProfil', qa);

	//Équipe Intégration
	qa = 'Int';
	//----SessionOnimed----
	colorCucumberTagForQA('@ExpirationSession', qa);
	colorCucumberTagForQA('@Compte', qa);
	colorCucumberTagForQA('@RecherchePatient', qa);

	//Équipe Dossier
    //Pour un tag Outil qui est aussi contenu dans CentreAdmin, je dois le placer après
    qa = 'Dos';
    colorCucumberTagForQA('Outil', qa);

	//All
	qa = 'All'
	colorCucumberTagForQA('@CreationDonnee', qa);
	colorCucumberTagForQA('Exemple', qa);
	colorCucumberTagForQA('@MenuOmnimed', qa);
}

colorCucumberTags();
