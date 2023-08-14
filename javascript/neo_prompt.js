// #region -> UI Element Builder <-
// ----------

// The "default CSS class" SD WebUI uses
const sdWebUiDefaultCssClass = 'svelte-1g805jl'

const sdWebUiMenuPageTypes = {
  txt2img: 'txt2img',
  img2img: 'img2img',
}

/**
 * SD WebUI Element Types
 *
 * Working with `sdWebUiMenuTypes` to get the real
 *  UI element for diff. pages, like `txt2img` page.
 * For example, for `txt2img` page, add `txt2img_` prefix.
 */
const sdWebUiElementTypes = {
  topPromptRowId: 'toprow',
  topPromptRowLeftPromptColumnId: 'prompt_container',
  promptTextareaId: 'prompt',
  negativePromptTextareaId: 'neg_prompt',
  topPromptRowRightActionColumnId: 'actions_column',
}

/**
 * Custom UI Element Builder
 */
class NeoUiElementBuilder {

  // #region -> Gradio UI Template <-
  // ----------

  /**
   * Create a "button" element by cloning existing Gradio elements.
   *
   * @param {string} textContent The "text content" of a DOM element
   * @param {string} size The button size: `sm`, `lg`
   * @param {string} color The button color styles: `primary`, `secondary`
   * @returns
   */
  static gradioBaseButtonDom(textContent, { size = 'sm', color = 'primary' }) {
    //
    const targetGradioButtonDomId = 'txt2img_generate'

    const button = gradioApp().getElementById(targetGradioButtonDomId).cloneNode()
    // Do some cleaning
    button.id = ''
    button.classList.remove('gr-button-lg', 'gr-button-primary', 'lg', 'primary')

    // Customize it
    button.classList.add(
      // gradio 3.16
      `gr-button-${size}`,
      `gr-button-${color}`,
      // gradio 3.22
      size,
      color
    )
    button.textContent = textContent

    return button
  }

  /**
   * Create a "div area" element by cloning existing Gradio elements.
   *
   * @param {string} id
   * @returns
   */
  static gradioBaseAreaContainerDom(id = undefined) {
    //
    const targetGradioAreaContainerElementId = 'txt2img_results'

    const areaContainer = gradioApp().getElementById(targetGradioAreaContainerElementId).cloneNode()
    areaContainer.id = id
    areaContainer.style.gap = 0
    areaContainer.style.display = 'none'

    return areaContainer
  }

  /**
   * Create a base "dropdown" element.
   *
   * @param {string} id
   * @param {object} options The dropdown options, use `key` as the "option caption"
   * @param {func} onChange The "onChange" callback
   * @returns
   */
  static gradioBaseDropDownDom(id, options, { onChange }) {
    const select = document.createElement('select')
    select.id = id

    // Add stylings
    // gradio 3.16
    select.classList.add('gr-box', 'gr-input')

    // gradio 3.22
    select.style.color = 'var(--body-text-color)'
    select.style.backgroundColor = 'var(--input-background-fill)'
    select.style.borderColor = 'var(--block-border-color)'
    select.style.borderRadius = 'var(--block-radius)'
    select.style.margin = '2px'
    select.addEventListener('change', (event) => { onChange(event.target.value) })

    const none = ['空/Empty'] // Add a "empty" option
    none.concat(options).forEach((key) => {
      const option = document.createElement('option')
      option.value = key
      option.textContent = key
      select.appendChild(option)
    })

    return select
  }

