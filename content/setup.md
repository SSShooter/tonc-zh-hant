# 2. 搭建开发环境

<!-- toc -->

## 简介 {#sec-intro}

除非你想在十六进制编辑器里用二进制手动敲入指令，否则你需要一个开发环境来把人类可读的代码转换成机器码。本章将展示如何搭建必要的组件，并用它们来编译 Tonc 的示例。

到本章结束时，你应该拥有：

* 一个文本编辑器
* 一个 GBA 模拟器 _(mGBA)_
* 一个交叉编译工具链 _(devkitARM)_
* 用于 GBA 编程的库 _(尤其 libtonc)_
* 本教程配套的示例

:::warning 需要一定的命令行基础

要编译一个 GBA 游戏，你需要对命令行有基本的了解。如果你对此不熟悉，下面的 [Unix 命令行教程](https://command-line-tutorial.readthedocs.io/) 或许有帮助。

如果你在 Windows 上，应该使用 devkitARM 自带的 **MSYS2** 终端。在其他操作系统上，内置的终端应该完全够用。

:::


## 选择文本编辑器 {#sec-editor}

一个像样的文本编辑器对编程至关重要。最起码你需要一个支持语法高亮、并能让你控制缩进和换行符的东西。这意味着很遗憾 _notepad.exe_ 无法满足需求。

有很多选择，你可能已经有了心头好。但如果你还没有，这里有些建议：

- [Visual Studio Code](https://code.visualstudio.com/) - 一款流行且功能丰富的编辑器，可在 Linux、Windows 和 Mac 上运行

- [Kate](https://kate-editor.org/) - 另一个强大的编辑器，更轻量且完全开源

- [Geany](https://www.geany.org/) - 在低端机器上运行良好，并且仍能通过插件高度扩展

- [Notepad++](https://notepad-plus-plus.org/) - Windows 上一个轻量且广受欢迎的选择

一旦你选好了编辑器并觉得顺手，就可以进入下一节。

<div class="cpt cblock" style="width:420px;">
<img src="img/setup/text_editor.png" id="fig:text-editor"><br>
<b>{*@fig:text-editor}</b>: 在 VS Code 中编辑文件。
</div>

在许多编辑器里，可以设置一个热键（通常是 <kbd>F5</kbd> 或 <kbd>Ctrl+Enter</kbd>）来编译并运行你的代码。这是一种高效的工作流，但出于本教程的目的，我们将使用命令行，因为了解底层发生了什么至关重要。

同样，代码补全和错误高亮也是很有价值的功能，你可能想花时间配置一下，但超出了本章范围。


## 安装 GBA 模拟器 {#sec-emu}

不用说，你需要一种实际运行 GBA 程序的方式。时不时地在真实硬件上测试是强烈推荐的（也是乐趣的一部分），但在日常开发中，你会想要更方便的东西。这正是模拟器派上用场的地方。

在撰写本文时，最适合 GBA 开发的模拟器是 [<dfn>mGBA</dfn>](https://mgba.io/)。它精度极高，并带有面向开发者的功能，比如内存查看器、调试日志，以及一个用于单步调试的 GDB 服务器，所有这些都会在你出错时（而且你一定会出错！）让你的生活轻松许多。

<div class="cpt cblock" style="width:320px;" markdown>
<img src="img/setup/mgba_game.png" id="fig:mgba-game"><br>
<b>{*@fig:mgba-game}</b>: 一个 GBA ROM 在 mGBA 中运行
</div>

你可能想用的其他模拟器有：[NanoBoyAdvance](https://github.com/nba-emu/NanoBoyAdvance) 和 [SkyEmu](https://github.com/skylersaleh/SkyEmu)，它们都是_周期精确_的，实际上是在不实际使用真机的情况下，最接近真机游玩的体验。

最后，[no$gba](https://problemkaputt.github.io/gba.htm)（调试版）是一个较老、精度稍逊、仅限 Windows 的 GBA 模拟器，但有一些你在别处找不到的独特调试功能。即可视化调试器、性能分析器、CPU 使用率计量，以及能捕获缓冲区溢出之类问题的内存访问检查。如果你能把它跑起来，它是个无价之宝！


## 安装 devkitARM {#sec-dkp}

<dfn>devkitARM</dfn> 多年来一直是 GBA 自制软件的标准工具链。它由一支名为 <dfn>devkitPro</dfn>（dkP）的团队提供，尽管非正式地，这些工具也常被叫作 devkitPro（这让维护者们相当遗憾）。

要安装 devkitARM，请访问 [devkitPro 入门](https://devkitpro.org/wiki/Getting_Started) 页面，并按照你操作系统的说明操作。

:::danger 路径中不要使用空格

devkitARM 使用 [`make`](https://en.wikipedia.org/wiki/Make_(software)) 来构建项目，它对路径中的空格处理不好（比如 `My Documents`）。原因是 `make` 用空格作为命令行选项之间的分隔符，但与 shell 脚本等不同，它没有提供恰当的引用/转义形式，尤其是在处理文件名列表时。

:::

### Windows 提示 {#ssec-dkp-win}

如果你在 Windows 上，有一个 GUI 安装程序会自动下载并安装组件。请务必在安装过程中选择"GBA Development"，如 @fig:devkitpro 所示。

<div class="cpt cblock" style="width:420px;">
<img src="img/setup/devkitpro.png" id="fig:devkitpro"><br>
<b>{*@fig:devkitpro}</b>: 在 Windows 上安装带 GBA 包的 devkitARM。
</div>


### Linux 与 Mac 提示 {#ssec-dkp-unix}

如果你使用 Linux 或 Mac，在按照 dkP 的入门页面说明之后，应该在终端里通过 `dkp-pacman` 安装 `gba-dev` 包组 _（或者如果你用 Arch Linux，就只是 `pacman`）_。为此，运行以下命令：

```sh
sudo dkp-pacman -S gba-dev
```

当被问到要安装哪些包时 _("Enter a selection (default=all):")_，你只需按 <kbd>Enter</kbd> 即可安装整个 `gba-dev` 组中的所有内容。


## 获取 Tonc 的示例代码 {#sec-examples}

本教程附带了一[整套示例](https://github.com/gbadev-org/libtonc-examples)，用于演示每一章所教授的概念。

此外，<dfn>libtonc</dfn> 是伴随 Tonc 的 GBA 编程库，编译示例所必需。过去，libtonc 必须单独下载并放在你的项目能找到它的位置。但如今它作为 devkitARM 的一部分附带提供。只要你安装时选择了 `gba-dev` 包，_你就已经拥有 libtonc 了_。

坏消息是 devkitARM 不包含 Tonc 示例，所以你仍然得自己下载它们。你可以通过仓库页面上的 _"Code -> Download&nbsp;Zip"_ 获取，或者在终端里使用 [git](https://git-scm.com/)：

```sh
git clone https://github.com/gbadev-org/libtonc-examples
```
<br>


:::tip toolbox.h 与 libtonc

在前几章，我们会构建自己的库 `toolbox.h`，它在教学目的上复刻了 libtonc 的部分功能。但在真实使用中，应该优先坚持使用一个功能更丰富、经过实战检验的库（比如 libtonc 本身）。

:::


## 编译示例 {#sec-compile}

为了测试你的安装，我们来试着构建其中一个示例。

在终端中，导航到某个示例所在的目录（比如 *hello* 示例）并运行 `make`：

```sh
cd libtonc-examples/basic/hello
make
```

被调用时，`make` 会按照当前工作目录中名为 _'Makefile'_ 的文件里的规则来构建项目。假设成功，会生成一个 `.gba` 文件，你可以在你选择的模拟器中运行它：

<div class="cpt cblock" style="width:320px">
<img src="img/setup/mgba_hello.png" id="fig:mgba-hello"><br>
<b>{*@fig:mgba-hello}</b>: Tonc 的示例之一在 mGBA 中运行。
</div>

如果你走到了这一步，恭喜！你现在可以开始编写自己的 GBA 程序了。

你可以进入下一章，或继续往下读了解更多细节。


:::tip 设置环境变量

如果你遇到诸如 `Please set DEVKITPRO in your environment` 这样的错误，意味着你的环境变量没有正确设置。解决方案因机器而异，但通常你需要编辑主目录下一个名为 `.bashrc` 的文件，并向其中添加以下几行：

```sh
export DEVKITPRO=/opt/devkitpro
export DEVKITARM=/opt/devkitpro/devkitARM
export DEVKITPPC=/opt/devkitpro/devkitPPC

export PATH=$DEVKITARM/bin:$DEVKITPRO/tools/bin:$PATH  # optional
```

最后一行把编译器和相关工具加到了你的 `PATH` 环境变量中，让你能在终端里直接使用它们。

这是可选的，因为示例的 makefile 也会在构建过程中设置 `PATH`。但手头有这些工具很有用，而且如果你想跟着下一节走，这是*必需的*。

编辑完 `.bashrc` 后，你必须关闭并重新打开终端才能应用更改。或者你可以运行 `source ~/.bashrc` 在当前 shell 中使这些更改生效。

:::


## 手动构建 GBA ROM 的步骤 {#sec-build-steps}

我们刚才看到了如何通过 `make` 编译一个 GBA 程序。复制 makefile 并用于你自己的项目是绝对被鼓励的！话虽如此，了解底层发生了什么是有价值的。

把你的 C/C++/asm 源文件转换成一个有效的 GBA ROM 涉及 4 个步骤，可以在运行 `make` 的输出中看到：

```sh
$ make
hello.c               # <--- invoke the compiler
linking cartridge     # <--- invoke the linker
built ... hello.gba   # <--- elf stripped
ROM fixed!            # <--- header fixed
```

步骤如下：

1. **编译/汇编源文件**。我们把人类可读的 C 或 C++ 文件（`.c`/`.cpp`）或汇编文件（`.s`/`.asm`）转换成一种称为[目标文件](https://en.wikipedia.org/wiki/Object_code)（`.o`）的二进制格式。每个源文件对应一个目标文件。
    
    做这件事的工具叫 `arm-none-eabi-gcc`。实际上，这只是真正编译器的前端，但那只是细节。这里的 `arm-none-eabi-` 是一个前缀，表示这个 GCC 版本为裸机 ARM 平台生成机器码；其他目标平台有不同的前缀。注意 C++ 使用 `g++` 而非 `gcc`。

2. **链接目标文件**。之后，独立的目标文件被链接成一个单一的可执行 [ELF](https://en.wikipedia.org/wiki/Executable_and_Linkable_Format) 文件。你可能指定的任何预编译代码库（`.a`）也在这个阶段链接。
    
    你其实可以同时进行编译和链接，但把它们分开是好习惯：严肃的项目通常包含多个源文件，而不希望你只改了一个就得等整个世界重新编译。当你开始添加数据（图形、音乐等）时，这一点变得更加重要。
    
    同样，`arm-none-eabi-gcc` 被用来调用链接器，尽管真正的链接器叫 `arm-none-eabi-ld`。

3. **剥离为原始二进制**。ELF 文件仍包含调试数据，实际上无法被 GBA 读取（尽管许多模拟器会接受它）。`arm-none-eabi-objcopy` 移除调试数据，确保 GBA 会接受它。嗯，差不多。

4. **修复头部**。每个 GBA 游戏都有一个带校验和的头部，以确保它是一个有效的 GBA ROM。链接步骤为它留出了空间，但留空，所以我们得用 DarkFader 的 `gbafix` 之类的工具来修复头部。这个工具随 devkitARM 提供，所以你不必单独下载。


你当然可以在终端里自己运行所有这些命令，而不需要 makefile，只要 dkP 工具在你的 `PATH` 中。

让我们用名为 *first* 的示例试试——这是最容易编译的一个，因为它不依赖任何库。


```sh
cd libtonc-examples/basic/first/source

# Compile first.c to first.o
arm-none-eabi-gcc -mthumb -c first.c

# Link first.o (and standard libs) to first.elf
arm-none-eabi-gcc -specs=gba.specs -mthumb first.o -o first.elf

# Strip to binary-only
arm-none-eabi-objcopy -O binary first.elf first.gba

# Fix header
gbafix first.gba
```

你做到了——一个从零编译的 GBA 程序！嗯……我们总能钻得更深，但现在大概是个不错的收尾之处。 <kbd>x)</kbd>

这里传给工具的各个选项可能不立即明显。如果你感兴趣，它们会在 [makefile 附录](makefile.html#sec-flags) 中解释。


:::tip 避免用批处理文件编译

你可能会想把所有命令塞进一个批处理文件或 shell 脚本，并用它来编译你的项目。这很简单，但不推荐。

一旦你的项目有多个源文件，原因就显而易见了：如果你改了其中一个文件，你不该重新编译_所有_源文件，只重编改动的那个。像 `make` 这样的构建系统足够聪明能意识到这点，而简单的 shell 脚本做不到。

当你的项目有几十个源文件时，这差别就大了！

:::

## 替代工具链 {#sec-alt}

devkitARM 的优势在于它为在 Windows、Mac 和 Linux 上编译 GBA 自制软件提供了一致的环境。然而，如果你喜欢冒险，如今还有其他不错的选择：

* [gba-toolchain](https://github.com/felixjones/gba-toolchain) - 使用 CMake 构建系统而非 Makefile
* [meson-gba](https://github.com/LunarLambda/meson-gba) - 使用 Meson 构建系统而非 Makefile
* [gba-bootstrap](https://github.com/AntonioND/gba-bootstrap) - 编译一个 GBA 程序所需的最低限度。换句话说，_自己动手搭工具链_，最难的部分已经替你做好了。

你为何想用这些？它们可能更容易安装（许多 Linux 发行版提供它们自己构建的 `arm-none-eabi-gcc` 及相关的包，这本质上和 devkitARM 提供的是同一回事），或者你可能用的机器上 devkitARM 不可用（比如树莓派）。又或者你只是想要比 makefile 更好的构建系统。

Tonc 假定你使用 devkitARM，但无论你用哪个工具链，大部分信息都是相关的。


:::danger 避开 'devkitAdvance'

你可能会遇到一个名为 _devkitAdvance_ 的工具链。这是一个古老的工具链，自 2003 年起就没有更新过。使用它，你将错过_二十年_的编译器改进和优化。如果有人向你推荐这个，快跑！

:::
