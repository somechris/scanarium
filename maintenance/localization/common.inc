set -e
set -o pipefail

cd "$(dirname "$0")"
SCRIPT_DIR_ABS="$(pwd)"

cd ../..
ROOT_DIR_ABS="$(pwd)"

cd localization
LOCALIZATION_DIR_ABS="$(pwd)"

for_all_json_files() {
    for L10N_FILE in *.json
    do
        echo "$L10N_FILE ..."
        "$@"
    done
}
