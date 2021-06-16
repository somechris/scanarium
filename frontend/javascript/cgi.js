// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

var onReadyStateChange = function(cgi, finishedCallback) {
  return function() {
    if (this.readyState === XMLHttpRequest.DONE) {
      var capsule = {};
      var is_ok = false;
      if (this.status == 200) {
        capsule = JSON.parse(this.responseText);
        is_ok = sanitize_boolean(capsule, 'is_ok');
      } else {
        capsule = {
          'is_ok': false,
          'error_template': 'Response status was {response_status_code} instead of 200',
          'error_parameters': {'response_status_code': this.status.toString()}
        };
      }

      var message = CommandProcessor.process(capsule);

      if (finishedCallback) {
          finishedCallback(is_ok, message);
      }
    }
  };
};

callCgi = function(cgi, data, finishedCallback) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'cgi-bin/' + cgi, true);
    xhr.onreadystatechange = onReadyStateChange(cgi, finishedCallback);
    xhr.send(data);
}

function isCgiForbidden(cgi) {
    return isCommandForbidden('cgi:' + cgi);
}
