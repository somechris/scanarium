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
        const cgi = 'report-feedback';
        const cgi_allowed = !isCgiForbidden(cgi);
        if (help_email_address || cgi_allowed) {
            this.appendSectionHeader('Feedback / Comments / Issue Reports');

            var text = '';
            if (help_email_address) {
                if (cgi_allowed) {
                    text = 'If you run into issues, or your pictures fail to scan please let us know through email to {email} or use this form:';
                } else {
                    text = 'If you run into issues, or your pictures fail to scan please let us know through email to {email}';
                }
            } else {
                text = 'If you run into issues, or your pictures fail to scan please report them using this form:';
            }

            if (text) {
                var p = document.createElement('p');
                localize(text).split('{email}').forEach((part, i, array) => {
                    if (part) {
                        p.appendChild(document.createTextNode(part));
                    }

                    if (i + 1 < array.length) {
                        var a = document.createElement('a');
                        const subject = localize('Scanarium feedback for {hostname}', {hostname: document.location.hostname});
                        a.href = 'mailto:' + help_email_address + '?subject=' + encodeURIComponent(subject);
                        a.textContent = help_email_address;
                        p.appendChild(a);
                    }
                });
                this.appendElement(p);
            }

            if (cgi_allowed) {
                var description;
                var submit = function(event) {
                    if (description && description.value) {
                        var data = new FormData();
                        data.append('description', description.value);
                        callCgi(cgi, data);
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    PauseManager.resume();
                }
                var form = new ManagedForm('feedback-form', submit, localize('Submit'));
                description = form.addTextArea(localize('Description'), 'feedback-description');
                this.appendElement(form.getElement());
            }
        }
    }
}
