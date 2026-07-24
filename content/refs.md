# F. 参考与链接

<!-- toc -->

## 综合站点 {#sec-gen}

### 必备站点 {#ssec-essential}

- [www.devkitpro.org](https://devkitpro.org/)。**devkitARM** 的家园，GBA 开发工具链的首选。也支持 NDS 等。更新很及时，你可以在这里找到 **libgba** 和示例代码。
- [www.gbadev.org](http://www.gbadev.org)。GBA 开发中心。工具、文档、教程都能在这里找到。如果你刚起步，强烈建议去逛逛 [论坛](http://forum.gbadev.org)，无论你是否遇到问题。如果你确实遇到了问题，很可能你不是第一个，而且它早在这里被解决了。在发帖之前，请记住[发帖规则](http://www.albinoblacksheep.com/flash/posting.php)。
- [Nocash](http://nocash.emubase.de/)。Martin Korth 的站点。你可以在这里找到极其完整（尽管风格朴素）的 [GBATEK](https://problemkaputt.de/gbatek.htm) 参考文档，以及 [No\$gba](http://nocash.emubase.de/gba.htm) 模拟器，两者都好得离谱。
- [vba.ngemu.com](http://vba.ngemu.com)，**VisualBoy Advance** 模拟器。在时序精度上不如 no\$gba，但依然非常、非常好，并且拥有更友好的界面，以及用于图块、地图、IO 寄存器等各种很酷的查看器。

### 替代开发环境 {#ssec-altdev}

- [www.ngine.de](http://www.ngine.de)，**HAM** 的托管站点。HAM 是一套完整的 GBA C 语言开发环境，配有 IDE、调色板和地图编辑器，当然还有编译器。还有一个名为 [HEL](http://www.console-dev.de/project/hel-library-for-gba/) 的扩展库，带有额外（且经过优化）的代码。去看看会是个好主意。
- **DragonBasic**。如果你不喜欢 C/汇编 的一切繁琐细节，可以试试这个类 BASIC 的环境。不过这个项目目前有点……嗯，睡着了。
- [Catapult](https://web.archive.org/web/20071106103247/http://www.nocturnal-central.com/catapult.php)。我对 Catapult 了解不多，但据我所见，它工作起来有点像 Gamemaker：你创建图像/声音和脚本，Catapult 将它们组合成一个 ROM 镜像。Catapult 自带图形、地图和声音编辑器、教程、示例、模拟器，可能还有更多。

### 个人站点 {#ssec-personal}

一些（高水平）论坛常驻者的站点。这些人已经混迹很久了，通过玩他们的演示程序、浏览他们的源代码，你能学到很多。

- [darkfader.net](https://www.darkfader.net/main/)。Darkfader 的站点，包含信息、工具、演示程序、代码，不仅限于 GBA 开发，还涉及许多其他系统。
- [deku.rydia.net](https://web.archive.org/web/20160203205842/http://deku.rydia.net/)。DekuTree64 的站点不止有声音混音器；还有一些演示程序（含源码）和工具，比如 **quither**，一个用于 16 色图块的量化器/抖动器。
- Headspin 整理了一份[各种内容的概览](https://web.archive.org/web/20220512153726/https://members.iinet.net.au/~freeaxs/gbacomp/)，包括不同的压缩例程和可供使用的音乐播放器。
- [www.thingker.com](https://web.archive.org/web/20050205230410/http://www.thingker.com:80/gba/)。Scott Lininger 的站点，包含多个演示程序，其中有**多人**代码，这似乎相当难找。
- [www.console-dev.de](http://www.console-dev.de)。Peter Schaut 的站点，带有 VisualHam（HAMlib IDE）、HEL（HAM 附加库）、katie（一个数据管理工具）等。
- [www.pineight.com](http://www.pineight.com/)。gbadev faq 维护者 tepples 的站点。这里有不少有趣的东西。特别值得一提的有 **Tetanus on Drugs**，一个走火入魔版的俄罗斯方块（不能叫它克隆，因为它远超于此），以及 **GBFS**，一个用于 GBA 的文件系统。

## 文档 {#sec-doc}

### 教程 {#ssec-tut}

- [www.belogic.com](http://www.belogic.com)。几乎是 GBA 声音编程的_头号_站点。包含所有寄存器的信息，以及一套_非常_完整的演示程序。
- 如果你在找 **C/C++ 教程**，似乎[这里](http://www.cprogramming.com/tutorial.html)有一些好东西。
- DekuTree 的[声音混音教程](https://stuij.github.io/deku-sound-tutorial/)。Belogic 展示了声音编程的基础，而这个站点则引导你一步步制作一个声音/音乐混音器。
- [www.drunkencoders.com](http://www.drunkencoders.com)。这是 **the PERN project** 的新家，即最初的一系列 GBA 开发教程。PERN 曾打算彻底翻新，但那似乎已被降优先级，转而偏向 DS，你也能在那里找到大量关于 DS 的内容。
- jake2431 一直在 gbadev [论坛:8353](https://gbadev.net/forum-archive/thread/18/8353.html) 上收集 **NDS / C / GBA 教程链接**。

### 参考文档 {#ssec-ref}

- [**comp.lang.c FAQ**](http://c-faq.com/)。相当长，但如果你在学 C 以及 GBA 编程，会非常有用。
- 一份关于 [**C 编码规范**](https://web.archive.org/web/20110624025547/http://www.jetcafe.org/~jim/c-style.html) 的文档，是流传甚广的众多版本之一。如果你的代码基于任何非 tonc 的教程，你**_必须_**读这篇。规范不必死板地遵守，但采纳其中大部分会是个好主意，并能解决许多其他站点教出来的坏习惯。
- Mr Lee 就[优化](https://web.archive.org/web/20170907095140/http://leto.net/docs/C-optimization.php) 说了几点。这些都是些几乎不损失（或很少损失）可读性的简单优化。
- [**gbadev 论坛 FAQ**](https://gbadev.net/forum-archive/thread/14/418.html)。必读，无论你新手与否。把它收藏、存个本地副本、打印出来；我不管，但总之要把 FAQ 读了。
- [**GBATEK**](https://problemkaputt.de/gbatek.htm)。参考文档。这基本上是 GBA 程序员的圣经（只有这本_值得_一读）。信息密度极高，如果你刚起步可能有点令人困惑，但一旦你习惯了，它几乎就是你所需的全部。它也是 HAMLib 文档的一部分。
- [CowBite Spec](http://www.cs.rit.edu/~tjh8300/CowBite/CowBiteSpec.htm)，另一份参考文档。至少部分基于 GBATEK。没那么丰富，但可能更易理解。
- [www.gnu.org](http://www.gnu.org/manual/manual.html#Development)。各种格式的 **GCC 文档**。这些站点有关于 GCC 工具链和其他内容的手册。把汇编器（**AS**）、编译器（**GCC**）、链接器（**LD**）的手册弄到手，最好也把构建工具（**make**）的弄到手。预处理器的手册（**cpp**）也可能有用。

### ARM 文档 {#ssec-arm}

当然，ARM 站点本身也有有用的文档。请注意，其中大部分是 pdf。

- [miscPDF 8031](https://github.com/ARM-software/abi-aa/releases/download/2023Q3/aapcs32.pdf)。**Arm 架构过程调用标准**（AAPCS）。解释了参数如何在函数之间传递。如果你想做汇编，这是必读内容。
- [PDF DAI0034A](http://netwinder.osuosl.org/pub/netwinder/docs/arm/DAI0034vA.pdf)。**为 ARM 编写高效的 C 代码**。虽然它是针对 ARM 自家的编译器写的，但一些技巧也适用于其他工具链。
- [PDF DDI0210B](https://documentation-service.arm.com/static/5f4786a179ff4c392c0ff819?token=) 重磅之选：ARM7TDMI 的完整**技术参考手册**。
- **指令集参考速查表**。[ARM + Thumb](https://documentation-service.arm.com/static/5ed66080ca06a95ce53f932d?token=) 合订本。
- 关于**对齐问题**的支持 faq：[faqdev 1228](https://web.archive.org/web/20080331064522/http://www.arm.com/support/faqdev/1228.html)、[faqdev 1469](https://web.archive.org/web/20070202123419/http://www.arm.com/support/faqdev/1469.html)，以及 [faqip 3661](https://web.archive.org/web/20090117030418/http://www.arm.com/support/faqip/3661.html)。

## 工具 {#sec-tools}

### 源代码工具 {#ssec-tools-text}

如果你还在用记事本写 GBA 代码，别这样。做个顺水人情，就……别这样，好吗？虽然我个人用 Visual C 写代码，但还有其他一些非常棒的工具可用，无论是通用文本编辑器还是 IDE。

- **[ConTEXT](https://archive.org/details/tucows_349269_ConTEXT)**。不久前有个帖子，有人求一个记事本的替代编辑器，原话是"记事本烂透了！"。ConTEXT 这个名字被提到了好几次，我也觉得它确实很好，而且不只是用于写代码。它允许自定义高亮、集成 shell 命令（比如运行 makefile），以及可挂载的帮助文件。
- [**Programmer's Notepad**](http://www.pnotepad.org/)（PN）。一款优秀而多功能的文本编辑器。随 devkitPro 安装包一起提供。
- **[Eclipse IDE](http://www.eclipse.org)**。虽然我还没时间亲自上手，但不少 gbadev 论坛常驻者对它赞不绝口。你可以在 [forum:5271](https://gbadev.net/forum-archive/thread/14/5271.html) 了解如何为 GBA 开发配置它。
- **[Dev-C++](http://www.bloodshed.net/)**。Dev-C++ 是另一个常被提及、或许值得一看的 IDE。[forum:1736](https://gbadev.net/forum-archive/thread/7/1736.html) 有关于如何配置它的信息，但那是个老帖子了，所以你可能需要多做点额外的工作。

### 图形工具 {#ssec-tools-gfx}

正如记事本不适合写代码（以及除最简文本编辑外的任何事），在涉及 GBA 游戏所需那类图形时，MS-Paint 简直是人间地狱。你需要的是能完全控制位图调色板的工具，而 MS-Paint 恰恰在这一点上惨败。顺便说一句，Visual C 自带的位图编辑器也一样。甚至像 PhotoShop 和 Paint Shop Pro 这种庞大笨重的图像编辑工具，据我所知，在这里也有困难。所以这里有一些能给你所需控制力的工具。无论你打算用哪个工具：**确保它不会把调色板搞乱**！有些编辑器会乱调调色板项。

- **[gfx2gba](http://www.ohnehirn.de/tools/)**。图形命令行转换器，带有一些有趣的特性，如图块剥离、调色板合并，并支持所有位深和 BIOS 压缩例程。注意有两个同名转换器 gfx2gba；你要的是 Markus 写的那个。HAM 发行包中包含此工具。
- **[The GIMP](http://www.gimp.com)**。非常完整的基于 GNU 的位图/照片编辑器。
- **[Graphics Gale](https://graphicsgale.com/us/)** 是非常完整的图形编辑器。它拥有你期望一个位图编辑器拥有的所有工具、一个像样的调色板编辑器，以及一个动画工具。
- **[Usenti](http://www.coranac.com/projects/#usenti)**。这是我自己的位图编辑器。它可能不如 Graphics Gale 那么高级，但这也让界面简单得多。除此之外，它还有一些非常有趣的调色板微调选项，比如调色板交换器和排序器，并能以二进制、ASM 和 C 代码形式导出为 GBA 格式。

### 地图编辑器 {#ssec-tools-map}

虽然我在 Tonc 里用的地图是即时创建的，但做任何认真的工作你都需要一个地图编辑器。这里有几个。

- **[MapEd](http://nessie.gbadev.org)**，由 Nessie 制作。允许多层、碰撞图块和自定义导出器。妙啊。
- **[Mappy](http://www.tilemap.co.uk/mappy.php)**。这是一个通用的地图编辑器，可用于许多不同类型的地图。
- **[Mirach](http://www.coranac.com/projects/#mirach)**。这是我自己的地图编辑器，但时间不足意味着我还没能把想要的所有工具都加进去 `:(`。

### 杂项工具 {#ssec-tools-misc}

- **[excellut](http://www.coranac.com/projects/#excellut)**。在 GBA 编程中，你最不想要的就是调用数学函数。你需要[查找表](luts.html)来获取正确的值。Excellut 将 MS Excel 配置为能让你在数秒（好吧，数分钟）内创建你能想到的任何种类的 LUT。如果你还没做过自己的 LUT 生成器（即便做了也罢），它绝对值得一看。

## 书籍 {#sec-books}

- Douglas Adams，《_银河系漫游指南_》。好吧，这不算严格的参考，但依然推荐。即便只是为了知道数字 42 的意义和 Babel Fish 的来历。
- Edward Angel，《_Interactive Computer Graphics with Open GL_》（《结合 OpenGL 的交互式计算机图形学》）。虽然这是一本关于 3D 的书，但其中大量线性代数同样可以应用到 2D。相关章节是第 4 章（矩阵变换）和第 5 章（透视（Mode 7 有人感兴趣吗？））。请务必用第 3<sup>rd</sup> 版，第 2 版里有太多尴尬的错误了。
- George B. Arfken & Hans J. Weber，《_Mathematical Methods for Physicists_》（《物理学家的数学方法》）。如果物理是个 RPG，这本就是怪物图鉴。第 1-3 章极其详尽地讲述了向量和矩阵。
- André LaMothe，《_Black Art of 3D Game Programming_》（《3D 游戏编程黑魔法》）。针对 DOS 时代，所以可能难找。讲的是在严重硬件限制下的 3D 编程（就像 GBA 一样）。非常棒。
- André LaMothe《_Tricks of the Windows Game Programming Gurus_》（《Windows 游戏编程大师技巧》）。LaMothe 先生的另一本 1000 多页的巨著（他写了很多本），是关于游戏编程、尤其是 DirectX 的优秀指南。
- David C. Lay，《_Linear Algebra and its Applications_》（《线性代数及其应用》）。我[矩阵](matrix.html)页面上几乎一切内容都出自这本书。
- O'Reilly 关于" _CSS_ "和" _HTML_ "的袖珍参考，分别由 Eric Meyer 和 Jennifer Niederst 撰写。对像本站这样的东西绝对是救星。
- Steve Oualline，《_How Not to Program in C++_》（《怎样才不会用 C++ 编程》）。封面是一台电脑对你吐舌头；引言第一句是"痛苦是一种极好的学习工具"。你就知道这书肯定不错。它给你 111 个需要解决的破损代码问题，从显而易见到黑暗君王亲手炮制皆有。如果你在这些问题中认不出至少一半的自己，那说明你用 C 写代码的时间还不够长。
