from modules import script_callbacks, shared

# ----------------------------------
# region Setting Options

def on_ui_settings():
    shared.opts.add_option("neo_prompt_enable_save_raw_prompt_to_png_info",
                           shared.OptionInfo(False, "保存原始提示词到图片信息/Save original prompt to png info",
                                             section=("neo_prompt", "Neo Prompt")))

# endregion

script_callbacks.on_ui_settings(on_ui_settings)
