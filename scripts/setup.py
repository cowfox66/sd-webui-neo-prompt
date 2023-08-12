from pathlib import Path
import shutil
import os
from typing import Generator, List

from modules import scripts

# ----------------------------------
# region Base Folder & File Paths

# SD WebUI Base Folder
SD_WEBUI_DIR = Path().absolute()

# Extension Project Base Folder
EXT_BASE_DIR = Path(scripts.basedir())
EXT_TAGS_DIR = EXT_BASE_DIR.joinpath('tags')
EXT_TAG_EXAMPLES_DIR = EXT_BASE_DIR.joinpath('tags_examples')

# Temp folder - under "SD WebUI Base Folder"
SD_WEBUI_TEMP_DIR = SD_WEBUI_DIR.joinpath('tmp')
# Create the folder just in case
os.makedirs(SD_WEBUI_TEMP_DIR, exist_ok=True)

# Temp file to save the paths to all "tag" files
TAG_PATH_LIST_FILENAME = 'neoPromptTagListPaths.txt'
TEMP_TAG_PATH_LIST_FILE = SD_WEBUI_TEMP_DIR.joinpath(TAG_PATH_LIST_FILENAME)
# endregion

# ----------------------------------
# region Helper Functions

def load_file_paths(base_folder: Path, pattern: str = '*.yml')-> Generator[Path, None, None]:
    """Load "paths" of all files under the given "base folder".

    NOTE:
    - It also loads the files inside the sub-folders.

    Parameters
    ----------
    base_folder : Path
        The path of the "base folder".
    pattern : str
        The filename patter to check. By default, it is set to `*.yml`.

    Returns
    -------
    Generator[Path, None, None]
        The iterator of paths of all checked files.
    """
    return base_folder.rglob(pattern)

def copy_example_tags():
    """Copy "Example Tag Files" to `tags` folder.
    """

    # Guard
    if len(list(load_file_paths(EXT_TAGS_DIR))) != 0:
        return

    # Load files under the "example folder" and copy
    for file_path in load_file_paths(EXT_TAG_EXAMPLES_DIR):
        # Replace the "tag folder" of the path
        destination_file_path = str(file_path).replace('tags_examples', 'tags')
        # Create the "path folders" if needed
        destination_folder_path = os.path.dirname(destination_file_path)
        if not os.path.exists(destination_folder_path):
            os.makedirs(destination_folder_path)

        # Copy the files
        shutil.copy2(file_path, destination_file_path)

def export_tag_file_path_list_to_file():
    # Get the relative paths
    tag_file_path_list = map(lambda path: path.relative_to(SD_WEBUI_DIR).as_posix(), list(load_file_paths(EXT_TAGS_DIR)))

    # Write to the file
    with open(TEMP_TAG_PATH_LIST_FILE, 'w', encoding="utf-8") as infile:
        infile.write('\n'.join(sorted(tag_file_path_list)))
# endregion

# ----------------------------------
# region Main
#
# It loads all "tag" files from `tags` folder and save the "paths"
#   to a `temp` file for UI to load.
#
# NOTE:
#   - If `tags` folder is empty, it copies the "example tag files" from
#       the `tag_examples` folder first.

if len(list(load_file_paths(EXT_TAGS_DIR))) == 0:
    copy_example_tags()

# Export the tag files
export_tag_file_path_list_to_file()

# endregion

