"use strict";

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
var amagiDropdownTimers = {}; // START CUSTOM GLOBAL VARIABLES
// These are used to track links

var _hrefs = new Map();

var _dynamicHrefs = new Map(); // END CUSTOM GLOBAL VARIABLES


function setValue(el) {
  var searchId = el.parentElement.dataset.searchid;

  if (el.className.indexOf('active') < 0) {
    el.className += ' active';

    for (i = 0; i < el.parentElement.childElementCount; i++) {
      if (el.parentElement.children[i] != el) el.parentElement.children[i].className = 'list-group-item list-group-item-action';
    }
  } else {
    var targetElement = document.getElementById(el.parentElement.dataset.element);
    targetElement.value = el.dataset.val;
    var displayElement = document.getElementById("display_".concat(searchId)); // Here, I set the display to innerHTML rather than value
    // This is because I changed the display element from an input to a span
    // The removed line is below:
    //displayElement.value = el.dataset.text;
    // The added line is below:

    displayElement.innerHTML = el.dataset.text; // Custom JS to deal with added 'a' tag

    if (document.getElementById("link_".concat(searchId))) {
      var _eleId = searchId.substring(0, searchId.indexOf("_"));

      if (document.getElementById("link_".concat(searchId)).href.includes("?")) {
        document.getElementById("link_".concat(searchId)).href = "".concat(_hrefs.get(_eleId), "?").concat(_dynamicHrefs.get(_eleId), "=").concat(el.dataset.val);
      } else {
        document.getElementById("link_".concat(searchId)).href = "".concat(_hrefs.get(_eleId));
      }
    }

    if (targetElement.onchange != null) targetElement.onchange();
    $("#modal_".concat(searchId)).modal("hide");
  }
}

