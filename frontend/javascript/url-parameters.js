// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

function parseUrlParameters()
{
    var parameters = new URLSearchParams("");
    var allowed = /^[a-zA-Z0-9_]*$/;
    (new URLSearchParams(document.location.search.substring(1))).forEach((value, key) => {
        if (key.match(allowed) && value.match(allowed) && !parameters.has(key)) {
          parameters.set(key, value);
        }
    });

    return parameters;
}

function updateLocation(reload, reason, target, isDownload) {
    if (!target) {
        const location = document.location;
        target = location.protocol + '//' + location.host + location.pathname + '?' + urlParameters.toString();
    }

    var action;
    if (document.location.search == target) {
        if (reload) {
            action = () => {
                window.location.reload();
            }
        }
    } else {
        action = () => {
            document.location.href = target;
        };
    }

    if (action) {
        UploadButton.runOnceUploadsFinished(action, reason, isDownload);
    }
}

function getUrlParameter(name, defaultValue) {
    var ret = defaultValue;
    if (urlParameters.has(name)) {
        ret = sanitize_string(urlParameters.get(name));
    }
    return ret;
}

function getUrlParameterTrimmedLowerCaseString(name, defaultValue) {
        return String(getUrlParameter(name, defaultValue)).toLowerCase().trim();
}

function getUrlParameterBoolean(name, defaultValue) {
    var param = getUrlParameterTrimmedLowerCaseString(name, defaultValue);
    return (param == "1" || param == "true");
}

function setUrlParameter(key, value, follow) {
    urlParameters.set(key, value);
    if (follow) {
      updateLocation(true, localize('Applying the changes requires to automatically reload the page'));
    }
}

function setUrlParameterBoolean(key, value) {
    setUrlParameter(key, value ? 'true' : 'false');
}

var urlParameters = parseUrlParameters();
