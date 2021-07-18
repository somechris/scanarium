# This file is part of Scanarium https://scanarium.com/ and licensed under the
# GNU Affero General Public License v3.0 (See LICENSE.md)
# SPDX-License-Identifier: AGPL-3.0-only

import logging
import os

logger = logging.getLogger(__name__)


class Indexer(object):
    def __init__(self, dynamic_dir, dumper):
        super(Indexer, self).__init__()
        self._dynamic_dir = dynamic_dir
        self._dumper = dumper

    def reindex_actors_for_scene(self, scene):
        scene_dir = os.path.join(self._dynamic_dir, 'scenes', scene)
        actors_data = {
            'actors': {},
        }
        actors_latest_data = {
            'actors': {},
        }
        actors_dir = os.path.join(scene_dir, 'actors')
        if os.path.isdir(actors_dir):
            for actor in os.listdir(actors_dir):
                actor_dir = os.path.join(actors_dir, actor)
                if os.path.isdir(actor_dir):
                    logging.debug(
                        f'Reindexing scene "{scene}" actor "{actor}" ...')
                    flavor_files = []
                    for flavor in os.listdir(actor_dir):
                        flavor_file = os.path.join(actor_dir, flavor)
                        if os.path.isfile(flavor_file) and \
                                flavor.endswith('.png') and \
                                not flavor.startswith('tmp-'):
                            flavor_files.append({
                                'flavor': flavor[:-4],
                                'key': os.stat(flavor_file).st_mtime,
                            })
                    flavor_files.sort(key=lambda f: f['key'], reverse=True)
                    flavors_sorted = [f['flavor'] for f in flavor_files]

                    actors_data['actors'][actor] = flavors_sorted
                    latest = [f for f in flavors_sorted[:10]]
                    actors_latest_data['actors'][actor] = latest

        self._dumper.dump_json(os.path.join(scene_dir, 'actors.json'),
                               actors_data)
        self._dumper.dump_json(os.path.join(scene_dir, 'actors-latest.json'),
                               actors_latest_data)
