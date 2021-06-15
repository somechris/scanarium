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

function updateLocation(reason, target, isDownload, uuid) {
    const location = window.location;
    if (!target) {
        if (MessageManager && MessageManager.lastEvictedUuid) {
            // We on purpose set the last fully shown message uuid already
            // here. That way, message evictions that happen during waiting for
            // uploads cannot get marked fully-shown, and will hence be shown
            // after the reloading.
            setUrlParameter('lastFullyShownUuid',
                            MessageManager.lastEvictedUuid);
        }
        uuid = uuid || (CommandProcessor && CommandProcessor.lastFullyProcessedUuid);
        if (uuid) {
            // We on purpose set the last fully processed uuid here, as we grab
            // the urlParameters already now. Changes that happed between now
            // and when the reload finishes will be re-processed.
            setUrlParameter('lastFullyProcessedUuid', uuid)
        }
        target = location.origin + location.pathname + '?' + urlParameters.toString();
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
    if (follow) {
      updateLocation(localize('Applying the changes requires to automatically reload the page'), undefined, undefined, uuid);
    }
}

function setUrlParameterBoolean(key, value) {
    setUrlParameter(key, value ? 'true' : 'false');
}

var urlParameters = parseUrlParameters();
