// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var loadingBlocks = [];

function blockLoading(reason) {
    loadingBlocks.push(reason);
}

function unblockLoading(reason) {
    loadingBlocks = loadingBlocks.filter(item => item != reason);
}

function isLoadingBlocked(allowedBlock) {
    var relevantBlocks = loadingBlocks.filter(item => (item !== allowedBlock));
    return relevantBlocks.length > 0;
}

function onceLoadingIsAllowed(callback, allowedBlock) {
    if (isLoadingBlocked(allowedBlock)) {
        window.setTimeout(() => onceLoadingIsAllowed(callback, allowedBlock), 3000);
    } else {
        callback();
    }
}

function loadJs(url, callback) {
    var element = document.createElement('script');
    element.onload = callback;
    element.src = url;
    onceLoadingIsAllowed(() => document.head.appendChild(element));
}

function loadJson(url, callback, method, param, error) {
    var xhr = new XMLHttpRequest();

    method = (typeof method !== 'undefined') ? method : 'GET';
    xhr.open(method, url, true);
    xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE) {
            if (this.status == 200) {
                if (typeof callback != 'undefined') {
                    callback(JSON.parse(this.responseText));
                }
            } else {
                if (typeof error != 'undefined') {
                    error(this, url, method, param);
                }
            }
        }
    }

    onceLoadingIsAllowed(() => xhr.send(param));
}

function loadDynamicConfig(url, callback) {
    var unpack = function(capsule) {
      if (sanitize_boolean(capsule, 'is_ok')) {
        callback(capsule['payload']);
      }
    }

    var wrappedCallback = callback;
    var data;

    if (dynamicConfigMethod == 'POST') {
      wrappedCallback = unpack;
      data = new FormData();
      data.append('file', url);
      url = 'cgi-bin/dump-dynamic-config';
    }

    loadJson(url, wrappedCallback, dynamicConfigMethod, data);
}

var FileLoader = {
    files: [],
    loadedFiles: [],
    allAdded: false,
    allLoadedCallback: null,

    load: function(url, callback) {
        this.allAdded = false;
        this.files.push(url);

        var that = this;
        var urlEnd = url.substring(url.lastIndexOf('.'));
        var wrappedCallback = function(param) {
            if (typeof callback != 'undefined') {
                callback(param);
            }
            that.loadedFiles.push(url);
            if (that.allAdded) {
                that.checkAllFilesLoaded();
            }
        };

        if (urlEnd == '.json') {
            loadJson(url, wrappedCallback);
        } else {
            // default to JavaScript
            loadJs(url, wrappedCallback);
        }
    },

    checkAllFilesLoaded: function() {
        if (this.allAdded) {
            this.files.sort();
            this.loadedFiles.sort();

            if (this.files.length != this.loadedFiles.length) {
                return;
            }

            var i;
            for (i=0; i < this.files.length; i++) {
                if (this.files[i] != this.loadedFiles[i]) {
                    return;
                }
            }

            // All elements agree, so we're fully loaded.
            if (this.allLoadedCallback) {
                var callback = this.allLoadedCallback;
                this.allLoadedCallback = null;
                callback();
            }
        }
    },

    whenAllLoaded: function(callback) {
        this.allLoadedCallback = callback;
        this.allAdded = true;
        this.checkAllFilesLoaded();
    }
};

