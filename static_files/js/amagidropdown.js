// I copied this file from a GitHub repository
// The link is: https://github.com/AmagiTech/amagibootstrapsearchmodalforselect
// The license is as follows:
/*
    MIT License

    Copyright (c) 2020 Muharrem Barkın

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in all
    copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
    SOFTWARE.
*/

// I have made some modifications to the js
// Where I have made modifications, I have indicated them with comments
// The first major modification is the addition of all the comments at the top of the page

const amagiDropdownTimers = {};
// START CUSTOM GLOBAL VARIABLES
// These are used to track links
var _hrefs = new Map();
var _dynamicHrefs = new Map();
// END CUSTOM GLOBAL VARIABLES

function setValue(el) {
    var searchId = el.parentElement.dataset.searchid;
    if (el.className.indexOf('active') < 0) {
        el.className += ' active';
        for (i = 0; i < el.parentElement.childElementCount; i++) {
            if (el.parentElement.children[i] != el)
                el.parentElement.children[i].className = 'list-group-item list-group-item-action';
        }
    } else {
        var targetElement = document.getElementById(el.parentElement.dataset.element);
        targetElement.value = el.dataset.val;
        var displayElement = document.getElementById(`display_${searchId}`);
        // Here, I set the display to innerHTML rather than value
        // This is because I changed the display element from an input to a span
        // The removed line is below:
        //displayElement.value = el.dataset.text;
        // The added line is below:
        displayElement.innerHTML = el.dataset.text;
        // Custom JS to deal with added 'a' tag
        if (document.getElementById(`link_${searchId}`)) {
            var _eleId = searchId.substring(0, searchId.indexOf("_"));
            if (document.getElementById(`link_${searchId}`).href.includes("?")) {
                document.getElementById(`link_${searchId}`).href = `${_hrefs.get(_eleId)}?${_dynamicHrefs.get(_eleId)}=${el.dataset.val}`;
            } else {
                document.getElementById(`link_${searchId}`).href = `${_hrefs.get(_eleId)}`;
            }
        }
        if (targetElement.onchange != null)
            targetElement.onchange();
        $(`#modal_${searchId}`).modal("hide");
    }

}
function amagiDropdown(settings) {
    var _elementId = settings.elementId;
    var _data = settings.data;
    var _selectedValue = settings.selectedValue;
    var _searchButtonInnerHtml = settings.searchButtonInnerHtml;
    var _closeButtonInnerHtml = settings.closeButtonInnerHtml;
    var _title = settings.title;
    var _bodyMessage = settings.bodyMessage;
    // Below are my own custom variables
    //_href = settings.href;
    //_dynamicHref = settings.dynamicHref;
    _hrefs.set(_elementId, settings.href);
    _dynamicHrefs.set(_elementId, settings.dynamicHref);
    // End custom variables
    if (_searchButtonInnerHtml == null || _searchButtonInnerHtml.length < 1) {
        _searchButtonInnerHtml = 'Search';
    }
    if (_closeButtonInnerHtml == null || _closeButtonInnerHtml.length < 1) {
        _closeButtonInnerHtml = 'Close';
    }
    if (_title == null || _title.length < 1) {
        _title = 'Search and Select';
    }
    if (_bodyMessage == null || _bodyMessage.length < 1) {
        _bodyMessage = 'Please first search and later double click the option you selected.';
    }
    // Custom JS for href and dynamicHref
    if (_hrefs.get(_elementId) == null || _hrefs.get(_elementId).length < 1) {
        _hrefs.set(_elementId, "");
    }
    if (_dynamicHrefs.get(_elementId) == null || _dynamicHrefs.get(_elementId).length < 1 || _hrefs.get(_elementId) === "") {
        _dynamicHrefs.set(_elementId, "");
    }
    // End custom JS
    

    var el = document.getElementById(_elementId);
    var searchId = _elementId + '_' + Math.floor(Math.random() * 1000);
    var selectedDisplayText = '';
    var modalButton = '';
    if (_data != null && _data.length > 0) {

        for (var i = 0; i < _data.length; i++) {
            var o = _data[i];
            if (o.value == _selectedValue)
                selectedDisplayText = o.display;
            modalButton += `<button type="button" data-val="${o.value}" data-text="${o.display}" onclick="setValue(this)" class="list-group-item list-group-item-action${o.value == _selectedValue ? ' active' : ''}">${o.display}</button>`
        }
    } else {
        for (var i = 0; i < el.options.length; i++) {
            var o = el.options[i];
            if (o.selected == true) {
                _selectedValue = o.value;
                selectedDisplayText = o.text;
            }
            modalButton += `<button type="button" data-val="${o.value}" data-text="${o.text}" onclick="setValue(this)" class="list-group-item list-group-item-action${o.selected == true ? ' active' : ''}">${o.text}</button>`
        }
    }
    var elOnchangeEvent = el.onchange;
    // Here, I removed the first input and replaced it with a span
    // The removed input was: 
    //<input id="display_${searchId}" type="text" readonly="readonly" class="form-control" style="background:white;outline:none;" value="${selectedDisplayText}"/>
    // The added span was:
    // <span id="display_${searchId}" class="input-group-text px-1 px-md-2" style="width: 63%">${selectedDisplayText}</span>
    // I also added an additional button that allows for linking as well as some JS with var toAppend

    var toAppend = "";
    if (_hrefs.get(_elementId) !== null && _hrefs.get(_elementId).length > 0) {
        var tmp = (_dynamicHrefs.get(_elementId) !== "") ? `${_hrefs.get(_elementId)}?${_dynamicHrefs.get(_elementId)}=${_selectedValue}` : _hrefs.get(_elementId);
        toAppend = `
        <div class="input-group-append">
            <a id="link_${searchId}" class="btn btn-outline-info" href="${tmp}" class="text-decoration-none">Go</a>
        </div>
        `;
    }
    el.outerHTML = `
    <div class="input-group">
        <span id="display_${searchId}" class="input-group-text px-1 px-md-2" style="width: 63%">${selectedDisplayText}</span>
        <input id="${el.id}" name="${el.name}" type="hidden" value="${_selectedValue}"/> 
        <div class="input-group-append" >
            <button id="btn_${searchId}" class="btn btn-outline-secondary" type="button" data-toggle="modal" data-target="#modal_${searchId}">${_searchButtonInnerHtml}</button>
        </div>
        ${toAppend}
    </div>`
    var _modalElement = document.createElement('div');
    // Changed form tag under .modal-body to a div to prevent form action
    _modalElement.innerHTML += `
    <div class="modal fade bd-example-modal-lg" id="modal_${searchId}" tabindex="-1" role="dialog" aria-hidden="true">
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                <h5 class="modal-title">${_title}</h5>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
             <span aria-hidden="true">&times;</span>
         </button>
        </div>
        <div class="modal-body">
            <div>
                <p>${_bodyMessage}</p>
                <div class="form-row">
                    <input id="src_${searchId}" class="form-control form-control-lg" type="text" placeholder="">
                </div>
                <hr>
                <div id="list_${_elementId}" class="list-group" data-element="${_elementId}" data-searchid="${searchId}">
                    ${modalButton}
                </div>
            </div>
            </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">${_closeButtonInnerHtml}</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.append(_modalElement.firstElementChild);
    amagiDropdownTimers['tmr_' + searchId] = null;
    document.getElementById(_elementId).onchange = elOnchangeEvent;
    document.getElementById(`src_${searchId}`).addEventListener('input', function (ev) {
        clearTimeout(amagiDropdownTimers['tmr_' + searchId]);
        // Changed timeout from 1000ms to 200ms
        amagiDropdownTimers['tmr_' + searchId] = setTimeout(
            function () {
                var searchText = ev.target.value.toLowerCase();
                var list = document.getElementById(`list_${_elementId}`);
                for (i = 0; i < list.childElementCount; i++) {
                    list.children[i].style.display = (searchText == null || searchText.length < 1) ? ""
                        : ((list.children[i].innerHTML.toLowerCase().indexOf(searchText) < 0) ? "none" : "");
                }
            }, 200);
    })
}