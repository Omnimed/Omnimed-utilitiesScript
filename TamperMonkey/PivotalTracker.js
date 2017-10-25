// ==UserScript==
// @name         Pivotal Tracker Enhanced
// @namespace    https://www.pivotaltracker.com/
// @version      0.38
// @description  Pivotal Tracker enhanced for Omnimed
// @author       Omnimed
// @match        https://www.pivotaltracker.com/*
// @grant        unsafeWindow
// ==/UserScript==

var $ = jQuery;
var analyseTemplate;
var bugTemplate;
var choreTemplate;
var featureTemplate;
var countStory = 0;
var countChore = 0;
var countBug = 0;
var releaseName;
var sumStory = 0;
var sumChore = 0;
var sumBug = 0;
var sumTotal = 0;
var inApiCall = false;

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

$( document ).keypress(function( event ) {
    if ( event.which == 97 ) {
        setTimeout(function() {
            bindNewTextarea();
        }, 100);
    }
});

$( document ).ready(function() {
    $("<style type='text/css'> .devopsIcon:before{ background-image:url(https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/master/TamperMonkey/image/devops.png) !important;} </style>").appendTo("head");
    $("<style type='text/css'> .analyseIcon:before{ background-image:url(https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/master/TamperMonkey/image/analyse.png) !important;} </style>").appendTo("head");
    $("<style type='text/css'> .shadowIcon:before{ background-image:url(https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/master/TamperMonkey/image/shadow.png) !important;} </style>").appendTo("head");
    $("<style type='text/css'> .onAirIcon:before{ background-image:url(https://raw.githubusercontent.com/Omnimed/Omnimed-utilitiesScript/master/TamperMonkey/image/onair.png) !important;} </style>").appendTo("head");
    $("<style type='text/css'> .invalidStory .preview { background-color: #fb9595 !important;} </style>").appendTo("head");
    $("<style type='text/css'> .labelNeed { background-color: red !important; color: white !important; border-radius: 5px ; padding: 0px 5px 0px 5px; margin-right: 2px; } </style>").appendTo("head");
});

function updateIcons() {
    $('.feature').find('.labels.post').find("a:contains('onair')").parent().parent().parent().children('.meta').addClass('onAirIcon');
    $('.feature').find('.labels.post').find("a:contains('devops')").parent().parent().parent().children('.meta').addClass('devopsIcon');
    $('.feature').find('.labels.post').find("a:contains('analyse')").parent().parent().parent().children('.meta').addClass('analyseIcon');
    $('.bug,.chore,.feature').find('.labels.post').find("a:contains('shadow')").parent().parent().parent().children('.meta').addClass('shadowIcon');
}

function updateFlyoverIcons() {
    $('.flyover.visible').find("a:contains('onair')").parent().parent().children('.meta').addClass( "onAirIcon" );
    $('.flyover.visible').find("a:contains('devops')").parent().parent().children('.meta').addClass( "devopsIcon" );
    $('.flyover.visible').find("a:contains('analyse')").parent().parent().children('.meta').addClass( "analyseIcon" );
    $('.flyover.visible').find("a:contains('shadow')").parent().parent().children('.meta').addClass( "shadowIcon" );
}

