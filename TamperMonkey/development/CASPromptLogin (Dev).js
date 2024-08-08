// ==UserScript==
// @name       CAS Prompt Login (DEV)
// @namespace  http://use.i.E.your.homepage/
// @version    0.2 (2024-04-30)
// @description Liens de connexion rapide avec user de tests sur le CAS en dev et stage
// @match      https://cloud.dev.omnimed.com/cas/login*
// @match      https://stage.omnimed.com/cas/login*
// @copyright  2012+, You
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// ==/UserScript==

$('#passwordSection').hide();

var users = ['loki01','kenobi01','skyluk01','jinqui01'].reverse(); //'jinqui01','orglei','c3p0','superuser01','amipad'

var userDiv = $('<div style="display: flex; flex-wrap: wrap; gap: 25px; padding-bottom: 15px;">');
$('#fm1').prepend(userDiv);

for(var i = 0;i<users.length;i++) {
    var user = users[i];

    userDiv.append('<a href="javascript:void(0)" id="'+user+'" style="font-size:30px; flex-grow: 1; padding: 5px 10px;">'+user+'</a>');


    $('#' + user).click(function() {
        var username = this.id;
        $('#username').val(username);
        $('.connect-button').click();
    });
};

$('.connect-button').click(function() {
    $('#password').val($('#username').val());
});

