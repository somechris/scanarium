// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var localization = {};
var language = 'fallback';
var formatTemplate = function(string, parameters) {
    split = string.split('{');
    for (i=1; i<split.length; i++) {
        closingIdx = split[i].indexOf('}');
        if (closingIdx != -1) {
            param_name = split[i].substring(0, closingIdx);
            rest = split[i].substring(closingIdx+1);
            param_value = parameters[param_name];
            if (typeof param_value === 'undefined') {
                param_value = '{' + split[i].substring(0, closingIdx + 1);
            }
            split[i] = param_value + rest;
        } else {
            split[i] = '{' + split[i];
        }
    }
    return split.join('');
}

var localize_parameter = function(name, value) {
    all_parameter_localizations = localization['parameters'] || {};
    key_localizations = all_parameter_localizations[name] || {};
    return key_localizations[value] || value;
}

var localize = function(template, parameters) {
    localized_parameters = {};
    Object.keys(parameters || {}).forEach((key, index) => {
        localized_parameters[key] = localize_parameter(key, parameters[key]);
    });
    message_localizations = localization['messages'] || {};
    template = message_localizations[template] || template;
    return formatTemplate(template, localized_parameters);
};

var language_candidates = [];

var addLanguageCandidate = function(lang) {
  var candidate = lang.split(/[;,._-]/)[0].toLowerCase();
  if (candidate) {
      language_candidates.push(candidate);
  }
}

addLanguageCandidate(getUrlParameter('language', ''));
addLanguageCandidate(navigator.language);
addLanguageCandidate('en');

var isLanguageLoaded = false;

function loadLanguage() {
    if (language_candidates.length) {
        const candidate = language_candidates.shift();

        loadJson('localization/' + candidate + '.json', function(data) {
            localization = data;
            language = candidate;
            isLanguageLoaded = true;
        }, undefined, undefined, function() {
            loadLanguage();
        });
    }
}
loadLanguage();

function get_localized_sorted_list_copy(list, parameter_name) {
    var scenes = list.slice();

    list.sort((a, b) => {
        a = localize_parameter(parameter_name, a);
        b = localize_parameter(parameter_name, b);
        if (a < b) {
            return -1;
        }
        if (a > b) {
            return 1;
        }
        return 0;
    });

    return list;
};
