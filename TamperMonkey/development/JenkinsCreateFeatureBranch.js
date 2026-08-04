// ==UserScript==
// @name         Jenkins create feature branch
// @namespace    http://tampermonkey.net/
// @version      1.6
// @author       mplante
// @match        https://jenkins.omnimed.com/job/CreateFeatureBranch/build?delay=0sec*
// @match        https://jenkins.omnimed.com/*/job/CreateFeatureBranch/build?delay=0sec*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=omnimed.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var maxLength = 67;
    var FEATURE_NAME_PARAM = 'featureName';
    var PREFILLABLE_PARAMS = ['targetBranch', 'teamName', 'ticketNumber', 'featureName'];

    // Jenkins does NOT pre-fill this confirmation page's fields from the
    // request's query string on its own (verified: ?targetBranch=master is
    // silently ignored, dropdown stays on its default). So we do it
    // ourselves: read the query string and set each parameter's field.
    //
    // Jenkins renders each parameter as a block containing a hidden
    // input[name="name"] holding the parameter name, and a sibling
    // input/select[name="value"] holding the actual value. Look the
    // block up by parameter name instead of by position, since the
    // number/order of parameters on this job has changed before.
    function findParamValueInput(paramName) {
        var nameInputs = document.getElementsByName('name');
        for (var i = 0; i < nameInputs.length; i++) {
            if (nameInputs[i].value === paramName) {
                var block = nameInputs[i].closest('.jenkins-form-item') || nameInputs[i].parentElement;
                return block ? block.querySelector('[name="value"]') : null;
            }
        }
        return null;
    }

    function prefillFromQueryString() {
        var query = new URLSearchParams(window.location.search);
        PREFILLABLE_PARAMS.forEach(function(paramName) {
            if (!query.has(paramName)) return;
            var input = findParamValueInput(paramName);
            if (!input) return;
            input.value = query.get(paramName);
            var eventType = input.tagName === 'SELECT' ? 'change' : 'input';
            input.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
    }

    function addFeatureNameCounter() {
        var featureNameInput = findParamValueInput(FEATURE_NAME_PARAM);
        if (!featureNameInput) return;

        var paramBlock = featureNameInput.closest('.jenkins-form-item') || featureNameInput.parentElement;

        var div = document.createElement('div');
        div.id = 'branchNameLength';
        paramBlock.appendChild(div);

        function updateLength(e) {
            div.innerHTML = e.target.value.length + "/" + maxLength;
        }

        featureNameInput.addEventListener("input", updateLength);
        div.innerHTML = featureNameInput.value.length + "/" + maxLength;
    }

    prefillFromQueryString();
    addFeatureNameCounter();
})();
