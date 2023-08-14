# 本地标签文件夹 | Local Prompt Tags Config Folder

## 中文说明

- 在使用【远程标签配置文件】的基础上，可以在`./tags_local`文件夹中自定义自己的标签配置文件。|
- 同【远程标签配置文件】一样，采用`YAML`文件格式，可以通过**子文件夹**进行分类和管理。
  - 具体可参考`./tags_remote`文件夹中的文件
- 所有的【远程标签配置文件】和【本地标签配置文件】都使用**文件名**为基本索引，因此务必保证**文件名**的唯一性。
  - 如果出现**重复文件名**，**【本地标签配置文件】**的加载优先级**更高**。
  - **注意**！！！可以利用这一特性，在**本地标签配置文件夹**中通过创建**相同文件名的空白文件**来清楚不需要的【远程标签配置文件】（例如：`十八禁.yml`）。
- **远程标签配置文件夹**中的文件在每一次 SD WebUI 启动过程中会被重置，因此，切莫修改以免丢失数据！！

## Annotation in English

- With the usage of [Remote Tags Config Files], you can customize your own "Tag Config Files" inside the folder `./tags_local`.
- The same as [Remote Tags Config Files], it uses `YAML` as the file format, and also supports to use **sub folders** to manage the files.
- All [Remote / Local Tags Config Files] are using **filename** to help build the **unified index**. So that please be sure to keep the **filename** of every file unique to avoid any unexpected consequence.
  - If sharing **the same filename**, the "**Local** Tag file" will override the "**Remote** one".
  - **NOTICE**!!! This special rule could be utilized to help exclude certain unused "Remote Tag files". For example, you could create an **EMPTY** `xxx.yml` file to avoid the displaying of `xxx` in your SD WebUI.
- By default,  [Remote Tags Config Folder] is read-only. The contents inside will be reset every time launching SD WebUI.