function validateStories() {
    /* Validate that all stories have a release tag */
    var firstId;
    var secondId;
    var releaseName;
    var response;
    var xhr = new XMLHttpRequest();

    if (!inApiCall) {
        inApiCall = true;
        $.ajax ( {
            type:       'GET',
            url:        'https://www.pivotaltracker.com/services/v5/projects/605365/releases?limit=1&with_state=accepted&offset=-1',
            dataType:   'JSON',
            success:    function (response) {
                firstId = response[0].id;
                $.ajax ( {
                    type:       'GET',
                    url:        'https://www.pivotaltracker.com/services/v5/projects/605365/releases?with_state=planned',
                    dataType:   'JSON',
                    success:    function (response) {
                        for (var i = 0; i < response.length; i++) {
                            secondId = response[i].id;
                            releaseName = response[i].name.substring(0, response[i].name.lastIndexOf(" ")).toLowerCase();
                            $.ajax ( {
                                type:       'GET',
                                url:        'https://www.pivotaltracker.com/services/v5/projects/605365/stories?after_story_id=' + firstId + '&before_story_id=' + secondId + '&limit=10000',
                                dataType:   'JSON',
                                releaseName: releaseName,
                                success:    function (response) {
                                    applyStoriesValidation(response, this.releaseName);
                                }
                            } );
                            firstId = secondId;
                        }
                        $.ajax ( {
                            type:       'GET',
                            url:        'https://www.pivotaltracker.com/services/v5/projects/605365/releases?with_state=unstarted',
                            dataType:   'JSON',
                            success:    function (response) {
                                for (var i = 0; i < response.length; i++) {
                                    secondId = response[i].id;
                                    releaseName = response[i].name.substring(0, response[i].name.lastIndexOf(" ")).toLowerCase();
                                    $.ajax ( {
                                        type:       'GET',
                                        url:        'https://www.pivotaltracker.com/services/v5/projects/605365/stories?after_story_id=' + firstId + '&before_story_id=' + secondId + '&limit=10000',
                                        dataType:   'JSON',
                                        releaseName: releaseName,
                                        success:    function (response) {
                                            applyStoriesValidation(response, this.releaseName);
                                        }
                                    } );
                                    firstId = secondId;
                                }
                            }
                        } );
                    }
                } );
            }
        } );
        inApiCall = false;
    }
}

function highlightLabelsNeedSomething() {
    $( "a.label:contains('needs')" ).addClass('labelNeed');
    $( "a.label:contains('besoin')" ).addClass('labelNeed');
}


$( document ).bind("ajaxSuccess",function(event, xhr, settings) {
    if (xhr.responseJSON && xhr.responseJSON.data && (xhr.responseJSON.data.kind === "layout_scheme" || xhr.responseJSON.data.kind === "command_create_response" || (xhr.responseJSON.data.kind === "message" && xhr.responseJSON.data.text === "Subscribed to push changes")) ) {
        $('body').find("a[title*='Add Story']").unbind("click");
        $('body').find("a[title*='Add Story']").bind("click", function(){
            setTimeout(function() {
                bindNewTextarea();
            }, 100);
        });
        $('body').find("a[class*='button add_story']").unbind("click");
        $('body').find("a[class*='button add_story']").bind("click", function(){
            setTimeout(function() {
                bindNewTextarea();
            }, 100);
        });
        $('.selector').unbind("click");
        $('.selector').bind("click", function(){
            setTimeout(function() {
                update_bug();
                update_chore();
                update_feature();
                update_output();
            }, 100);
        });setTimeout(function() {
            updateFlyoverIcons();
        }, 1100);
        $('.expander.undraggable').unbind("click");
        $('.expander.undraggable').bind("click", function(){
            setTimeout(function() {
                $('.autosaves.collapser').unbind("click");
                $('.autosaves.collapser').bind("click", function(){
                    setTimeout(function() {
                        updateIcons();
                        highlightLabelsNeedSomething();
                        $('.autosaves.collapser').unbind("click");
                    }, 100);
                });
            }, 100);
        });
        $('.bug,.chore,.feature').unbind("mouseenter");
        $('.bug,.chore,.feature').bind("mouseenter", function(){
            setTimeout(function() {
                updateFlyoverIcons();
                setTimeout(function() {
                    updateFlyoverIcons();
                }, 500);
            }, 1100);
        });
        updateIcons();
        validateStories();
        highlightLabelsNeedSomething();
    }
});

function applyTemplate() {
    var storyType = $('.new').find("input[name='story[story_type]']")[0].value;
    setTimeout(function() {
        if (storyType === "feature") {
            if ( $('.new').find("div[class='Label___3rBeC38h Label--epic___2XSEYZ9W']")[0] && $('.new').find("div[class='Label___3rBeC38h Label--epic___2XSEYZ9W']")[0].children[0].outerText === "analyse") {
                $(document.activeElement).val(getAnalyseTemplate()).change();
            } else {
                $(document.activeElement).val(getFeatureTemplate()).change();
            }
        } else if (storyType === "chore") {
            $(document.activeElement).val(getChoreTemplate()).change();
        } else if (storyType === "bug") {
            $(document.activeElement).val(getBugTemplate()).change();
        }
    }, 100);
    $('.new').find("div[class='DescriptionShow___3-QsNMNj tracker_markup']").unbind("click");
    $('.new').find("div[class='edit___2HbkmNDA']").unbind("click");
}

