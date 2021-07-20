// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class SettingsPageHelp extends NamedPage {
    constructor() {
        const name = localize_parameter('page_title', 'Help');
        super('help', name);
    }

    initContent() {
        this.initContentOnlineDocumentation();
        this.initContentHelp();
        this.initContentLegalButtons();
    }

    initContentOnlineDocumentation() {
        if (getConfig("documentation_url")) {
            this.appendSectionHeader('Online Help');

            var button = document.createElement('button');
            button.textContent = localize('Go to online help');
            button.style['font-size'] = SettingsButton.button.style['font-size'];
            button.onclick = function(e) {
                var reason = localize('Forwarding to {url-description}.', {'url-description': 'online help'});
                updateLocation(reason, getConfig("documentation_url"));
                e.stopPropagation();
                e.preventDefault();
            };
            this.appendElement(button);
        }
    }

    initContentHelp() {
        const pageId = this.id;
        const help_email_address = getConfig('help_email_address');
        const cgi = 'report-feedback';
        const cgi_allowed = !isCgiForbidden(cgi);
        if (help_email_address || cgi_allowed) {
            var sectionHeader = this.appendSectionHeader('Feedback / Comments / Issue Reports');

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
                        const subject = localize('Scanarium feedback for {hostname}', {hostname: window.location.hostname});
                        a.href = 'mailto:' + help_email_address + '?subject=' + encodeURIComponent(subject);
                        a.textContent = help_email_address;
                        p.appendChild(a);
                    }
                });
                this.appendElement(p);
            }

            if (cgi_allowed) {
                var message;
                var email;
                var includeLastFailedCheckBox;
                var includeUserAgent;
                var lastFailedUpload;
                var submit = function(event) {
                    if (message && message.value) {
                        var data = new FormData();
                        data.append('message', message.value);
                        data.append('email', email.value);
                        if (includeLastFailedCheckBox.checked && lastFailedUpload) {
                            data.append('lastFailedUpload', lastFailedUpload);
                        }
                        if (includeUserAgent.checked) {
                            data.append('userAgent', navigator.userAgent);
                        }
                        callCgi(cgi, data);
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    PauseManager.resume();
                }
                var form = new ManagedForm('feedback-form', submit, localize('Submit'));

                email = form.addEmail(localize('From'), 'feedback-email', undefined, localize('your.address@example.org'));

                var scanariumTeamText = localize('Scanarium-Team');
                if (help_email_address) {
                    scanariumTeamText = help_email_address;
                }
                form.addFixedTextField(localize('To'), 'feedback-to', scanariumTeamText);

                var textAreaValidator = function (node) {
                    if (!node.value) {
                        const checkboxVisible = includeLastFailedCheckBox && !includeLastFailedCheckBox.rowElement.className.includes('hidden');
                        if (checkboxVisible) {
                            if (!includeLastFailedCheckBox.checked) {
                                return localize('No content provided for feedback. Either provide a message, or attach the last failed image.');
                            }
                        } else {
                            return localize('This field may not be empty');
                        }
                    }
                    return true;
                };
                const placeholder = 'Feedback, comments, issue reports, ...';
                message = form.addTextArea(localize('Message'), 'feedback-message', textAreaValidator, localize(placeholder));

                var checkBoxValidator = function (node) {
                    const isVisible = includeLastFailedCheckBox && !includeLastFailedCheckBox.rowElement.className.includes('hidden');
                    if (isVisible && !includeLastFailedCheckBox.checked && !message.value) {
                        return localize('No content provided for feedback. Either provide a message, or attach the last failed image.');
                    }
                    return true;
                };
                includeLastFailedCheckBox = form.addCheckbox(localize('Attachment'), 'feedback-attach-last-failed-upload', checkBoxValidator, localize('Include last failed upload'));
                includeLastFailedCheckBox.setChecked(false);
                includeLastFailedCheckBox.rowElement.classList.add('hidden');

                var lastFailedUploadPreview = document.createElement('img');
                lastFailedUploadPreview.id = 'feedback-last-failed-upload-preview';
                lastFailedUploadPreview.onload = function() {
                    if (this.src) {
                        URL.revokeObjectURL(this.src);
                    }
                }
                lastFailedUploadPreview.onclick = includeLastFailedCheckBox.toggle;
                includeLastFailedCheckBox.parentNode.appendChild(lastFailedUploadPreview)

                includeLastFailedCheckBox.uploadListener = function(file, is_ok, MessageManagerMessage) {
                    if (!is_ok) {
                        includeLastFailedCheckBox.rowElement.classList.remove('hidden');
                        lastFailedUploadPreview.src = URL.createObjectURL(file);
                        lastFailedUpload = file;
                        if (!message.value) {
                            var text = 'Dear Scanarium Team,\\n\\nThe attached picture failed to scan, but I cannot see why. Could you please have a look?\\n\\nThanks and best regards';
                            message.value = localize(text).split('\\n').join('\n');
                        }
                        // Setting the checkbox last, as this most reliably
                        // triggers re-validation.
                        includeLastFailedCheckBox.setChecked(true);

                        if (MessageManagerMessage) {
                            MessageManager.addButtonToMessage(MessageManagerMessage, localize('Report problem'), () => {
                                Settings.show(pageId);
                                sectionHeader.scrollIntoView();
                            });
                        }
                    }
                };
                UploadButton.registerUploadListener(includeLastFailedCheckBox.uploadListener);

                includeUserAgent = form.addCheckbox(localize('Attachment'), 'feedback-attach-user-agent', undefined, localize('Include browser identification'));
                includeUserAgent.setChecked(true);

                this.appendElement(form.getElement());
            }
        }
    }

    initContentLegalButtons() {
        const buttons = getConfig("legal-buttons");
        if (buttons && buttons.length > 0) {
            this.appendSectionHeader('Legal');

            buttons.forEach(buttonConfig => {
                var button = document.createElement('button');
                var name = localize_parameter('url-description', buttonConfig['name']);
                if (name) {
                    name = name[0].toUpperCase() + name.substring(1);
                }
                button.textContent = name;
                button.style['font-size'] = SettingsButton.button.style['font-size'];
                button.onclick = function(e) {
                    var reason = localize('Forwarding to {url-description}.', {'url-description': buttonConfig['name']});
                    var url = buttonConfig['url'];
                    if (!url) {
                        if (buttonConfig['name'] == 'imprint') {
                            url = getConfig('imprint');
                        }
                    }
                    updateLocation(reason, url);
                    e.stopPropagation();
                    e.preventDefault();
                };

                var p = document.createElement('p');
                p.appendChild(button);

                this.appendElement(p);
            });
        }
    }
}
