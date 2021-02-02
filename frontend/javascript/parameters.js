function parseUrlParameters()
{
    var parameters=new Object();
    var query = window.location.href.replace(/^[^?]*\?/,'');
    if ( window.location.href == query )
    {
        query = "";
    }

    var kvs = query.split('&');

    for ( index in kvs)
    {
        var key = decodeURIComponent(kvs[index].replace(/^([a-zA-Z0-9_]*)=.*/,"\$1"));
        if ( key != kvs[index] )
        {
            var value = decodeURIComponent(kvs[index].replace(/^([a-zA-Z0-9_]*)=/,""));
            parameters[key]=value;
        }
    }
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
