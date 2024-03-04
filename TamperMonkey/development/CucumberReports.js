// ==UserScript==
// @name         Cucumber pimper
// @namespace    http://tampermonkey.net/
// @version      8.0
// @description  Pimp cucumber reports
// @author       mquiron, mcormier, nguillet, shenault, marobert
// @match        https://jenkins.omnimed.com/*job/*/cucumber-html-reports/*overview-tags.html
// @grant        none
// ==/UserScript==
$(document).ready(function() {
	$("<style type='text/css'> .cukeDos { background-color: blue !important; color: white !important; } </style>").appendTo("head");
	$("<style type='text/css'> .cukeMed { background-color: black !important; color: white !important; } </style>").appendTo("head");
	$("<style type='text/css'> .cukeReq { background-color: red !important; color: white !important; } </style>").appendTo("head");
	$("<style type='text/css'> .cukeMad { background-color: #D8780D !important; color: white !important; } </style>").appendTo("head");
	$("<style type='text/css'> .cukePor { background-color: green !important; color: white !important; } </style>").appendTo("head");
	$("<style type='text/css'> .cukeInt { background-color: darkred !important; color: white !important; } </style>").appendTo("head");
	$("<style type='text/css'> .cukeAll { background-color: grey !important; color: white !important; } </style>").appendTo("head");
});

function colorCucumberTagForQA(tag, qa) {
	if ($('.tagname > a:contains(' + tag + ')').length !== 0) {
		$('.tagname > a:contains(' + tag + ')').removeClass('cukeDos');
		$('.tagname > a:contains(' + tag + ')').removeClass('cukeReq');
		$('.tagname > a:contains(' + tag + ')').removeClass('cukeMed');
		$('.tagname > a:contains(' + tag + ')').removeClass('cukeMad');
		$('.tagname > a:contains(' + tag + ')').removeClass('cukePor');
		$('.tagname > a:contains(' + tag + ')').removeClass('cukeInt');
		$('.tagname > a:contains(' + tag + ')').addClass('cuke' + qa);
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

	//Équipe Requetes et resultats
	qa = 'Req';
	colorCucumberTagForQA('Requete', qa);
	colorCucumberTagForQA('@DossierResultat', qa);
	colorCucumberTagForQA('@DossierActionLogResultat', qa);
	colorCucumberTagForQA('RevisionResultat', qa);
	colorCucumberTagForQA('CourrielResultat', qa);

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

        //Équipe portail patient
	qa = 'Por';
	colorCucumberTagForQA('AdministrationDemande', qa);
	colorCucumberTagForQA('Portail', qa);
	colorCucumberTagForQA('PwaElna', qa);
	colorCucumberTagForQA('@Aide', qa);
	colorCucumberTagForQA('Tache', qa);
	colorCucumberTagForQA('@Nouvelle', qa);
	colorCucumberTagForQA('@MenuOmnimed', qa);

	//Équipe Médication
	qa = 'Med';
	colorCucumberTagForQA('acturation', qa);
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
	colorCucumberTagForQA('CentreTransmission', qa);
	colorCucumberTagForQA('TransmissionDashboard', qa);
	colorCucumberTagForQA('@Profil', qa);
	colorCucumberTagForQA('@UProfil', qa);
	colorCucumberTagForQA('@IProfil', qa);
	colorCucumberTagForQA('Contact', qa);

	//Équipe Intégration
	qa = 'Int';
	//----SessionOnimed----
	colorCucumberTagForQA('@Authentification', qa);
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
}

colorCucumberTags();