function bindNewTextarea() {
    if ($('.new')) {
        $('.new').find("div[class='DescriptionShow___3-QsNMNj tracker_markup DescriptionShow__placeholder___1NuiicbF']").bind("click", applyTemplate);
    }
}

function getBug() {
    return $('div[data-type="done"],div[data-type="current"],div[data-type="backlog"],div[data-type="icebox"]').find('.bug').children('.preview').children('.selected').parent();
}

function getAnalyseTemplate() {
    if(!analyseTemplate) {
        var response;
        var xhr = new XMLHttpRequest();

        xhr.open("GET", "https://www.pivotaltracker.com/services/v5/projects/605365/epics/3355739", false);
        xhr.send();

        response = JSON.parse(xhr.responseText);

        analyseTemplate = response.description;
    }

    return analyseTemplate;
}

function getFeatureTemplate() {
    if(!featureTemplate) {
        var response;
        var xhr = new XMLHttpRequest();

        xhr.open("GET", "https://www.pivotaltracker.com/services/v5/projects/605365/epics/388831", false);
        xhr.send();

        response = JSON.parse(xhr.responseText);

        featureTemplate = response.description;
    }

    return featureTemplate;
}

function getChoreTemplate() {
    if(!choreTemplate) {
        var response;
        var xhr = new XMLHttpRequest();

        xhr.open("GET", "https://www.pivotaltracker.com/services/v5/projects/605365/epics/388835", false);
        xhr.send();

        response = JSON.parse(xhr.responseText);

        choreTemplate = response.description;
    }

    return choreTemplate;
}

function getBugTemplate() {
    if(!bugTemplate) {
        var response;
        var xhr = new XMLHttpRequest();

        xhr.open("GET", "https://www.pivotaltracker.com/services/v5/projects/605365/epics/388833", false);
        xhr.send();

        response = JSON.parse(xhr.responseText);

        bugTemplate = response.description;
    }

    return bugTemplate;
}

function getChore() {
    return $('div[data-type="done"],div[data-type="current"],div[data-type="backlog"],div[data-type="icebox"]').find('.chore').children('.preview').children('.selected').parent();
}

function getFeature() {
    return $('div[data-type="done"],div[data-type="current"],div[data-type="backlog"],div[data-type="icebox"]').find('.feature').children('.preview').children('.selected').parent();
}

function getInfoFromUrl(url) {
    var re = /[0-9]+/g;
    var id = url.match(re);
    return $('div[data-id="' + id + '"]')[0];
}

function getEpicInfo(epicLabel) {
    var xhr = new XMLHttpRequest();
    var label = epicLabel;
    if (epicLabel.indexOf("ep - ") > -1) {
        label = epicLabel.substring(5);
    }
    xhr.open("GET", "https://www.pivotaltracker.com/services/v5/projects/605365/epics?filter=label%3A%22" + encodeURI(label) + "%22&fields=name%2Cdescription%2Ccompleted_at", false);
    xhr.send();

    var response = JSON.parse(xhr.responseText);
    return response;
}

function applyStoriesValidation(stories,releaseName) {
    /* Validate that all stories have a release tag */
    for (var i = 0; i < stories.length; i++) {
        var hasGoodLabel = false;
        for (var j = 0; j < stories[i].labels.length; j++) {
            if (stories[i].labels[j].name === releaseName) {
                hasGoodLabel = true;
            }
        }
        if (!hasGoodLabel && !$('div[data-id="' + stories[i].id +'"]').hasClass('invalidStory')) {
            $('div[data-id="' + stories[i].id +'"]').addClass('invalidStory');
        }
        if (hasGoodLabel && $('div[data-id="' + stories[i].id +'"]').hasClass('invalidStory')) {
            $('div[data-id="' + stories[i].id +'"]').removeClass('invalidStory');
        }
    }
}

