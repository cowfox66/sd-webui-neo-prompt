from modules import script_callbacks, shared
import gradio

# ----------------------------------
# region Constants - Configs

SETTINGS_DEFAULT_REMOTE_TAG_REPO_URL = 'https://github.com/cowfox66/sd-webui-neo-prompt-tag-configs.git'
SETTINGS_DEFAULT_REMOTE_TAG_REPO_BRANCH = 'main'

# endregion

# ----------------------------------
# region Setting Options


def on_ui_settings():
    # Section
    section = ('neo_prompt', "Neo Prompt | 提示词选择器")

    #
    shared.opts.add_option("neo_prompt_enable_save_raw_prompt_to_png_info",
                           shared.OptionInfo(
                               default=False,
                               label="保存原始提示词到图片信息 | Save original prompt to png info",
                               component=gradio.Checkbox,
                               section=section
                           ))
    shared.opts.add_option("neo_prompt_tag_repo_url",
                           shared.OptionInfo(
                               default=SETTINGS_DEFAULT_REMOTE_TAG_REPO_URL,
                               label="标签文件的 git 仓库网址 | URL for tag config files' git repository",
                               component=gradio.Textbox,
                               #    { 'info': '通过远程 git 仓库获取默认标签配置文件 | Get default "tag config files" from remote Git repo' },
                               section=section
                           ))
    shared.opts.add_option("neo_prompt_tag_repo_branch_name",
                           shared.OptionInfo(
                               default=SETTINGS_DEFAULT_REMOTE_TAG_REPO_BRANCH,
                               label="特定分支名 | Specific branch name",
                               component=gradio.Textbox,
                               section=section
                           ))

# endregion


script_callbacks.on_ui_settings(on_ui_settings)
