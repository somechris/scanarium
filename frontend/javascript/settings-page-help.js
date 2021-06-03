// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class SettingsPageHelp extends NamedPage {
    constructor() {
        const name = localize_parameter('page_title', 'Help');
        super('help', name);
    }

    initContent() {
        this.initContentHelp();
    }

    initContentHelp() {
        const help_email_address = getConfig('help_email_address');
        if (help_email_address) {
            var p = document.createElement('p');
            const text_before_address = 'If you run into issues, or your pictures fail to scan, feel free to reach out via email to ';
            p.appendChild(document.createTextNode(localize(text_before_address)));

            var a = document.createElement('a');
            const subject = localize('Scanarium feedback for {hostname}', {hostname: document.location.hostname});
            a.href = 'mailto:' + help_email_address + '?subject=' + encodeURIComponent(subject);
            a.textContent = help_email_address;
            p.appendChild(a);

            this.appendElement(p);
        }
    }
}