function addReleaseNoteTicketInfo(parameter) {
    var releaseNote = "";
    if (parameter.addLabel) {
        parameter.addLabel = false;
        var episode = getEpicInfo(parameter.episode.toString());
        if (episode.length > 0) {
            releaseNote += "\n### " + episode[0].name;
            if (episode[0].completed_at) {
                releaseNote += " - Complété\n";
            } else {
                releaseNote += "\n";
            }
            if (episode[0].description) {
                releaseNote += episode[0].description + "\n\n";
            }
        } else {
            releaseNote += "\n### " + parameter.episode.toString() + "\n\n";
        }
    }
    releaseNote += " * " + parameter.ticket.name + " [https://www.pivotaltracker.com/story/show/" + parameter.ticket.id + "]\n";
    return releaseNote;
}

function update_bug() {
    sumBug = 0;
    countBug = 0;
    getBug().children('.meta').each(function(){
        if ($(this).text() != "-1") {
            sumBug += parseFloat($(this).text());
        }
        countBug = countBug + 1;
    });
}

function update_chore() {
    sumChore = 0;
    countChore = 0;
    getChore().children('.meta').each(function(){
        if ($(this).text() != "-1") {
            sumChore += parseFloat($(this).text());
        }
        countChore = countChore + 1;
    });
}

function update_feature() {
    sumStory = 0;
    countStory = 0;
    getFeature().children('.meta').each(function(){
        if ($(this).text() != "-1") {
            sumStory += parseFloat($(this).text());
        }
        countStory = countStory + 1;
    });
}
function executeCopy(text){
    var copyDiv = document.createElement('div');
    copyDiv.contentEditable = true;
    document.body.appendChild(copyDiv);
    copyDiv.innerText = text;
    copyDiv.unselectable = "off";
    copyDiv.focus();
    document.execCommand('SelectAll');
    document.execCommand("Copy", false, null);
    document.body.removeChild(copyDiv);
}

function update_output() {
    $('#story_Selected_sum').remove();
    sumTotal = sumBug + sumChore + sumStory;
    $('.selectedStoriesControls__actions').css({"padding-left":"158px"});
    $('.selectedStoriesControls__counterLabel').append("<span id='story_Selected_sum' style='margin-left: 7px;'><span style='font-weight:bold;'>Story :</span> " + sumStory + "/" + countStory + " | <span style='font-weight:bold;'>Chore :</span> " + sumChore + "/" + countChore + " | <span style='font-weight:bold;'>Bug :</span> " + sumBug + "/" + countBug + " | <span style='font-weight:bold;'>Total</span> : " + sumTotal +
                                                       "<div style='position: absolute;left: 46px;background-color: chocolate;width: 531px;height: 20px;padding-top: 2px;'>" +
                                                       "<button class='selectedStoriesControls__button' style='font-weight:bold;' type='button' onClick='$.getReleaseNote()'>Release note</button>" +
                                                       "<button class='selectedStoriesControls__button' style='font-weight:bold;' type='button' onClick='$.getSprintSheet()'>Sprint sheet</button>" +
                                                       "<button class='selectedStoriesControls__button' style='font-weight:bold;' type='button' onClick='$.getPlanningPoker()'>PlanningPoker</button>" +
                                                       "<button class='selectedStoriesControls__button' style='font-weight:bold;' type='button' onClick='$.getDiff()'>Diff</button>" +
                                                       "<button class='selectedStoriesControls__button' style='font-weight:bold;' type='button' onClick='$.getBroadcastNote()'>Broadcast note</button>" +
                                                       "</div>" +
                                                       "</span>");
}

