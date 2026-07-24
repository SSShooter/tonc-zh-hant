# E. 通过编辑器构建

<!-- toc -->

:::warning 本章可能已过时

这部分可能需要大修，且其中一些建议的工具或做法可能已被弃用。

:::

## 简介 {#sec-intro}

尽管 makefile 很好，它们仍然是命令行驱动的过程，带着附属于它的一切问题。如果你在 Unix/Linux 环境下，那些问题通常相当小，但在纯 Windows 系统上我们得在类似 DOS 的 Windows 命令提示符里工作，它有一些非常糟糕的缺陷，能把你的生活变得悲惨：不仅翻找目录结构没意思，非直观的复制/粘贴文本方式，以及无法用方向键在命令中移动去修正打字错误，也都有点烦人。另一件会很快磨掉你耐心的事，是无法滚动浏览那串飞过你小小 Windows 命令提示符、像一群狂暴大象冲进瓷器店般的编译错误列表。而你*知道*，只要能找到列表开头的那个并修好它，一切就都好了。现在，你可以用 MSYS 窗口来绕过 Windows 命令提示符的严重不足。不过你仍然需要学会如何使用 Bash shell 才能物尽其用。而且你仍然会为命令行窗口多开一个窗口。

幸运的是，有办法彻底避开任何命令行窗口。除非你在使用像标准 Windows 记事本那样糟糕的东西，否则你很有机会能直接从你的代码编辑器运行 make 或任何其他工具。在这种情况下，我想看看其中三个：

