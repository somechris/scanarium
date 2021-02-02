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

function getParameter(name, defaultValue) {
    var ret = defaultValue;
    if (name in parameters) {
        ret = sanitize_string(parameters[name]);
    }
    return ret;
}

function getParameterTrimmedLowerCaseString(name, defaultValue) {
        return String(getParameter(name, false)).toLowerCase().trim();
}

function getParameterBoolean(name, defaultValue) {
    var param = getParameterTrimmedLowerCaseString(name, defaultValue);
    return (param == "1" || param == "true");
}

function setParameter(key, value) {
    var params = new URLSearchParams(document.location.search.substring(1));
    params.set(key, value);
    document.location.search = '?' + params.toString();
}

var parameters = parseUrlParameters();
