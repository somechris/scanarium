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
                var message;
                var includeLastFailedCheckBox;
                var lastFailedUpload;
                var submit = function(event) {
                    if (message && message.value) {
                        var data = new FormData();
                        data.append('message', message.value);
                        if (includeLastFailedCheckBox.checked && lastFailedUpload) {
                            data.append('lastFailedUpload', lastFailedUpload);
                        }
                        callCgi(cgi, data);
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    PauseManager.resume();
                }
                var form = new ManagedForm('feedback-form', submit, localize('Submit'));
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
                message = form.addTextArea(localize('Message'), 'feedback-message', textAreaValidator);

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

                includeLastFailedCheckBox.uploadListener = function(file, is_ok) {
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
                    }
                };
                UploadButton.registerUploadListener(includeLastFailedCheckBox.uploadListener);

                this.appendElement(form.getElement());
            }
        }
    }
}
