使用pnpm工具链进行nodejs库的安装/执行命令

尽量使用shadcn的组件来构建软件界面，视觉要现代化、响应式、苹果风。安装shadcn组件时要用`shadcn@latest`而不是`shadcn-ui@latest`，比如：`pnpx shadcn@latest add button`，需要添加组件时，请注意观察src/components/ui目录中是否已经有了相应组件的文件，避免重复安装。

我们在windows下开发，请在执行命令的时候使用powershell中能够执行的命令

请在agent模式下执行任务时，先将任务的计划打印出来review，并向我询问可能没有说清楚的地方, 并且一次性问完（但我可能也想不清楚，所以请提供你觉得可能的方案），由我confirm后再开始执行。

文档可能和我的需求有冲突，请指出有冲突的地方并向我确认。如果有模糊的地方也可以向我确认，并给出你的建议。

使用typescript interface语法来定义领域模型

我们采用serverless的架构，使用supabase，大部分业务逻辑使用browser端的supabase client去查询，我们supabase的project_id为：fvrudcizzghxjkcbpvrn

数据库的模型尽量和代码中的模型一致，代码可以简化一点，数据库的数据查出来之后字段名转成驼峰就可以直接使用，但是还是要在类型定义中分开这两种模型，只不过这两种模型可以通过类型函数相互转化生成，而不是写两份。

我没什么耐性，请输出简练的回答和问题

请不要添加无关内容，特别是我没有提到的需求点，不要做多余的改进。

Commit message请使用中文

# FileStructure
src/app/demo下的内容都是静态页面，用于UI设计而已
src/lib/services下存放业务逻辑
src/types下存放模型定义
src/components/ui下的内容是shadcn的组件，不要修改它
src/components/下其它路径可以存放一些可复用的组件
supabase/下放置一些管理在supabase上的代码

# Database
- 不要设置外键、触发器、supabase函数，这些逻辑要在代码中实现。
- 数据库字段名用下划线风格，如`user_id`，代码中使用驼峰风格，如`userId`。

# API
- 采用Restful风格设计
- error response的响应格式为 HTTP Status Code + { error: string, message: string }, error为内部自定义错误类型

# Other
及时在doc/notes中创建你的改动笔记，内容包括：
1. 问题背景
2. 方案思考
3. 代码实现
4. 遇到的问题与解决方案，下次应该注意什么
5. 与用户沟通的经验