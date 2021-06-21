// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class SettingsPageLogout extends NamedPage {
  constructor() {
    const name = localize_parameter('page_title', 'Logout');
    super('logout', name);
  }

  initContent() {
    const config = getConfig('logout');
    this.config = config;
    if (config) {
      this.appendElement(document.createElement('div'));
    }
  }

  onShowPage() {
    var method = 'logout';
    var config = this.config;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', config.url, true);
    xhr.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE) {
        if (this.status == config.success_status) {
          MessageManager.addMessage(localize('{method_name} ok', {'method_name': method}), 'ok');
          updateLocation(localize('Redirection after logout.'), config.redirect);
        } else {
          var msg = localize('{method_name} failed', {'method_name': method})
          msg += ': ' + localize('Received status {actual_status} instead of {expected_status}',
            { 'actual_status': this.status, 'expected_status': config.success_status});
          MessageManager.addMessage(msg, 'failed');
        }
      }
    };
    xhr.send();
    PauseManager.resume();
    MessageManager.addMessage(localize('{method_name} started', {'method_name': method}), 'info');
    this.parent.showPage('general');
  }
}
