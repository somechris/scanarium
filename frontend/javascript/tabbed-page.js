// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class NamedPage {
    constructor(id, name) {
        this.parent = null;
        this.id = id;
        this.name = name;

        var content = document.createElement('div');
        content.id = 'named-page-content-' + id;
        content.className = 'named-page-content';
        this.content = content;
        this.initContent();
    }

    appendElement(element) {
        this.content.appendChild(element);
    }

    appendSectionHeader(title, localization_parameters) {
        var heading = document.createElement('h2');
        heading.textContent = localize(title, localization_parameters);
        this.appendElement(heading);
    }

    initContent(content) {
        this.content.textContent = this.name;
    }

    setParent(parent) {
        this.parent = parent;
    }

    getId() {
        return this.id;
    }

    getName() {
        return this.name;
    }

    onShowPage() {
    }

    getContentElement() {
        return this.content;
    }
}

class TabbedPage {
    constructor(id, pages) {
        this.tabContainer = document.createElement('div');
        this.tabContainer.className = 'tabbed-page-tab-container';

        this.content = document.createElement('div');
        this.content.className = 'tabbed-page-content';

        this.element = document.createElement('div');
        this.element.id = id;
        this.element.className = 'tabbed-page';
        this.element.onclick = function(e) {
            // We need to propagate to enable scrolling. Yet we need to flag to the
            // document handler that the event is handled upstream. So we add a
            // custom property.
            e.handled_by_scanarium_settings = true;
        }
        this.element.ontouchstart = this.element.onclick;
        this.element.onkeypress = this.element.onclick;
        this.element.appendChild(this.tabContainer);
        this.element.appendChild(this.content);

        this.pages = {}
        this.tabs = {}
        this.contents = {}
        var self = this;
        pages.forEach(page => {
            const pageId = page.getId();
            this.pages[pageId] = page;

            var tab = document.createElement('div');
            tab.id = 'tabbed-page-tab-' + pageId;
            tab.textContent = page.getName();
            tab.className = 'tabbed-page-tab';
            tab.onclick = function(e) {
                self.showPage(pageId);
            }

            this.tabs[pageId] = tab;
            this.tabContainer.appendChild(tab);

            this.contents[pageId] = page.getContentElement();
        });

        if (pages.length) {
            this.showPage(pages[0].getId());
        }
    }

    showPage(id) {
        Object.keys(this.tabs).forEach(tabId => {
            var tab = this.tabs[tabId];
            tab.className = tab.className.replace(/(^| )tabbed-page-tab-selected( |$)/, '$1$2');
        });
        this.tabs[id].className += ' tabbed-page-tab-selected';

        // Setting content
        while (this.content.firstChild) {
            this.content.removeChild(this.content.firstChild);
        }
        this.content.appendChild(this.contents[id]);
        this.content.scrollTop = 0;

        this.pages[id].onShowPage();
    }

    getElement() {
        return this.element;
    }
}
