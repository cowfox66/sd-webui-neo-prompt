
from pathlib import Path
from typing import List
import random
import re
import yaml
import copy
import gradio

import modules.scripts as scripts
from modules.scripts import AlwaysVisible, basedir
from modules import shared
from scripts.setup import EXT_TAGS_DIR, load_file_paths, export_tag_file_path_list_to_file

# ----------------------------------
# region Global Variables

# "Prompt type definition" in `StableDiffusionProcessing`.
#
# Prompt Types:
#   - Normal Prompt
#   - Negative Prompt
#   - Hires Prompt
#   - Hires Negative Prompt
#
# Entry values:
#   - Prompt List Attribute Name
#   - Prompt Entry Attribute Name
#   - Prompt Parameter Name
prompt_type_definitions = [
    ['all_prompts', 'prompt', 'Original Prompt'],
    ['all_negative_prompts', 'negative_prompt', 'Original Negative Prompt'],
    ['all_hr_prompts', 'hr_prompt', 'Original Prompt (Hires)'],
    ['all_hr_negative_prompts', 'hr_negative_prompt',
        'Original Negative Prompt (Hires)'],
]

# endregion

# ----------------------------------
# region Extension Definition


class PromptSelectorExtensionScript(scripts.Script):

    # Tags
    #
    # Key - Tag path
    tags = {}

    def __init__(self):
        super().__init__()

        # Parse all tags
        self.tags = self._parse_tags()

    # ----------------------------------
    # region UI Configs

    def title(self):
        """Extension title in menu UI
        """
        return "NeoPrompt"

    def show(self, is_img2img):
        """Decide to show menu in txt2img or img2img
        """
        return scripts.AlwaysVisible

    def ui(self, is_img2img):
        """Setup menu ui detail
        """
        # Decide the "UI Element ID" for "txt2img" or "img2img"
        reload_button_element_id = 'img2img_neo-prompt-reload-button' if is_img2img else 'txt2img_neo-prompt-reload-button'

        # Define a "Reload" button so that it can help trigger a "python" level of action.
        reload_button = self._define_reload_button(reload_button_element_id)

        return [reload_button]

    # endregion

    # ----------------------------------
    # region Process

    def process(self, sd_processing_obj, *args):
        """Callback - process

        Steps:
        - Decode the "random functions" to the real "prompts".

        Parameters
        ----------
        sd_processing_obj : StableDiffusionProcessing
            The object contains processing parameters of SD WebUI.
        """

        #
        self._process_prompts(sd_processing_obj)

    # endregion

    # ----------------------------------
    # region Private - UI

    def _define_reload_button(self, element_id):
        #
        reload_button = gradio.Button(
            '🔄', variant='secondary', elem_id=element_id, visible=False)
        reload_button.style(size='sm')

        def reload():
            print('--[Neo Prompt]-> Reload Prompt Tags')
            self.tags = self._parse_tags()
            # Re-prep the "tag file paths" temp file
            export_tag_file_path_list_to_file()
        reload_button.click(fn=reload)

        return reload_button

    # endregion

    # ----------------------------------
    # region Private - Decode Prompt

    def _pick_prompt_tags(self, tag_path: str, target_tag_count: int = 1) -> List[str]:
        """Randomly pick the prompt tags based on the passing "target count".

        Parameters
        ----------
        tag_path : str
            The "Tag Path" to locate the "Tag" values.
        target_tag_count : int, optional
            The target count of tags to pick, by default 1

        Returns
        -------
        List[str]
            The list of picked tags.
        """
        # Try to locate the "tag" value
        keys = tag_path.split(':')
        tag_data = copy.deepcopy(self.tags)
        for index in range(0, len(keys)):
            tag_data = tag_data[keys[index]]

        #
        if type(tag_data) == list and len(tag_data) > 0:
            # Return random elements from a list
            return random.sample(tag_data, target_tag_count)

        if type(tag_data) == str:
            return [tag_data]

        if type(tag_data) == dict and len(tag_data.keys()) > 0:
            # Return random elements from a dict
            # Cannot exceed the max length of the elements.
            tag_value_length = len(tag_data.keys())
            valid_target_tag_count = target_tag_count if target_tag_count < tag_value_length else tag_value_length
            random_keys = random.sample(
                tag_data.keys(), valid_target_tag_count)
            return [tag_data[key] for key in random_keys]

        # Empty return
        return []

    def _decode_prompt_entry(self, prompt: str) -> str:
        """Decode 'prompt' if needed

        Decoding Rules:
        - Random function - Randomly select tags based on the passing "tag path reference".
            - Format: @{num|min-max}$${tag_path}@
            - The path `{num|min-max}$$` can be skipped - default to `1`
            - If `min-max` defined, pick a random number between `min` and `max`

        NOTE:
            - The "decoding" process can be run "recursively".
                - For example, the "decoded" tag value still has '@'.
            - In order to avoid infinite loop, it limits to "5" levels.

        Parameters
        ----------
        prompt : str
            The passing prompt str.

        Returns
        -------
        str
            The decoded prompt str.
        """
        # Decoding Regex rule
        decode_regex_rule = r'(@((?P<num>\d+(-\d+)?)\$\$)?(?P<ref>[^>]+?)@)'

        #
        recursion_round_limit = 10
        recursion_round = 0
        while recursion_round < recursion_round_limit:
            # End the recursion
            if not '@' in prompt:
                break

            # Try to decode all "@" cases
            for match in re.finditer(decode_regex_rule, prompt):
                matched_tag_template = match.group()

                # Process
                try:
                    # Firstly, try to get the target "count" of tags
                    try:
                        result = list(
                            map(lambda x: int(x), match.group('num').split('-')))
                        min_count = min(result)
                        max_count = max(result)
                    except Exception as e:
                        # No `min` and `max`, use `1` as default
                        min_count, max_count = 1, 1

                    # Get a random number of tags
                    target_tag_count = random.randint(min_count, max_count)
                    prompt_tags = self._pick_prompt_tags(
                        tag_path=match.group('ref'),
                        target_tag_count=target_tag_count
                    )
                    print('---> Decoded Prompt Tags: ', prompt_tags)

                    # Replace the decoded "prompt tags", use `, ` to separated.
                    prompt = prompt.replace(
                        matched_tag_template, ', '.join(prompt_tags), 1)
                except Exception as e:
                    # Error, just remove the matched template.
                    prompt = prompt.replace(matched_tag_template, '', 1)

            # Add count
            recursion_round += 1

        #
        return prompt

    def _decode_prompt_list(self, prompt_list: List[str]) -> List[str]:
        #
        updated_prompt_list = []
        # Flag - if required "decoding"
        decoding_required = False

        for prompt in prompt_list:
            #
            if '@' not in prompt:
                # No need to decode
                updated_prompt_list.append(prompt)
                continue

            # Decode the prompt
            decoding_required = True
            updated_prompt_list.append(self._decode_prompt_entry(prompt))

        #
        return updated_prompt_list, decoding_required

    def _process_prompts(self, sd_processing_obj):
        # Loop all "prompt types"
        for [prompt_list_attr_name, prompt_attr_name, prompt_param_name] in prompt_type_definitions:
            # Get prompt values
            prompt_list = getattr(
                sd_processing_obj, prompt_list_attr_name, None)
            # prompt = getattr(sd_processing_obj, prompt_attr_name, None)

            #
            if type(prompt_list) == list and len(prompt_list) > 0:
                # Decode the prompt if needed
                updated_prompt_list, decoding_required = self._decode_prompt_list(
                    prompt_list)

                # Check if need to update `sd_processing_obj`
                if decoding_required:
                    setattr(sd_processing_obj, prompt_list_attr_name,
                            updated_prompt_list)
                    # Also update the "current entry" - use the "first" element
                    setattr(sd_processing_obj, prompt_attr_name,
                            updated_prompt_list[0])

            # Check if need to "save original prompt to png info".
            if shared.opts.neo_prompt_enable_save_raw_prompt_to_png_info == True and decoding_required:
                sd_processing_obj.extra_generation_params.update(
                    {prompt_param_name: ' '.join(
                        prompt_list).replace('\n', ' ')}
                )

    # endregion

    # ----------------------------------
    # region Private Method

    def _parse_tags(self):
        tags = {}

        # Loop each "tag file"
        for filepath in load_file_paths(EXT_TAGS_DIR):
            with open(filepath, "r", encoding="utf-8") as infile:
                tag_contents_in_yaml = yaml.safe_load(infile)

                # Add "tags"
                # - Use "filename" as the "key"
                tags[filepath.stem] = tag_contents_in_yaml

        return tags

    # endregion

# endregion
