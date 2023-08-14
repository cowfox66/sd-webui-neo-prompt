from pathlib import Path
import os, stat
import shutil
from typing import Generator, List
import git
import errno

from modules import scripts, shared, paths, errors
# from modules.gitpython_hack import Repo
from scripts.settings import SETTINGS_DEFAULT_REMOTE_TAG_REPO_URL, SETTINGS_DEFAULT_REMOTE_TAG_REPO_BRANCH

# ----------------------------------
# region Constants - Base Folder & File Paths

# SD WebUI Base Folder
SD_WEBUI_DIR = Path().absolute()

# Extension Project Base Folder
EXT_BASE_DIR = Path(scripts.basedir())
EXT_TAGS_DIR = EXT_BASE_DIR.joinpath('tags_local')
EXT_TAG_EXAMPLES_DIR = EXT_BASE_DIR.joinpath('tags_example')
EXT_REMOTE_TAGS_FIR = EXT_BASE_DIR.joinpath('tags_remote')

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
    # Get the relative paths for "all tags"
    remote_tag_file_path_list = map(lambda path: path.relative_to(SD_WEBUI_DIR).as_posix(), list(load_file_paths(EXT_REMOTE_TAGS_FIR)))
    local_tag_file_path_list = map(lambda path: path.relative_to(SD_WEBUI_DIR).as_posix(), list(load_file_paths(EXT_TAGS_DIR)))

    # Write to the file
    with open(TEMP_TAG_PATH_LIST_FILE, 'w', encoding="utf-8") as infile:
        infile.write('\n'.join(sorted(remote_tag_file_path_list)))
        infile.write('\n')
        infile.write('\n'.join(sorted(local_tag_file_path_list)))

def load_remote_tag_files_from_git_repo():
    # Get the "settings"
    repo_url = SETTINGS_DEFAULT_REMOTE_TAG_REPO_URL
    repo_branch_name = None
    if len(shared.opts.neo_prompt_tag_repo_url):
        repo_url = shared.opts.neo_prompt_tag_repo_url
    if len(shared.opts.neo_prompt_tag_repo_branch_name):
        repo_branch_name = shared.opts.neo_prompt_tag_repo_branch_name

    # Clone git
    clone_git(repo_url, EXT_REMOTE_TAGS_FIR, repo_branch_name)

def remove_readonly(func, path, exc_info):
    "Clear the readonly bit and reattempt the removal"
    # ERROR_ACCESS_DENIED = 5
    if func not in (os.unlink, os.rmdir) or exc_info[1].winerror != 5:
        raise exc_info[1]
    os.chmod(path, stat.S_IWRITE)
    func(path)

def delete_folder(folder_path: Path):
    if os.path.exists(folder_path):
        shutil.rmtree(folder_path, onerror=remove_readonly)

# endregion

# ----------------------------------
# region Git Cloning

def clone_git(git_repo_url: str, target_dir: Path, branch_name: str = None):
    #
    target_dirname = os.path.basename(os.path.normpath(target_dir))
    tmp_dir =  os.path.join(paths.data_path, 'tmp', target_dirname)

    # Try to clone the git repo
    try:
        delete_folder(tmp_dir)

        if not branch_name:
            # if no branch is specified, use the default branch
            with git.Repo.clone_from(git_repo_url, tmp_dir, filter=['blob:none']) as repo:
                repo.remote().fetch()
                for submodule in repo.submodules:
                    submodule.update()
        else:
            with git.Repo.clone_from(git_repo_url, tmp_dir, filter=['blob:none'], branch=branch_name) as repo:
                repo.remote().fetch()
                for submodule in repo.submodules:
                    submodule.update()
        try:
            # Move the new folder in
            # os.rename(tmp_dir, target_dir)

            delete_folder(target_dir)
            # When using `shutil`, the 'destination' needs to be the "parent" folder
            shutil.move(tmp_dir, target_dir.parents[0])
        except OSError as err:
            # Something else, not enough free space, permissions, etc.  rethrow it so that it gets handled.
            raise err
    finally:
        # Delete the "temp" folder
        delete_folder(tmp_dir)

# endregion


# ----------------------------------
# region Main
#
# It loads all "tag" files from `tags` folder and save the "paths"
#   to a `temp` file for UI to load.
#
# The `tags` includes two parts:
# - The "remote tags"
# - The "local tags"
#
# NOTE:
# - If a custom "remote tags git repo" configured in "Settings", it will also load that instead.
# - The "local tags" will override the “remote tags" based on the "tag file name".
#

# Load "remote tags" first
load_remote_tag_files_from_git_repo()

# TODO - Remove the support to "local example tag" folder.
# if len(list(load_file_paths(EXT_TAGS_DIR))) == 0:
#     copy_example_tags()

# Export "ALL" the tag files
export_tag_file_path_list_to_file()

# endregion

