// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

function parseUrlParameters()
{
    var parameters = new URLSearchParams("");
    var allowed = /^[a-zA-Z0-9_-]*$/;
    (new URLSearchParams(window.location.search.substring(1))).forEach((value, key) => {
        if (key.match(allowed) && value.match(allowed) && !parameters.has(key)) {
          parameters.set(key, value);
        }
    });

    return parameters;
}

function currentUrl() {
    const location = window.location;
    return location.origin + location.pathname + '?' + urlParameters.toString();
}

function updateLocation(reason, target, isDownload, uuid) {
    if (!target) {
        uuid = uuid || (CommandProcessor && CommandProcessor.lastFullyProcessedUuid);
        if (uuid) {
            // We on purpose set the last fully processed uuid here, as we grab
            // the urlParameters already now. Changes that happed between now
            // and when the reload finishes will be re-processed.
            setUrlParameter('lastFullyProcessedUuid', uuid)
        }
        target = currentUrl();
    }

    var action = () => {
        var location = window.location
        if ((location.origin + location.pathname + location.search) == target) {
            location.reload();
        } else {
            location.href = target;
        }
    };

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

function setUrlParameter(key, value, follow, uuid) {
    urlParameters.set(key, value);
    window.history.replaceState({}, '', currentUrl());
    if (follow) {
      updateLocation(localize('Applying the changes requires to automatically reload the page'), undefined, undefined, uuid);
    }
}

function setUrlParameterBoolean(key, value) {
    setUrlParameter(key, value ? 'true' : 'false');
}

var urlParameters = parseUrlParameters();
