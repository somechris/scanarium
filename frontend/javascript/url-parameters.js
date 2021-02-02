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

function getUrlParameter(name, defaultValue) {
    var ret = defaultValue;
    if (urlParameters.has(name)) {
        ret = sanitize_string(urlParameters.get(name));
    }
    return ret;
}

function getUrlParameterTrimmedLowerCaseString(name, defaultValue) {
        return String(getUrlParameter(name, false)).toLowerCase().trim();
}

function getUrlParameterBoolean(name, defaultValue) {
    var param = getUrlParameterTrimmedLowerCaseString(name, defaultValue);
    return (param == "1" || param == "true");
}

function setUrlParameter(key, value, follow) {
    urlParameters.set(key, value);
    if (follow) {
      document.location.search = '?' + urlParameters.toString();
    }
}

function setUrlParameterBoolean(key, value) {
    setUrlParameter(key, value ? 'true' : 'false');
}

var urlParameters = parseUrlParameters();