$.getReleaseNote = function() {
    var releaseNote = "Date de déploiement visée : \nVersion de chrome supportée : \n\n";
    var eps = [];
    var produits = [];
    var stories = [];
    getFeature().children('.name').each(function(){
        var story = {name:"", ep:"", prd:"", id:""};
        story.id = $(this).parent().parent().attr("data-id");
        story.prd = $(this).children('.labels').children('a:contains("prd")').first().text();
        story.name = $(this).children('.story_name').text();
        if (story.prd === "") {
            story.prd ="prd - autre";
        } else if (story.prd.indexOf(",") > -1) {
            story.prd = story.prd.substring(0,story.prd.indexOf(","));
        }
        story.prd = capitalizeFirstLetter(story.prd.substring(6));
        story.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (story.ep === "") {
            story.ep ="ep - autre";
        } else if (story.ep.indexOf(",") > -1) {
            story.ep = story.ep.substring(0,story.ep.indexOf(","));
        }
        stories.push(story);
        produits.push(story.prd);
        eps.push(story.ep);
    });
    stories.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    var chores = [];
    getChore().children('.name').each(function(){
        var chore = {name:"", prd:"", id:""};
        chore.id = $(this).parent().parent().attr("data-id");
        chore.name = $(this).children('.story_name').text();
        chore.prd = $(this).children('.labels').children('a:contains("prd")').first().text();
        if (chore.prd === "") {
            chore.prd ="prd - autre";
        } else if (chore.prd.indexOf(",") > -1) {
            chore.prd = chore.prd.substring(0,chore.prd.indexOf(","));
        }
        chore.prd = capitalizeFirstLetter(chore.prd.substring(6));
        chore.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (chore.ep === "") {
            chore.ep ="ep - autre";
        } else if (chore.ep.indexOf(",") > -1) {
            chore.ep = chore.ep.substring(0,chore.ep.indexOf(","));
        }
        chores.push(chore);
        produits.push(chore.prd);
        eps.push(chore.ep);
    });
    chores.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    var bugs = [];
    getBug().children('.name').each(function(){
        var bug = {name:"", id:""};
        bug.id = $(this).parent().parent().attr("data-id");
        bug.name = $(this).children('.story_name').text();
        $(this).children('.labels.pre').children('a:contains("bugprod")').each(function() {
            bugs.push(bug);
        });
    });
    bugs.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    $.each($.unique(produits.sort()), function() {
        releaseNote += "\n## " + this + "\n\n";
        var produit = this;
        $.each($.unique(eps), function() {
            var parameter = {
                addLabel: true,
                episode: this,
                ticket: ''};
            var i = 0;
            for (i = 0; i < stories.length; i++) {
                if (stories[i].prd == produit) {
                    if (stories[i].ep == this) {
                        parameter.ticket = stories[i];
                        releaseNote += addReleaseNoteTicketInfo(parameter);
                    }
                }
            }
            i = 0;
            for (i = 0; i < chores.length; i++) {
                if (chores[i].prd == produit) {
                    if (chores[i].ep == this) {
                        parameter.ticket = chores[i];
                        releaseNote += addReleaseNoteTicketInfo(parameter);
                    }
                }
            }
        });
    });

    releaseNote += "\n## Corrections de bogues\n\n";
    $.each(bugs, function() {
        releaseNote += " * " + this.name + " [https://www.pivotaltracker.com/story/show/" + this.id + "]\n";
    });
    console.clear();
    console.log(releaseNote);
    executeCopy(releaseNote);
};