  /**
   * Create a base "checkbox" element.
   *
   * @param {string} textContent
   * @param {func} onChange
   * @returns
   */
  static gradioBaseCheckboxDom(textContent, { onChange }) {
    const label = document.createElement('label')
    label.style.display = 'flex'
    label.style.alignItems = 'center'

    const checkbox = gradioApp().querySelector('input[type=checkbox]').cloneNode()
    checkbox.checked = false
    checkbox.addEventListener('change', (event) => {
      onChange(event.target.checked)
    })

    const span = document.createElement('span')
    span.style.marginLeft = 'var(--size-2, 8px)'
    span.textContent = textContent

    label.appendChild(checkbox)
    label.appendChild(span)

    return label
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Helper Func - UI <-
  // ----------

  static buildDomElementId(menuPageType, uiElementType) {
    return `${menuPageType}_${uiElementType}`
  }

  static createDom(domType, cssList = [], parentDom = undefined, innerHtml = undefined) {
    let domElement = document.createElement(domType)
    // Add CSS if needed
    if(Array.isArray(cssList)) {
      // setCss(domElement, cssList.join(' '))
      cssList.map((css) => domElement.classList.add(css))
    }
    // Add inner content if needed
    if (innerHtml) {
      domElement.innerHTML = innerHtml
    }

    // Add it to the "parent DOM" if needed
    if (parentDom) {
      parentDom.appendChild(domElement)
    }

    //
    return domElement
  }

  /**
   * Create a "tag button".
   *
   * NOTE:
   * - The "click event" supports both "left / right click"
   *  - "left click" - add to normal "prompt"
   *  - "right click" - add to "negative prompt"
   * - If `tagKeyPathPrefix` is available, the "tag button" is the "tag group button", used to support "random function"
   *
   * @param {string} tagValue
   * @param {string} tagKey
   * @param {string} tagKeyPathPrefix
   * @param {sdWebUiMenuPageTypes} menuPageType
   * @param {[string]} classList
   * @param {func} clickCallback
   * @param {string} color
   * @returns
   */
  static createTagButtonDom(tagValue, tagKey, tagKeyPathPrefix, menuPageType, classList, clickCallback, color = 'primary') {
    //
    const tagButton = NeoPromptUiElementBuilder.gradioBaseButtonDom(tagKey, { color })
    // tagButton.innerHTML = tagKey
    if (Array.isArray(classList)) {
      tagButton.classList.add(...classList)
    }

    // Decide the "tag value"
    // If `tagKeyPathPrefix` is not empty, it is for a "tag group button"
    if (tagKeyPathPrefix) {
      // For a "tag group button", use a "custom random function" as the value.
      tagButton.dataset.tagValue = `@${tagKeyPathPrefix}@`
    } else {
      // For a normal "tag button", just show the value.
      tagButton.dataset.tagValue = tagValue
    }

    // Add "click event" if available
    if (clickCallback) {
      tagButton.addEventListener('click', (e) => {
        e.preventDefault();
        //
        clickCallback(tagButton, menuPageType)
      })
      tagButton.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        //
        clickCallback(tagButton, menuPageType, true)
      })
    }

    //
    return tagButton
  }

  // ----------
  // #endregion

  // ///////////////////////////


}

// ----------
// #endregion

// ///////////////////////////

// #region -> Neo Prompt UI Element <-
// ----------

class NeoPromptUiElementBuilder extends NeoUiElementBuilder {

  TAG_PATH_FILE = 'tmp/neoPromptTagListPaths.txt'

  // #region -> Element ID & Class <-
  // ----------

  NEO_PROMPT_AREA_CONTAINER_ID = 'neo-prompt-container'
  NEO_PROMPT_TAB_CONTAINER_ID = 'neo-prompt-tab-container'
  NEO_PROMPT_TAB_NAV_ID = 'neo-prompt-tab-nav'
  NEO_PROMPT_TAB_CONTENT_CONTAINER_ID = 'neo-prompt-tab-content-container'

  NEO_PROMPT_TAG_NAV_BUTTON_CLASS = 'neo-prompt-tag-nav-button'
  NEO_PROMPT_TAG_BUTTON_CLASS = 'neo-prompt-tag-button'

  NEO_PROMPT_RELOAD_BUTTON_ID = 'neo-prompt-reload-button'
  NEO_PROMPT_CLEAR_PROMPT_BUTTON_ID = 'neo-prompt-clear-prompt-button'
  NEO_PROMPT_CLEAR_NEGATIVE_PROMPT_BUTTON_ID = 'neo-prompt-clear-negative-prompt-button'

  NEO_PROMPT_SELECTOR_CONTAINER_ID = 'neo-prompt-selector-container'
  NEO_PROMPT_SELECTOR_BUTTON_ID = 'neo-prompt-selector-button'

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Constructor <-
  // ----------