-   [ConTEXT](https://archive.org/details/tucows_349269_ConTEXT)
-   [Programmer's Notepad](http://www.pnotepad.org/)。是的，就是随 devkitARM 一起来的那个。
-   Microsoft Visual C++

ConTEXT 和 PN 基本上是高级形式的文本编辑器，这类编辑器有不少。它们大多允许标签页文件、搜索替换、可定制的语法高亮、宏和 shell 命令。如果你还在用 Windows 记事本做，嗯，*任何事*，你欠自己一个下载更先进文本编辑器并用它替代的礼。那个被美化的编辑框，也就是记事本，除非别无选择，否则不该被允许靠近任何普通文本文件。你能搜到的每一个程序员编辑器都可能在方方面面优于记事本，有些甚至允许你替换掉真正的 notepad.exe。虽然自 Windows XP Service Pack 2 以来这变得更难了，因为系统文件保护会不断让它复活，但在我看来，把它永远击落是值得努力的。

咳，抱歉。有时我想起标准 Windows 工具有多烂时会稍微收不住。总之，进入正题。在本章剩余部分，我会展示如何让 ConTEXT 和 PN 为当前打开的 makefile 运行 make。本章最后一节会涵盖为这项工作设置 MSVC。如果你对这些都不感兴趣，随时可以跳到[下一章](first.html)。

## 通过 ConTEXT 构建 {#sec-context}

[ConTEXT](https://archive.org/details/tucows_349269_ConTEXT) 是一个轻量的免费文本编辑器，我把大部分纯文本编辑都用它。它能做程序员编辑器该做的一切，它有记事本替换工具，还有一个能让我把代码导出为 html 格式的工具，这对写 tonc 确实非常有用。它确实有一两个小缺陷，但没有哪个特别让我介意。

shell 命令管理器可以在 选项-\>环境选项...-\>执行键（@fig:ctxt-make）下找到，它基于扩展名工作。在我的情况中，那是 .mak。ConTEXT 允许每个扩展名有 4 个命令，我用 F9 来 make 'build' 目标，F10 来 clean 操作。

F9 : make build

-   **Execute:** `make.exe`（必要时加上完整路径）
-   **Parameters:** `-f %f build`
-   **Capture output:** yes

F10 : make clean

-   **Execute:** `make.exe`
-   **Parameters:** `-f %f clean`
-   **Capture output:** yes

请确保 devkitARM 和 msys 的 bin 目录在系统路径中，否则 ConTEXT 会找不到 make.exe 或编译器工具。

<div class="cpt" style="width:464px">

<img src="img/setup/ctxt_make.png" 
  alt="context 命令" id="fig:ctxt-make"><br>
<b>{*@fig:ctxt-make}</b>: ConTEXT 的 shell 命令。
</div>

## 通过 Programmer's Notepad 2 构建 {#sec-pn2}

在它开始随 devkitARM 一起出现之前，我从来不知道 PN，但它看起来真的很好。我自己没怎么用过，只是因为我仍满足于 ConTEXT。话虽如此，PN 可能是更好的编辑器，而且既然它可能随工具链一起，你很可能已经有了它。

尽管有这些好处，我得说：默认情况下，它似乎忽略桌面配色方案。这可能听起来不是什么大事，但因为背景色默认是刺眼的白，我 literally 连看它超过一分钟都不行。当我第一次试图在选项里修这个时，似乎你只能按类型逐个改，而非全局改。我花了一阵子才弄明白我一直找错了地方 <kbd>:P</kbd>。看 工具-\>选项-\>样式，不是 工具-\>选项-\>方案。

要为 makefile 添加命令，去 工具-\>选项-\>工具（@fig:pn-make），选择'Make'。然后为'make build'和'make clean'添加 2 个命令：

F9 : make build

  -   **Name:** `mk build`
  -   **Command:** `E:\dev\devkitPro\msys\bin\make.exe`
  -   **Folder:** `%d`（makefile 的目录）
  -   **Parameters:** `-f %f build`
  -   **Shortcut:** F9

F10 : make clean

  -   **Name:** `mk clean`
  -   **Command:** `E:\dev\devkitPro\msys\bin\make.exe`
  -   **Folder:** `%d`（makefile 的目录）
  -   **Parameters:** `-f %f clean`
  -   **Shortcut:** F10

名字和快捷键当然可以不同；其余应如上。有可能你得确保 .mak 扩展名绑定到'Make'方案。

<div class="cpt" style="width:392px">

<img src="img/setup/pn_make.png" 
  alt="PN 命令" id="fig:pn-make"><br>
<b>*@fig:pn-make</b>: Programmer's Notepad 的 shell
命令。
</div>

通过给编辑器添加 make 命令，你应该能运行每个 tonc 演示的 makefile。如果你遇到问题，你大概是忘了在某处设置路径。

## 通过 MS Visual C++ 6 构建 {#sec-msvc6}

我相信你们很多人都以这样那样的方式搞到了某个版本的 Visual Studio，官方的、通过学校或……其他方式。MSVC 实际上用自己一种叫 NMAKE 的 makefile 和构建工具，但我们要忽略那个，改用 GNU 的 make。本节的说明对版本 5 和 6 有效，但我不确定更新的版本。据我所知，它们在那些版本里改了很多，所以如果你有那些版本，你可能得自己挖掘一下。我知道也有能经由向导创建 GBA 项目的插件，但同样你得自己找。

### VC 与 makefile 项目 {#ssec-msvc-make}

#### Phase 1：设置路径

你需要做的第一件事，如果你还没做的话，是设置路径，让 Visual C 能找到这些工具。打开 \[工具/选项\] 对话框，进入 \[目录\] 选项卡，然后从 \[显示目录为\] 框中选择 \[可执行文件\] 列表（见下面的 @fig:msvc-dirs）。现在你需要添加 MSYS 和 dkARM 的 bin 目录。你也可以把这些目录设置到 autoexec.bat。devkitARM 目录也可以在 makefile 本身里设置，但既然我用 4 台不同的电脑写 Tonc，我偏好不这么做。

<div class="cpt" style="width:424px">

<img src="img/setup/msvc_dirs.png" id="fig:msvc-dirs"
  alt="把 DKA 路径加入可执行文件列表"><br>
<b>*@fig:msvc-dirs</b>: 把 dkARM 路径
加入可执行文件列表。
</div>

#### Phase 2：创建一个 makefile 项目

第二步是创建一个使用自定义 makefile 的项目/工作区。这叫，还能叫啥，一个 <dfn>makefile 项目</dfn>。去 \[文件/新建\] 对话框的 \[项目\] 选项卡（见下面的 @fig:msvc-new），选择 Makefile，给它一个名字并按 OK。请注意，这*不*创建 makefile，只创建项目！还有，我这里用的项目名是'tonc'，把它改成你自己项目的名字。

<div class="cpt" style="width:568px">

<img src="img/setup/msvc_new_proj.png" id="fig:msvc-new"
  alt="创建一个 makefile 项目"><br>
<b>*@fig:msvc-new</b>: 创建一个 makefile 项目。
</div>

#### Phase 3: Profit!\^H\^H\^H\^Hject settings!

点击 OK 后，你会被要求去项目设置。去那里，你会看到图 6 的对话框。你会发现的第一件事是 \[生成命令行\] 编辑框。现在，它读起来像这样：

```sh
NMAKE /f tonc.mak
```

把它改成：

```sh
make -f tonc.mak build
```

为什么？因为我们不会用标准的 VC make（NMAKE），而是用 GNU make（make）。为什么？因为它是免费的、平台无关的，且通常随 devkit 一起，让你的项目更可移植，也更强大、文档更全。为什么？因为……就因为，好吗？这是你按 重新生成（F7）时执行的命令。-f 标志说明用哪个 makefile。在 makefile 里你可以有多个子项目；这种情况下叫 build 的是激活的那个。

其他设置对我们的目的不重要，所以保持原样。是的，输出文件名也是；makefile 会料理它。顺便说一句，注意 @fig:msvc-make-cfg 中的工作区显示了三个项目：tonc 和 libtonc 用于实际的 tonc 内容，以及一个 vault 项目。我的一个标准做法是有一个 vault 项目，我可以在里面存放我不想被编译、但希望可用于参考的源文件（比如模板和示例）。我所有工作区都有一个，我强烈推荐它们。

<div class="cpt" style="width:584px">

<img src="img/setup/msvc_make_cfg.png" id="fig:msvc-make-cfg"
  alt="项目设置。"><br>
<b>*@fig:msvc-make-cfg</b>: 项目设置。

</div>

:::tip 把 GCC 报告转换为 MSVC 报告

当你构建一个普通的 MSVC 项目时，它会报告错误和警告，双击这些会跳到你产生它的那一行。这对 devkitARM 不工作，因为 GCC 有略微不同的报告格式。

```
# GCC error: {filename}:{line}: error: ...
foo.c:42: error: 'bar' undeclared (first use in this function)
# MSVC error: {dir}\{filename}(line): error ...
dir\foo.c(42) : error C2065: 'bar' : undeclared identifier
```

因为行号格式的差异，MSVC 会困惑，找不到那一行，甚至找不到那个文件。幸运的是，我们可以通过把 make 的输出通过 sed 管道化来改掉这一点，sed 是随 msys 一起来的 bash shell 字符串编辑器。为此，把生成调用改成：

```sh
make -f tonc.mak build 2>&1 | sed -e 's|\(\w\+\):\([0-9]\+\):|\1(\2):|'
```

`2>&1 | ` 把 make 的标准输出喂给 sed 的标准输入。其余是一个 sed 命令，它找到前两个冒号之前的部分，并把它们转换成 MSVC 期望的括号格式。注意 tonc 的生成行因为目录结构略微复杂，但上面那行才是真正重要的。

:::

#### Phase 3b：生成配置

这个不是严格必要的，但可能有用。在 Visual C++ 里你可以有多个 <dfn>生成配置</dfn>，每个有自己的项目设置。你大概熟悉 Debug 和 Release 生成，但你也可以用 \[生成/配置\] 对话框（见 @fig:msvc-bld-cfg）添加你自己的。tonc 项目有五个配置，它们都驱动 tonc.mak 中不同的目标。`Build` 构建当前演示；`Clean` 移除所有中间和输出文件（.O、.ELF 和 .GBA）。要构建/清理某个特定演示，你得改变项目设置，或者更可取地，把 tonc.mak 里的 `DEMO` 变量设成那个演示的名字。`Build All` 和 `Clean All` 分别为所有演示运行 `Build` 和 `Clean`。'Utils' 配置创建一些后续示例所需的 tonc 库。

<div class="cpt" style="width:344px">

<img src="img/setup/msvc_bld_cfg.png" id="fig:msvc-bld-cfg"
  alt="生成配置。">
<b>*@fig:msvc-bld-cfg</b>: 生成配置。

</div>

就 Visual C++ 而言大致如此。你仍然得实际创建所引用的 makefile（本例中是 tonc.mak）。你知道怎么创建文本文件，不是吗？关于 makefile 项目要记住的另一件事是，所有生成命令都在 makefile 里面；文件查看器中提到的文件只是为了展示，它们不会像"普通"VC 项目那样被自己编译。

:::note 在 tonc.mak 中轻松切换 devkit

Tonc 的 makefile 有这种性质：每个都能独立存在，但也能从一个中央 makefile tonc.mak 通过 `DEMO` 变量调用。我还在里面放了一个 `CROSS`（存放前缀）变量，它覆盖各个 makefile 的 `CROSS`。在 tonc.mak 里改变它就有效地在处处改变它。

:::

:::tip 摆脱 MSVC 6.0 无用的目录

似乎 Visual Studio 6（以及更高的版本？）有一个非常恼人的习惯，为每个加入工作区的项目和每个项目配置创建各种额外的目录。这些目录你大概从不想用，而且*肯定*从没要求过，它们却把你的项目弄得一团糟。从磁盘上删除它们不解决问题，因为仅仅通过选择项目/配置它们又会重新出现。

\*grumble\*

嗯，好消息是对于普通项目你可以直接把它们从项目设置里移除，然后从磁盘删除，一切就会重新干净。坏消息是我们用的不是普通项目，而是 makefile 项目，它没有相关的设置选项卡。所以你得做的是用文本编辑器打开 .DSP，并删除一切类似下面的行：

```
# PROP BASE Output_Dir [DIR]
# PROP BASE Intermediate_Dir [DIR]
# PROP Output_Dir [DIR]
# PROP Intermediate_Dir [DIR]
```

不，我并不确切知道我在做什么，但是的，当你现在移除这些目录时它们*保持*消失。事实上，我相当确定很多行可以从 DSP 里移除，但由于项目文件里的命令没有手册，我那里不敢冒险。

现在，如果有人确实有 DSP 文件的参考指南，或者能告诉我这种讨厌的行为在后续 MSVC 版本里是否还存在，我洗耳恭听。

:::