$.getSprintSheet = function() {
    var sprintSheet = "";
    var eps = [];
    var stories = [];
    getFeature().children('.name').each(function(){
        var story = {name:"", ep:"", id:""};
        story.id = $(this).parent().parent().attr("data-id");
        story.name = $(this).children('.story_name').text();
        story.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (story.ep === "") {
            story.ep ="ep - autre";
        } else if (story.ep.indexOf(",") > -1) {
            story.ep = story.ep.substring(0,story.ep.indexOf(","));
        }
        stories.push(story);
        eps.push(story.ep);
    });
    stories.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    var chores = [];
    getChore().children('.name').each(function(){
        var chore = {name:"", ep:"", id:""};
        chore.id = $(this).parent().parent().attr("data-id");
        chore.name = $(this).children('.story_name').text();
        chore.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (chore.ep === "") {
            chore.ep ="ep - autre";
        } else if (chore.ep.indexOf(",") > -1) {
            chore.ep = chore.ep.substring(0,chore.ep.indexOf(","));
        }
        chores.push(chore);
        eps.push(chore.ep);
    });
    chores.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    var bugs = [];
    getBug().children('.name').each(function(){
        var bug = {name:"", id:""};
        bug.id = $(this).parent().parent().attr("data-id");
        bug.name = $(this).children('.story_name').text();
        bugs.push(bug);
    });

    sprintSheet += "\n== Épisodes:\n\n";
    $.each($.unique(eps.sort()), function() {
        var episode = getEpicInfo(this.toString());
        if (episode.length > 0) {
            sprintSheet += "* " + episode[0].name + "\n";
            if (episode[0].description) {
                sprintSheet += " * " + episode[0].description + "\n";
            }
        } else {
            sprintSheet += "* " + this + "\n";
        }
    });

    sprintSheet += "\n== SPRINT:\n\n";

    sprintSheet += "\n== Corrections de bogues\n\n";
    $.each(bugs, function() {
        sprintSheet += "* " + this.name + " [https://www.pivotaltracker.com/story/show/" + this.id + "]\n";
    });

    sprintSheet += "\n== Objectifs:\n\n";

    $.each($.unique(eps), function() {
        sprintSheet += "\n== " + this + "\n\n";
        var i = 0;
        for (i = 0; i < stories.length; i++) {
            if (stories[i].ep == this) {
                sprintSheet += "* " + stories[i].name + " [https://www.pivotaltracker.com/story/show/" + stories[i].id + "]\n";
            }
        }
        i = 0;
        for (i = 0; i < chores.length; i++) {
            if (chores[i].ep == this) {
                sprintSheet += "* " + chores[i].name + " [https://www.pivotaltracker.com/story/show/" + chores[i].id + "]\n";
            }
        }
    });

    sprintSheet += "\n== Membres de l’équipe:\n\n";

    sprintSheet += "\n== Pour Slack ==\n\n";

    sprintSheet += "\n# Épisodes:\n";
    $.each($.unique(eps.sort()), function() {
        var episode = getEpicInfo(this.toString());
        if (episode.length > 0) {
            sprintSheet += "* " + episode[0].name + "\n";
            if (episode[0].description) {
                sprintSheet += " * " + episode[0].description + "\n";
            }
        } else {
            sprintSheet += "* " + this + "\n";
        }
    });

    sprintSheet += "\n# SPRINT:\n";

    sprintSheet += "\n# Corrections de bogues\n";
    $.each(bugs, function() {
        sprintSheet += "* " + this.name + " [https://www.pivotaltracker.com/story/show/" + this.id + "]\n";
    });

    sprintSheet += "\n# Objectifs:\n";

    $.each($.unique(eps), function() {
        sprintSheet += "\n## " + this + "\n";
        var i = 0;
        for (i = 0; i < stories.length; i++) {
            if (stories[i].ep == this) {
                sprintSheet += "* " + stories[i].name + " [https://www.pivotaltracker.com/story/show/" + stories[i].id + "]\n";
            }
        }
        i = 0;
        for (i = 0; i < chores.length; i++) {
            if (chores[i].ep == this) {
                sprintSheet += "* " + chores[i].name + " [https://www.pivotaltracker.com/story/show/" + chores[i].id + "]\n";
            }
        }
    });

    sprintSheet += "\n# Membres de l’équipe:\n\n";

    console.clear();
    console.log(sprintSheet);
    executeCopy(sprintSheet);
};

$.getPlanningPoker = function() {
    var planningPokerList = "";
    getFeature().children('.name').each(function(){
        var story = {name:"", ep:"", id:""};
        story.id = $(this).parent().parent().attr("data-id");
        story.name = $(this).children('.story_name').text();
        planningPokerList += "<a target='_blank' href='https://www.pivotaltracker.com/story/show/" + story.id + "'>" + story.name + "</a>\n";
    });

    var chores = [];
    getChore().children('.name').each(function(){
        var chore = {name:"", ep:"", id:""};
        chore.id = $(this).parent().parent().attr("data-id");
        chore.name = $(this).children('.story_name').text();
        planningPokerList += "<a target='_blank' href='https://www.pivotaltracker.com/story/show/" + chore.id + "'>" + chore.name + "</a>\n";
    });

    console.clear();
    console.log(planningPokerList);
    executeCopy(planningPokerList);
};

