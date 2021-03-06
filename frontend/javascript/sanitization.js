// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var sanitize_resolve = function(value, field) {
    if (typeof(field) != 'undefined') {
        if (typeof(value) == 'object' && field in value) {
            value = value[field];
        } else {
            value = '';
        }
    }
    return value;
}

var sanitize_boolean = function(value, field) {
    value = sanitize_resolve(value, field);
    if (typeof(value) != 'boolean') {
        value = false;
    }
    return value;
}

var sanitize_string = function(value, field) {
    value = sanitize_resolve(value, field) || '';
    if (typeof(value) == 'number') {
        value = value.toString();
    }
    if (typeof(value) != 'string') {
        value = '';
    }

    return value.replace(/[^a-zA-Z0-9_,.:'" {}-]/g, '.');
}

var sanitize_list = function(value, field) {
    var value = sanitize_resolve(value, field);
    var ret = [];
    if (Array.isArray(value)) {
        value.forEach(element => ret.push(sanitize_string(element)));
    }
    return ret;
}

var sanitize_dictionary = function(value, field, allow_lists) {
    var value = sanitize_resolve(value, field);
    if (typeof(value) != 'object' || value == null) {
        value = {};
    }
    var ret = {};
    Object.keys(value).forEach((key, index) => {
        var key_sanitized = sanitize_string(key);
        var value_sanitized = '';
        if (typeof(value[key]) == 'boolean') {
            value_sanitized = sanitize_boolean(value[key]);
        } else if (allow_lists && Array.isArray(value[key])) {
            value_sanitized = sanitize_list(value[key]);
        } else {
            value_sanitized = sanitize_string(value[key]);
        }

        ret[key_sanitized] = value_sanitized;
    });

    return ret;
}