  constructor(yaml) {
    //
    super()

    //
    this.yaml = yaml

    // Tags
    this.tags = undefined
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Method - Init <-
  // ----------

  async init() {
    // Get the tag data
    this.tags = await this._parseTagFiles()

    // Init the DOMs on each "menu pages"
    Array.from([sdWebUiMenuPageTypes.txt2img, sdWebUiMenuPageTypes.img2img]).forEach((menuPageType) => {
      // Remove the existing DOMs if needed
      // Open Button Container
      const openButtonContainer = gradioApp()
      .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
        this.NEO_PROMPT_SELECTOR_CONTAINER_ID))
      if (openButtonContainer != null) {
        openButtonContainer.remove()
      }

      // Main Container
      const mainContainerArea = gradioApp()
      .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
        this.NEO_PROMPT_AREA_CONTAINER_ID))
      if (mainContainerArea != null) {
        mainContainerArea.remove()
      }
    })

    // Add it below the "prompt" row for both `txt2img` and `img2img` pages.
    this._renderUi(sdWebUiMenuPageTypes.txt2img)
    this._renderUi(sdWebUiMenuPageTypes.img2img)
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Private - Init <-
  // ----------

  async _readFile(filepath) {
    const response = await fetch(`file=${filepath}?${new Date().getTime()}`);

    return await response.text();
  }

  async _parseTagFiles() {
    // Read the contents for "tag file paths"
    const tagPathContentText = await this._readFile(this.TAG_PATH_FILE);

    // Guard
    if (tagPathContentText === '') { return {} }

    //
    const pathList = tagPathContentText.split(/\r\n|\n/)

    // Loop into the "file paths" and load "tags"
    const tags = {}
    for (const path of pathList) {
      // Get the "filename" as the `key`
      const filename = path.split('/').pop().split('.').slice(0, -1).join('.')

      // Guard
      if (filename.length === 0) {
        continue
      }

      const tagFileContent = await this._readFile(path)
      // Try to load YAML content
      try {
        const tagData = this.yaml.load(tagFileContent.trim());
        if (tagData) {
          tags[filename] = tagData
        } else {
          // Assign an "empty" tag group so that it can be ignored later
          tags[filename] = {}
        }
      } catch (e) {
        console.log(e);
        // Assign an "empty" tag group so that it can be ignored later
        tags[filename] = {}
      }
      // this.yaml.loadAll(tagFileContent, function (tagData) {
      //   tags[filename] = tagData
      // })
    }

    return tags
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Private - UI <-
  // ----------

  /**
   * Build UI for the target menu pages, like `txt2img` or `img2img`.
   *
   * @param {sdWebUiMenuPageTypes} menuPageType Target page the UI added to
   * @returns
   */
  _renderUi(menuPageType) {
    // Create the "main container"
    const mainContainerDom = NeoPromptUiElementBuilder.gradioBaseAreaContainerDom(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_AREA_CONTAINER_ID))
    mainContainerDom.appendChild(this._renderActionRow(menuPageType))
    mainContainerDom.appendChild(NeoPromptUiElementBuilder.createDom('hr', ['neo-divider']))
    mainContainerDom.appendChild(this._renderTagTabContainer(menuPageType))
    // Add it below the "prompt" row
    gradioApp()
      .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
        sdWebUiElementTypes.topPromptRowId))
      .after(mainContainerDom)

    // Create the "open button"
    const openButton = NeoPromptUiElementBuilder.gradioBaseButtonDom('📋提示词选择器 | Prompt Selector', { size: 'sm', color: 'secondary' })
    openButton.classList.add(...['neo-prompt-selector-button', 'neo-button'])
    openButton.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_SELECTOR_BUTTON_ID)
    openButton.addEventListener('click', () => {
      mainContainerDom.style.display = mainContainerDom.style.display === 'flex' ? 'none' : 'flex'
    })
    NeoPromptUiElementBuilder.createDom('span', ['neo-button-tooltip'], openButton, `显示/影藏【提示词选择器】面板 | Show/Hide [Prompt Selector] Panel`)

    // Add it to "Actions Column"
    const container = NeoPromptUiElementBuilder.createDom('div', ['neo-prompt-selector-container'])
    container.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_SELECTOR_CONTAINER_ID)
    container.appendChild(openButton)
    gradioApp()
      .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
        sdWebUiElementTypes.topPromptRowRightActionColumnId))
      .appendChild(container)
  }

  _renderActionRow(menuPageType) {
    // Action Row
    const actionRow = document.createElement('div')
    actionRow.classList.add('neo-action-row')

    // Button - Reload
    const reloadButton = NeoPromptUiElementBuilder.gradioBaseButtonDom('🔄', { size: 'lg', color: 'secondary' })
    reloadButton.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_RELOAD_BUTTON_ID)
    reloadButton.addEventListener('click', async () => {
      await this.init()
    })

    // Button - Clear Prompt
    const clearPromptButton = NeoPromptUiElementBuilder.gradioBaseButtonDom('清空正面提示词 | Clear Prompt', { size: 'lg', color: 'secondary' })
    clearPromptButton.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_CLEAR_PROMPT_BUTTON_ID)
    clearPromptButton.addEventListener('click', async () => {
      this._clearPromptContent(menuPageType)
    })

    // Button - Clear Negative Prompt
    const clearNegativePromptButton = NeoPromptUiElementBuilder.gradioBaseButtonDom('清空负面提示词 | Clear Negative Prompt', { size: 'lg', color: 'secondary' })
    clearNegativePromptButton.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_CLEAR_NEGATIVE_PROMPT_BUTTON_ID)
    clearNegativePromptButton.addEventListener('click', async () => {
      this._clearPromptContent(menuPageType, true)
    })

    // Button - Info
    const infoButton = NeoPromptUiElementBuilder.gradioBaseButtonDom('ⓘ 教程 | Tutorials', { size: 'lg', color: 'secondary' })
    infoButton.classList.add(...['neo-prompt-info-button', 'neo-button'])
    infoButton.addEventListener('click', () => {
      mainContainerDom.style.display = mainContainerDom.style.display === 'flex' ? 'none' : 'flex'
    })
    NeoPromptUiElementBuilder.createDom('span', ['neo-button-tooltip'], infoButton, `查看【详细教程】<br> See detailed tutorials`)


    // Construct
    actionRow.appendChild(reloadButton)
    actionRow.appendChild(clearPromptButton)
    actionRow.appendChild(clearNegativePromptButton)
    actionRow.appendChild(infoButton)

    //
    return actionRow
  }

  _renderTagTabContainer(menuPageType) {
    //
    let tagTabContainerDom = document.createElement('div')
    tagTabContainerDom.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_CONTAINER_ID)
    tagTabContainerDom.classList.add(...['gradio-tabs'])

    let tagTabNavDom = document.createElement('div')
    tagTabNavDom.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_NAV_ID)
    tagTabNavDom.classList.add(...['tab-nav', 'neo-tab-nav', 'scroll-hide'])

    let tagTabContentContainerDom = document.createElement('div')
    tagTabContentContainerDom.id = NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_CONTENT_CONTAINER_ID)
    tagTabContentContainerDom.classList.add('tab-container')

    // Loop into "tag data" and build button for each tag
    let tagTabIndex = 0
    Object.keys(this.tags).forEach((key) => {
      //
      // Ignore the "empty" tag nav button
      const tagValue = this.tags[key]
      if (typeof tagValue === 'object' && Object.keys(tagValue).length === 0) {
        return
      }

      // Create "tag nav button"
      let tabNavButton = NeoPromptUiElementBuilder.createDom('button', [sdWebUiDefaultCssClass, 'neo-button'],tagTabNavDom,  key)
      // Add data - "index"
      tabNavButton.dataset.tabItemIndex = tagTabIndex
      // Add "click" event
      tabNavButton.addEventListener('click',(e)=>{
        this._clickTabNavButton(e.target, tagTabNavDom, tagTabContentContainerDom)
      })
      tagTabNavDom.appendChild(tabNavButton)

      // Create "tag content container" and add "tags"
      let tabContentContainer = NeoPromptUiElementBuilder.createDom('div', ['neo-tag-container', 'neo-hide'])
      this._renderTagButton(tagValue, key, '', tabContentContainer, menuPageType)
      tagTabContentContainerDom.appendChild(tabContentContainer)

      // Make the first "tab" selected by default
      if(tagTabIndex === 0){
        tabNavButton.classList.add('selected')
        tabContentContainer.classList.remove('neo-hide')
      }

      // Increase index
      tagTabIndex++
    })

    //
    tagTabContainerDom.appendChild(tagTabNavDom)
    tagTabContainerDom.appendChild(tagTabContentContainerDom)

    //
    return tagTabContainerDom
  }

  /**
   * Create "tag button" or "tag group" recursively.
   *
   * NOTE:
   * - A "tag value" can be 2 types:
   *  - `string` - an atomic "tag button"
   *  - `object` - a "tag group" that can include a set of "tag buttons"
   * - For a "tag group", it will also have a "tag group button" which can be used to add a "random func" of the "tag group" to randomly pick a tag within it.
   *
   * @param {string|object} tagValue
   * @param {string} tagKey
   * @param {string} tagKeyPathPrefix The "tag key path prefix" used to help build the "random func" of the "tag group button."
   * @param {string} parentDom
   * @param {string} menuPageType
   */
  _renderTagButton(tagValue, tagKey, tagKeyPathPrefix, parentDom, menuPageType) {
    // Guard
    if (tagValue === null || tagValue === undefined || parentDom === null || parentDom === undefined) {
      return
    }

    // Check the type of "tag value"
    if (typeof tagValue === 'object') {
      // Loop into the object
      Object.keys(tagValue).map((key) => {
        /*
          Several cases for "tag value"
          - If it is another "object", create a new "tag group" and then loop in
          - If it is "string", just loop into
         */
        const nextLevelTagValue = tagValue[key]
        const updatedTagKeyPathPrefix = tagKeyPathPrefix && tagKeyPathPrefix.length > 0 ? `${tagKeyPathPrefix}:${key}` : `${tagKey}:${key}`
        let parentContainer = parentDom
        if (typeof nextLevelTagValue === 'object') {
          // Create a new "tag group"
          const tagGroupContainer = NeoPromptUiElementBuilder.createDom('div', ['neo-tag-container', 'neo-tag-group-container'])
          const tagGroupButton = NeoPromptUiElementBuilder.createTagButtonDom(nextLevelTagValue, key, updatedTagKeyPathPrefix, menuPageType, [sdWebUiDefaultCssClass, 'neo-tag-group-button', 'neo-button'],
          this._toggleTagSelectionForPrompt.bind(this), 'primary'
          )
          // Add a "tooltip" for the button
          const tagGroupButtonTooltip = `@${updatedTagKeyPathPrefix}@<br><br>(随机选择组内提示词 | Randomly pick one prompt within group)`
          NeoPromptUiElementBuilder.createDom('span', ['neo-button-tooltip'], tagGroupButton, tagGroupButtonTooltip)
          // Container to include "tab buttons"
          const tagGroupTagContainer = NeoPromptUiElementBuilder.createDom('div', ['neo-tag-container'])
          // Add it to "parent dom"
          tagGroupContainer.appendChild(tagGroupButton)
          tagGroupContainer.appendChild(tagGroupTagContainer)
          parentDom.appendChild(tagGroupContainer)

          // Use the new "tag group container" as "parent"
          parentContainer = tagGroupTagContainer
        }

        //
        this._renderTagButton(nextLevelTagValue, key, updatedTagKeyPathPrefix, parentContainer, menuPageType)
      })
    } else if (typeof tagValue === 'string') {
      // Directly create a "tag button"
      const tagButton = NeoPromptUiElementBuilder.createTagButtonDom(tagValue, tagKey, undefined, menuPageType, [sdWebUiDefaultCssClass, 'neo-tag-button', 'neo-button'],
      this._toggleTagSelectionForPrompt.bind(this), 'secondary'
      )
      const tagButtonTooltip = NeoPromptUiElementBuilder.createDom('span', ['neo-button-tooltip'], tagButton, tagValue)

      // Add it to "parent dom"
      parentDom.appendChild(tagButton)
    }
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Private - Actions <-
  // ----------

  _clearPromptContent(menuPageType, toNegative = false) {
    //
    const promptAreaElementId = toNegative ? sdWebUiElementTypes.negativePromptTextareaId : sdWebUiElementTypes.promptTextareaId
    const promptAreaElement = gradioApp()
      .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
        promptAreaElementId)).querySelector('textarea')

    //
    promptAreaElement.value = ''
    updateInput(promptAreaElement)

    // Also clear the "tag selection indicators"
    this._clearTagSelection(menuPageType, toNegative)
  }

  _clickTabNavButton(tagTabButton, tagTabNavDom, tagTabContentContainerDom) {
    //
    const tabNavButtonList = tagTabNavDom.children
    const tabGroupContainerList = tagTabContentContainerDom.children

    //
    const tagTabIndex = Number(tagTabButton.dataset.tabItemIndex)
    Array.from(tabNavButtonList).forEach((tabNavButton, index) => {
      if (index === tagTabIndex) {
        // Become "active"
        tabNavButton.classList.add('selected')
        tabGroupContainerList[index].classList.remove('neo-hide')
      } else {
        // Hide others
        tabNavButton.classList.remove('selected')
        tabGroupContainerList[index].classList.add('neo-hide')
      }
    })
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Private - Tag Actions <-
  // ----------

  /**
   * Add or remove "tag" from the "prompt" area.
   *
   * NOTE:
   * - Only add the "tag" if "prompt area" does not have it.
   * - If the "prompt area" includes multiple matches, it removes them all.
   * - It uses `active / negative-active` class to help determine if the "tag" has been added before.
   *
   * @param {*} tagButtonDom
   * @param {*} menuPageType
   * @param {*} toNegative
   */
  _toggleTagSelectionForPrompt(tagButtonDom, menuPageType, toNegative = false) {
    //
    const promptAreaElementId = toNegative ? sdWebUiElementTypes.negativePromptTextareaId : sdWebUiElementTypes.promptTextareaId
    const promptAreaElement = gradioApp()
      .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
        promptAreaElementId)).querySelector('textarea')

    // Use "active" class to help indicate of the "tag" has been added already.
    const activeClass = toNegative ? 'negative-active' : 'active'
    const tagValue = tagButtonDom.dataset.tagValue
    if (tagButtonDom.classList.contains(activeClass)) {
      // Remove the "tag"
      if (promptAreaElement.value.trimStart().startsWith(tagValue)) {
        // Deal with the case that "tag" showing as the first item
        const matched = promptAreaElement.value.match(new RegExp(`${tagValue.replace(/[-\/\\^$*+?.()|\[\]{}]/g, '\\$&') },*`))
        promptAreaElement.value = promptAreaElement.value.replace(matched[0], '').trimStart()
      }
      // Replace "all" cases
      promptAreaElement.value = promptAreaElement.value.replaceAll(`, ${tagValue}`, '')
      updateInput(promptAreaElement)
    } else {
      // Add the "tag" to the "end"
      if (promptAreaElement.value.trim() === '') {
        promptAreaElement.value = tagValue
      } else if (promptAreaElement.value.trim().endsWith(',')) {
        promptAreaElement.value += ` ${tagValue}`
      } else {
        promptAreaElement.value += `, ${tagValue}`
      }
      updateInput(promptAreaElement)
    }

    // Flip the "active" class as well
    tagButtonDom.classList.toggle(activeClass)

    // Also refresh the indicators on the "tab buttons"
    this._refreshTagTabNavButtonIndicators(menuPageType, toNegative)
  }

  _refreshTagTabNavButtonIndicators(menuPageType, toNegative = false) {
    //
    const tagTabNavDom = gradioApp()
    .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_NAV_ID))
    const tagTabContentContainerDom = gradioApp()
    .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_CONTENT_CONTAINER_ID))

    const activeTagGroupClass = toNegative ? 'negative-active' : 'active'
    const tagTabNavButtonDomList = tagTabNavDom.children
    const tabGroupContainerDomList = tagTabContentContainerDom.children

    //
    Array.from(tagTabNavButtonDomList).forEach((tabNavButton, tabNavIndex) => {
      const tabGroupContainerDom = tabGroupContainerDomList[tabNavIndex]
      if (tabGroupContainerDom.querySelectorAll(`.neo-button.${activeTagGroupClass}`).length > 0) {
        //
        tabNavButton.classList.add(activeTagGroupClass)
      } else {
        //
        tabNavButton.classList.remove(activeTagGroupClass)
      }
    })
  }

  // ----------
  // #endregion

  // ///////////////////////////

  // #region -> Private <-
  // ----------

  _clearTagSelection(menuPageType, toNegative = false) {
    //
    const tagTabNavDom = gradioApp()
    .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_NAV_ID))
    const tagTabContentContainerDom = gradioApp()
    .getElementById(NeoPromptUiElementBuilder.buildDomElementId(menuPageType,
      this.NEO_PROMPT_TAB_CONTENT_CONTAINER_ID))

    //
    const activeClassToRemoved = toNegative ? 'negative-active' : 'active'
    const tagTabNavButtonDomList = tagTabNavDom.children
    const activeTagButtonDomList = tagTabContentContainerDom.querySelectorAll(`.neo-button.${activeClassToRemoved}`)
    Array.from(tagTabNavButtonDomList).forEach((button) => {
      button.classList.remove(activeClassToRemoved)
    })
    Array.from(activeTagButtonDomList).forEach((button) => {
      button.classList.remove(activeClassToRemoved)
    })
  }

  // ----------
  // #endregion

  // ///////////////////////////

}

// ----------
// #endregion

// ///////////////////////////

// #region -> Callback - UI Loaded <-
// ----------

onUiLoaded(async () => {
  const neoPromptSelector = new NeoPromptUiElementBuilder(window.jsyaml)
  // Init
  await neoPromptSelector.init()
})

// ----------
// #endregion

// ///////////////////////////