$.getDiff = function() {
    var tickets = prompt("Please enter your last stories and chores from the old sprintPlanning sheet", "");
    var re = /https[^\]]*/g;

    if (tickets != null) {
        var lastUrls = tickets.match(re);var sprintSheet = "";
        var urls = [];
        var diffSheet = "";
        var totalMin = 0;
        var totalPlus = 0;

        var stories = [];
        getFeature().children('.name').each(function(){
            var story = {name:"", id:"", usp:""};
            story.id = "https://www.pivotaltracker.com/story/show/" +$(this).parent().parent().attr("data-id");
            story.name = $(this).children('.story_name').text();
            story.usp = $(this).parent().children('.meta').text();
            stories.push(story);
            urls.push(story.id);
        });

        var chores = [];
        getChore().children('.name').each(function(){
            var chore = {name:"", id:"", usp:""};
            chore.id = "https://www.pivotaltracker.com/story/show/" + $(this).parent().parent().attr("data-id");
            chore.name = $(this).children('.story_name').text();
            chore.usp = $(this).parent().children('.meta').text();
            chores.push(chore);
            urls.push(chore.id);
        });
        diffSheet += "## Scope creep Minus \n";
        $.each(lastUrls, function() {
            var found = false;
            var i = 0;
            for (i = 0; i < urls.length; i++) {
                if (urls[i] === this.toString()) {
                    found = true;
                }
            }
            if (!found) {
                var info = getInfoFromUrl(this.toString());
                totalMin += parseInt($(info).children().children('.meta').text());
                diffSheet += "* [" + $(info).children().children().children('.story_name').text() + "](" + this.toString() + ") - " + $(info).children().children('.meta').text() + "pts\n";
            }
        });
        diffSheet += "\n## Scope creep Plus \n";
        $.each(urls, function() {
            var found = false;
            var i = 0;
            for (i = 0; i < lastUrls.length; i++) {
                if (lastUrls[i] === this.toString()) {
                    found = true;
                }
            }
            if (!found) {
                i = 0;
                for (i = 0; i < stories.length; i++) {
                    if (stories[i].id === this.toString()) {
                        totalPlus += parseInt(stories[i].usp);
                        diffSheet += "* [" + stories[i].name + "](" + stories[i].id + ") - " + stories[i].usp + "pts\n";
                    }
                }
                i = 0;
                for (i = 0; i < chores.length; i++) {
                    if (chores[i].id === this.toString()) {
                        totalPlus += parseInt(chores[i].usp);
                        diffSheet += "* [" + chores[i].name + "](" + chores[i].id + ") - " + chores[i].usp + "pts\n";
                    }
                }
            }
        });


        console.clear();
        var diff = totalPlus - totalMin;
        console.log(diff);

        diffSheet += "\n\n Différence de " + diff + " points de la planification initiale";
        console.log(diffSheet);
        executeCopy(diffSheet);
    }
};