function amagiDropdown(settings) {
  var _elementId = settings.elementId;
  var _data = settings.data;
  var _selectedValue = settings.selectedValue;
  var _searchButtonInnerHtml = settings.searchButtonInnerHtml;
  var _closeButtonInnerHtml = settings.closeButtonInnerHtml;
  var _title = settings.title;
  var _bodyMessage = settings.bodyMessage; // Below are my own custom variables
  //_href = settings.href;
  //_dynamicHref = settings.dynamicHref;

  _hrefs.set(_elementId, settings.href);

  _dynamicHrefs.set(_elementId, settings.dynamicHref); // End custom variables


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
  } // Custom JS for href and dynamicHref


  if (_hrefs.get(_elementId) == null || _hrefs.get(_elementId).length < 1) {
    _hrefs.set(_elementId, "");
  }

  if (_dynamicHrefs.get(_elementId) == null || _dynamicHrefs.get(_elementId).length < 1 || _hrefs.get(_elementId) === "") {
    _dynamicHrefs.set(_elementId, "");
  } // End custom JS


  var el = document.getElementById(_elementId);
  var searchId = _elementId + '_' + Math.floor(Math.random() * 1000);
  var selectedDisplayText = '';
  var modalButton = '';

  if (_data != null && _data.length > 0) {
    for (var i = 0; i < _data.length; i++) {
      var o = _data[i];
      if (o.value == _selectedValue) selectedDisplayText = o.display;
      modalButton += "<button type=\"button\" data-val=\"".concat(o.value, "\" data-text=\"").concat(o.display, "\" onclick=\"setValue(this)\" class=\"list-group-item list-group-item-action").concat(o.value == _selectedValue ? ' active' : '', "\">").concat(o.display, "</button>");
    }
  } else {
    for (var i = 0; i < el.options.length; i++) {
      var o = el.options[i];

      if (o.selected == true) {
        _selectedValue = o.value;
        selectedDisplayText = o.text;
      }

      modalButton += "<button type=\"button\" data-val=\"".concat(o.value, "\" data-text=\"").concat(o.text, "\" onclick=\"setValue(this)\" class=\"list-group-item list-group-item-action").concat(o.selected == true ? ' active' : '', "\">").concat(o.text, "</button>");
    }
  }

  var elOnchangeEvent = el.onchange; // Here, I removed the first input and replaced it with a span
  // The removed input was: 
  //<input id="display_${searchId}" type="text" readonly="readonly" class="form-control" style="background:white;outline:none;" value="${selectedDisplayText}"/>
  // The added span was:
  // <span id="display_${searchId}" class="input-group-text px-1 px-md-2" style="width: 63%">${selectedDisplayText}</span>
  // I also added an additional button that allows for linking as well as some JS with var toAppend

  var toAppend = "";

  if (_hrefs.get(_elementId) !== null && _hrefs.get(_elementId).length > 0) {
    var tmp = _dynamicHrefs.get(_elementId) !== "" ? "".concat(_hrefs.get(_elementId), "?").concat(_dynamicHrefs.get(_elementId), "=").concat(_selectedValue) : _hrefs.get(_elementId);
    toAppend = "\n        <div class=\"input-group-append\">\n            <a id=\"link_".concat(searchId, "\" class=\"btn btn-outline-info\" href=\"").concat(tmp, "\" class=\"text-decoration-none\">Go</a>\n        </div>\n        ");
  }

  el.outerHTML = "\n    <div class=\"input-group\">\n        <span id=\"display_".concat(searchId, "\" class=\"input-group-text px-1 px-md-2\" style=\"width: 63%\">").concat(selectedDisplayText, "</span>\n        <input id=\"").concat(el.id, "\" name=\"").concat(el.name, "\" type=\"hidden\" value=\"").concat(_selectedValue, "\"/> \n        <div class=\"input-group-append\" >\n            <button id=\"btn_").concat(searchId, "\" class=\"btn btn-outline-secondary\" type=\"button\" data-toggle=\"modal\" data-target=\"#modal_").concat(searchId, "\">").concat(_searchButtonInnerHtml, "</button>\n        </div>\n        ").concat(toAppend, "\n    </div>");

  var _modalElement = document.createElement('div'); // Changed form tag under .modal-body to a div to prevent form action


  _modalElement.innerHTML += "\n    <div class=\"modal fade bd-example-modal-lg\" id=\"modal_".concat(searchId, "\" tabindex=\"-1\" role=\"dialog\" aria-hidden=\"true\">\n        <div class=\"modal-dialog modal-lg\" role=\"document\">\n            <div class=\"modal-content\">\n                <div class=\"modal-header\">\n                <h5 class=\"modal-title\">").concat(_title, "</h5>\n                <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n             <span aria-hidden=\"true\">&times;</span>\n         </button>\n        </div>\n        <div class=\"modal-body\">\n            <div>\n                <p>").concat(_bodyMessage, "</p>\n                <div class=\"form-row\">\n                    <input id=\"src_").concat(searchId, "\" class=\"form-control form-control-lg\" type=\"text\" placeholder=\"\">\n                </div>\n                <hr>\n                <div id=\"list_").concat(_elementId, "\" class=\"list-group\" data-element=\"").concat(_elementId, "\" data-searchid=\"").concat(searchId, "\">\n                    ").concat(modalButton, "\n                </div>\n            </div>\n            </div>\n                <div class=\"modal-footer\">\n                    <button type=\"button\" class=\"btn btn-secondary\" data-dismiss=\"modal\">").concat(_closeButtonInnerHtml, "</button>\n                </div>\n            </div>\n        </div>\n    </div>");
  document.body.append(_modalElement.firstElementChild);
  amagiDropdownTimers['tmr_' + searchId] = null;
  document.getElementById(_elementId).onchange = elOnchangeEvent;
  document.getElementById("src_".concat(searchId)).addEventListener('input', function (ev) {
    clearTimeout(amagiDropdownTimers['tmr_' + searchId]); // Changed timeout from 1000ms to 200ms

    amagiDropdownTimers['tmr_' + searchId] = setTimeout(function () {
      var searchText = ev.target.value.toLowerCase();
      var list = document.getElementById("list_".concat(_elementId));

      for (i = 0; i < list.childElementCount; i++) {
        list.children[i].style.display = searchText == null || searchText.length < 1 ? "" : list.children[i].innerHTML.toLowerCase().indexOf(searchText) < 0 ? "none" : "";
      }
    }, 200);
  });
}