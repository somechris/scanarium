// This file is part of Scanarium https://scanarium.com/ and licensed under the
// GNU Affero General Public License v3.0 (See LICENSE.md)
// SPDX-License-Identifier: AGPL-3.0-only

class SettingsPageGeneral extends NamedPage {
    constructor() {
        const name = localize_parameter('page_title', 'General');
        super('general', name);
    }

    initContent() {
        this.initContentSwitchScene();
        this.initContentColoringPages();
        this.initContentNews();
    }

    initContentSwitchScene() {
        this.appendSectionHeader('Switch scene');
        var sceneList = document.createElement('p');
        sceneList.id = 'section-scene-switcher';
        sceneList.className = 'card-container';
        sceneList.textContent = localize('Loading scene data ...');

        this.sceneList = sceneList;

        this.loadScenesConfig();

        this.appendElement(sceneList);
    }

    initContentColoringPages() {
        this.appendSectionHeader('Coloring pages for scene {scene_name}', {scene_name: scene});

        var actorList = document.createElement('div');
        actorList.id = 'actor-list';
        actorList.className = 'card-container';
        actorList.textContent = localize('Loading actor data ...');

        this.actorList = actorList;

        this.loadActorVariants();

        this.appendElement(actorList);
    }

    initContentNews() {
        var news = getConfig('news');
        if (news.length) {
            this.appendSectionHeader('More about Scanarium');

            var newsList = document.createElement('div');
            newsList.id = 'news-list';
            newsList.className = 'card-container';

            news.forEach(config => {
                const name = localize_parameter('site', config['name']);


                var image = document.createElement('img');
                image.className = 'card-image';
                image.src = config['icon'];
                image.alt = name;

                var label = document.createElement('div');
                label.className = 'card-label';
                label.textContent = name;

                var link = document.createElement('a');
                link.href = config['url'];
                link.onclick = function(e) {
                    updateLocation(true,
                                   localize('Forwarding to {url-description}.', {'url-description': name}),
                                   config['url'], false);
                    e.stopPropagation();
                    e.preventDefault();
                };
                link.className = 'card';
                link.appendChild(image);
                link.appendChild(label);

                newsList.appendChild(link);
            });

            this.appendElement(newsList);
        }
    }


    loadScenesConfig() {
        var self = this;
        if (scenes_config.length == 0) {
            loadDynamicConfig(scenes_dir + '/scenes.json', function(payload) {
                scenes_config = sanitize_list(payload);
                self.loadedScenesConfig();
            });
        } else {
            self.loadedScenesConfig();
        }
    }

    loadActorVariants() {
        var self = this;
        if (actor_variants.length == 0) {
            loadJson(scene_dir + '/actor-variants.json', function(payload) {
                actor_variants = sanitize_dictionary(payload, undefined, true);
                self.loadedActorVariants();
            });
        } else {
            self.loadedActorVariants();
        }
    }

    loadedScenesConfig() {
        var self = this;
        var scenes = get_localized_sorted_list_copy(scenes_config, 'scene_name');
        this.sceneList.textContent = '';
        scenes.forEach(scene => {
            const localized_scene_name = localize_parameter('scene_name', scene);
            var sceneImage = document.createElement('img');
            sceneImage.className = 'card-image';
            sceneImage.src = 'scenes/' + scene + '/scene-bait-thumb.jpg';
            sceneImage.alt = localized_scene_name;

            var sceneLabel = document.createElement('div');
            sceneLabel.className = 'card-label';
            sceneLabel.textContent = localized_scene_name;

            var sceneLink = document.createElement('a');
            sceneLink.href = '';
            sceneLink.onclick = function(e) {
                self.switchScene(scene);
                e.stopPropagation();
                e.preventDefault();
            };
            sceneLink.className = 'card';
            sceneLink.appendChild(sceneImage);
            sceneLink.appendChild(sceneLabel);

            this.sceneList.appendChild(sceneLink);
        });
    }

    loadedActorVariants() {
        this.actorList.textContent = '';
        var langDir = Object.keys(localization).length ? language : 'fallback';
        var items = {}
        var offerPdfs = getConfig('offer-pdf-downloads');
        Object.keys(actor_variants).forEach(actor => actor_variants[actor].forEach(variant => {
            const localized_actor = localize_parameter('actor_name', actor);
            var name = localized_actor;
            if (variant) {
                const localized_variant = localize_parameter('parameter_variant_name', variant);
                name = localize('{parameter_name} ({parameter_variant_name})', {
                    parameter_name: localized_actor,
                    parameter_variant_name: localized_variant,
                });
            }
            var basename = this.toSaveFilename(name);
            const base_path = 'scenes/' + scene + '/actors/' + actor + '/pdfs/' + langDir + '/' + basename;

            items[basename] = {
                name: name,
                pdf_file: base_path + '.pdf',
                thumb_file: base_path + '-thumb.jpg',
            };
        }));
        var item_keys = Object.keys(items).sort();

        if (offerPdfs) {
            var all_actors_name = localize('All {scene_name} coloring pages', {scene_name: scene});
            items['all'] = {
                name: all_actors_name,
                pdf_file: scene_dir + '/pdfs/' + language + '/' + this.toSaveFilename(all_actors_name) + '.pdf',
                thumb_file: scene_dir + '/scene-book-thumb.jpg',
            };
            item_keys.unshift('all');
        }

        item_keys.forEach(key => {
            const item = items[key];
            const base_path = item['base_path'];
            const name = item['name'];

            var actorImage = document.createElement('img');
            actorImage.className = 'card-image';
            actorImage.src = item['thumb_file'];
            actorImage.alt = name;

            var actorLabel = document.createElement('div');
            actorLabel.className = 'card-label';
            actorLabel.textContent = name;

            var actorCard = document.createElement(offerPdfs ? 'a' : 'span');
            if (offerPdfs) {
                actorCard.href = item['pdf_file'];
            }
            actorCard.className = 'card';
            actorCard.appendChild(actorImage);
            actorCard.appendChild(actorLabel);

            this.actorList.appendChild(actorCard);
        });
    }

    switchScene(scene) {
        setUrlParameter('scene', scene, true);
        PauseManager.resume();
    }

    toSaveFilename(name) {
        var name = name.replace(/[^a-zA-Z0-9]+/g, '-');
        name = name.replace(/^-/g, '');
        name = name.replace(/-$/g, '');
        return name;
    }
}