$.getBroadcastNote = function() {
    var broadcastNote = "Date de déploiement visée : \nVersion de chrome supportée : \n\n";
    var broadcasts = [];
    var stories = [];
    var togglz = [];
    var version = [];

    getFeature().children('.name').each(function(){
        var story = {name:"", broadcast:"", ep:"", id:"", version:""};
        story.id = $(this).parent().parent().attr("data-id");
        debugger;
        story.broadcast = capitalizeFirstLetter($(this).children('.labels').children('a:contains("broadcast")').first().text());
        if (story.broadcast.indexOf(",") > -1){
            story.broadcast = story.broadcast.substring(0,story.broadcast.indexOf(","));
        }
        story.name = $(this).children('.story_name').text();
        story.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (story.ep === "") {
            story.ep ="ep - autre";
        } else if (story.ep.indexOf(",") > -1) {
            story.ep = story.ep.substring(0,story.ep.indexOf(","));
        }
        
        story.version = capitalizeFirstLetter($(this).children('.labels').children('a:contains("v -")').first().text());
         if (story.version.indexOf(",") > -1){
            story.version = story.version.substring(0,story.version.indexOf(","));
        }

        stories.push(story);
        
        if (story.broadcast === "") {
            togglz.push(story);
            if (story.version != "") {
                version.push(story.version);
            }
        } else {
            broadcasts.push(story.broadcast);
        }
    });
    stories.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    var chores = [];
    getChore().children('.name').each(function(){
        var chore = {name:"", broadcast:"", ep:"", id:"", version: ""};
        chore.id = $(this).parent().parent().attr("data-id");
        chore.broadcast = capitalizeFirstLetter($(this).children('.labels').children('a:contains("broadcast")').first().text());
        if (chore.broadcast.indexOf(",") > -1){
            chore.broadcast = chore.broadcast.substring(0,chore.broadcast.indexOf(","));
        }
        chore.name = $(this).children('.story_name').text();
        chore.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (chore.ep === "") {
            chore.ep ="ep - autre";
        } else if (chore.ep.indexOf(",") > -1) {
            chore.ep = chore.ep.substring(0,chore.ep.indexOf(","));
        }
        
        chore.version = capitalizeFirstLetter($(this).children('.labels').children('a:contains("v -")').first().text());
         if (chore.version.indexOf(",") > -1){
            chore.version = chore.version.substring(0,chore.version.indexOf(","));
        }
        
        chores.push(chore);
        if (chore.broadcast === "") {
            togglz.push(chore);
            if (chore.version != "") {
                version.push(chore.version);
            }
        } else {
            broadcasts.push(chore.broadcast);
        }
    });
    chores.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    var bugs = [];
    getBug().children('.name').each(function(){
        var bug = {name:"", broadcast:"", ep:"", id:"", version:""};
        bug.id = $(this).parent().parent().attr("data-id");
        bug.broadcast = capitalizeFirstLetter($(this).children('.labels').children('a:contains("broadcast")').first().text());
        if (bug.broadcast.indexOf(",") > -1){
            bug.broadcast = bug.broadcast.substring(0,bug.broadcast.indexOf(","));
        }
        bug.name = $(this).children('.story_name').text();
        bug.ep = $(this).children('.labels').children('a:contains("ep -")').first().text();
        if (bug.ep === "") {
            bug.ep ="ep - autre";
        } else if (bug.ep.indexOf(",") > -1) {
            bug.ep = bug.ep.substring(0,bug.ep.indexOf(","));
        }       
        
        bug.version = capitalizeFirstLetter($(this).children('.labels').children('a:contains("v -")').first().text());
         if (bug.version.indexOf(",") > -1){
            bug.version = bug.version.substring(0,bug.version.indexOf(","));
        }
        
        $(this).children('.labels.pre').children('a:contains("bugprod")').each(function() {
            bugs.push(bug);
            if (bug.broadcast === "") {
                togglz.push(bug);
                if (bug.version != "") {
                    version.push(bug.version);
                }
            } else {
                broadcasts.push(bug.broadcast);
            }
        });
    });
    bugs.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    togglz.sort(function (a, b) {
        return a.name.localeCompare( b.name );
    });

    if (stories.length > 0) {
        broadcastNote = capitalizeFirstLetter(stories[0].ep);
    } else if (chores.length > 0) {
        broadcastNote = capitalizeFirstLetter(chores[0].ep);
    } else {
        broadcastNote = "No stories or chores";
    }

    broadcastNote = broadcastNote + '\n\n';

    $.each($.unique(broadcasts.sort()), function() {
        broadcastNote += "\n## " + this + "\n\n";
        var broadcast = this;
        var i = 0;
        for (i = 0; i < stories.length; i++) {
            if (stories[i].broadcast == broadcast) {
                broadcastNote += " * " + stories[i].name + " [https://www.pivotaltracker.com/story/show/" + stories[i].id + "]\n";
            }
        }
        i = 0;
        for (i = 0; i < chores.length; i++) {
            if (chores[i].broadcast == broadcast) {
                broadcastNote += " * " + chores[i].name + " [https://www.pivotaltracker.com/story/show/" + chores[i].id + "]\n";
            }
        }
        i = 0;
        for (i = 0; i < bugs.length; i++) {
            if (bugs[i].broadcast == broadcast) {
                broadcastNote += " * " + bugs[i].name + " [https://www.pivotaltracker.com/story/show/" + bugs[i].id + "]\n";
            }
        }
    });

    broadcastNote += "\n## OnAir\n\n";
    $.each($.unique(version.sort()), function() {
        broadcastNote += "\n### " + this + "\n\n";
        var version = this;
        var i = 0;
        for (i = 0; i < togglz.length; i++) {
            if (togglz[i].version == version) {
                broadcastNote += " * " + togglz[i].name + " [https://www.pivotaltracker.com/story/show/" + togglz[i].id + "]\n";
            }
        }
    });
    console.clear();
    console.log(broadcastNote);
    executeCopy(broadcastNote);
};
