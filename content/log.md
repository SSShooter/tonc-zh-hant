# G. 更新日志

### Dec 27, 2023 - 初始内容移植与 mdbook 设置

本预发布版本包含了从 TONC 教程忠实移植过来的全部内容，采用 markdown 格式，由 mdbook 渲染。部分功能通过额外的 mdbook 预处理器实现。

“安装”章节也经过了彻底重写，新版本已包含在本发布中。这部分最初的移植版本仍可在提交 [7a3ac73](https://github.com/gbadev-org/tonc/commit/7a3ac731efe03af6f7debbcc7dce3b222cd23b65) 中找到。

本次移植由 @exelotl @avivace @LunarLambda @pinobatch @mtthgn @copyrat90 @gwilymk 共同整理完成。

### Mar 2013 (1.4.1)

维护更新。同时包含了来自[勘误页](http://www.coranac.com/documents/tonc-errata/)的内容。

- ![fix](./img/log/bul_excl.png) 将 `arm-eabi` 改为 `arm-none-eabi`。
- ![upgrade](./img/log/bul_upgr.png) 各处的小幅 html 修正。感谢 Glod 的目录查找替换工具。
- ![fix](./img/log/bul_excl.png) `all code`：由于 GCC 4.7 破坏了我的一些汇编函数，我使用最新的 devkitArm（当前为 40）重新编译了所有代码，以保证汇编兼容性。示例和 libtonc 应该都能正常工作了。不过文字部分还需要相应调整。
- `asm.htm`：修正了[数据段](asm.html#ssec-gas-dsec)代码片段里不匹配的变量名。感谢 Gdogg
- `gfx.htm`：移除了[混合演示](gfx.html#ssec-bld-demo)里多余的分号。
- `hardware.htm`：IO-ram 上限原本写作 `0401:03FF`，应为 `0400:03FF`。感谢 G M。
- code：修正了 `m7_demo`、`m7_ex`、`tte_demo` 指向 grit 的链接。
- [objaff.htm 11.5](objaff.html#sec-combo)：修正了 `obj_rotscale_ex()` 和 `oac_rotscale()` 中多余的 `sina` 和 `cosa` 计算。感谢 dasi。
- GNU 汇编器手册已移至 <http://sourceware.org/binutils/docs/as/index.html>（感谢 Joseph）。
- 第 §23.2.1 节“基本操作”的代码片段里，“x68 asm” 当然应该是 “x86 asm”（感谢 Wladimir）。
- §1.3 节中部分内存映射条目……不够精确（感谢 Pius）。

### Oct 2008 (1.4)

…… 也许并不是。一些愚蠢的小错误。

- ![fix](./img/log/bul_excl.png) text：[regbg:map-layout](regbg.html#ssec-map-layout) 中的 `se_index_fast()` 函数是错误的；第二个条件本应使用 \``(bgcnt&BG_REG_64x64) == BG_REG_64x64`'，已修正。
- ![fix](./img/log/bul_excl.png) text：[asm:memory](asm.html#ssec-arm-mem) 中 `ldm` 的示例没有给出 `ldmda` 和 `ldmdb` 的正确取值。已修正。
- ![fix](./img/log/bul_excl.png) code：移除了 `tonc_surface.h` 中的 `void*` 运算（希望如此），并修正了定时器演示中的 `berk.c`，现在可以正常编译了。感谢 elwing 和 Ealdor 的提醒。
- 修正了各处的一些随机拼写错误

### May 2008 (1.4)

- ![fix](./img/log/bul_excl.png) text：最后一批拼写/语法修正。多谢各位，尤其是 Jake。
- text：修改了关于 #include 的内容，减少了夸张，增加了说明。

我想就这些了。

### May 2008 (1.3)

- ![upgrade](./img/log/bul_upgr.png) code：所有使用文字的演示现在都改用 TTE 来实现。变宽字体比定宽字体好看多了。
- ![upgrade](./img/log/bul_upgr.png) code：部分高级演示使用 grit 来转换图形。
- ![new](./img/log/bul_new.png) text：新增 TTE 章节，介绍如何为各种场合创建（快速的）文字渲染器。
- ![upgrade](./img/log/bul_upgr.png) text：我重写了[安装章节](setup.html)。现在涵盖了模板 makefile 以及安装时可能出现的一些问题。
- ![swap](./img/log/bul_swap.png) text/code：[中断章节](interrupts.html)及其演示使用了新的主 ISR。
- ![fix](./img/log/bul_excl.png) text：修正了 PDF 中棕色的文字。如果有人用 CutePDF 也遇到同样问题，请进入 `CutePDF printer->Properties->Paper/Quality->Advanced->Graphic->Image Color Management`，确保 `ICM Method` 没有被设为 `Host system`。我真蠢，居然没先去看那里。
- text：终于移除了使用旧版 devkit 处理 IRQ 的过时章节。
- ![new](./img/log/bul_new.png) libtonc：新增了一套名为 TTE 的文字系统，非常酷。详情请见 [tte.htm](tte.html)。
- ![new](./img/log/bul_new.png) libtonc：新的渲染函数。现在有了 ‘TSurface’ 结构体来定义渲染表面，以及针对不同表面类型的基本图元渲染器。功能包括：像素、直线、矩形渲染器，一个 blitter 和 floodfill。主要的表面类型有：16bpp 位图、8bpp 位图和 4bpp 图块。
- ![new](./img/log/bul_new.png) libtonc：颜色调整函数。淡入淡出、混合、亮度调节等等。
- ![new](./img/log/bul_new.png) libtonc：新增 [tonccpy 和 toncset](http://www.coranac.com/2008/01/25/tonccpy/)，它们是 memcpy 和 memset 的替代品，并且真正适用于 VRAM。
- ![new](./img/log/bul_new.png) libtonc：已将 libtonc 文档放到网上：[http://www.coranac.com/man/tonclib/index.htm](http://www.coranac.com/man/tonclib/index.htm)。
- ![new](./img/log/bul_new.png) libtonc：新增 `tonc_libgba.h`，一个包含大部分 libgba 常量与函数名到 tonc 对应项的头文件。
- ![swap](./img/log/bul_swap.png) libtonc：将主 ISR 改为不再自动启用中断嵌套的版本。这算是有点倒退，但可能更合适。这不应该影响任何没有使用嵌套中断的人。旧版本仍然可用，只是不再是默认的了。

### Dec 2007 (1.3b)

- ![new](./img/log/bul_new.png) 扩充了[推荐阅读](first.html#sec-notes)章节，加入了更长的列表和示例。如果你读过其他教程，那么**请务必读一下这个**！
- ![fix](./img/log/bul_excl.png) 更多拼写和语法修正（感谢 [Patater](http://patatersoft.info/)）
- ![fix](./img/log/bul_excl.png) 修正了 c++ 模板 makefile 中的错误。应该是 `-fno-exceptions`，而不是 `-fno-expections`，你这傻孩子。（感谢 muff）
- ![swap](./img/log/bul_swap.png) 所有项目现在默认使用 cart-boot（卡带启动），而不是 multiboot（多重启动）。这部分是因为 multiboot 在 devkitPro r21 中无法工作（至少不能直接工作），也因为本来通常就是这么做的。
- 在适当的地方将 `git` 改为 `grit`。同时也修正了所有下载链接，指向新站点。

### Feb 2007 (v1.3b)

正如每个程序员都知道的，你应该边改边记录所做的改动。但也正如每个程序员都知道的，这些记录往往会被忘掉 <kbd>\^\_\^;;</kbd>。我大概漏掉了这里的一些内容。

Text（文字）：

- ![new](./img/log/bul_new.png) 现在也有 PDF 版本了，用 CutePDF 制作。这是个不错的工具，但似乎偶尔会把图片搞乱一点。分页也出现在了不幸的位置，不过这是浏览器的问题。它_本应_被 CSS 的 `page-break-inside` 抵消掉，但我想这个属性还没有被广泛支持。如果有人知道潜在的解决办法，请告诉我。另外，如果有人知道某个能在目录里保留页眉的 html→PDF 转换器，我会非常感兴趣。注意，它需要能打印一个 1.4 MB 的文件，而且要打印得**正确**！有些 PHP 的 html2pdf 工具渲染不正确。Word/OpenOffice 大概也不行，因为它们对浮动 div 和 `pre` 标签有问题。而且 Word 在读这个文件时几乎要崩溃了。嘿嘿嘿嘿。
- ![new](./img/log/bul_new.png) hardware：GBA 图片与功能描述。谁有 GBA Micro 的图片可以借我用用？
- ![new](./img/log/bul_new.png) first：硬件图片。
- ![new](./img/log/bul_new.png) bitmaps：针对在模式 3/5 中绘制图元的新演示讨论。页翻转演示在章节中提前了，而模式 3/4/5 的演示移到了数据讨论之后。
- ![new](./img/log/bul_new.png) objbg：关于把图块当作位图读取的笔记和图片，因为这偶尔还是会发生在某些人身上。
- ![new](./img/log/bul_new.png) regbg：展示偏移寄存器到底做了什么的图片。
- ![new](./img/log/bul_new.png) affine：加入了 2x2 逆矩阵方程。
- ![new](./img/log/bul_new.png) affbg：仿射背景的新结构体，外加新的 typedef，以及一种初始化仿射参数非常巧妙的方法。
- ![new](./img/log/bul_new.png) mode7ex：全面升级并加入新内容。现在使用了像样的图形，让一切看起来漂亮得多。新的背景、新的淡入淡出、精灵旋转动画与排序，以及不同的运动方式。
- ![new](./img/log/bul_new.png) asm：本章的正确形态正在成形。新的章节结构，以一个关于通用汇编的小节开始。更多示例，以及为对比目的而提供的多种做同一件事的方式。现在也有一个关于常见结构的章节了。
- ![new](./img/log/bul_new.png) 关于 luts 线性插值的新小节。
- ![upgrade](./img/log/bul_upgr.png) 章节索引。所有引用现在都采用 ‘ch.foo’ 的形式。
- ![upgrade](./img/log/bul_upgr.png) 一些章节被重命名。_tonctonc_ 现在是 _intro_，_toncmake_ 现在是 _makefile_。另外，_luts_ 已合并进 _fixed_，而 _setup_ 中关于 makefile 和编辑器的部分被移到了一个单独的文件 _edmake_。也许以后也会把它并入 _makefile_。
- ![upgrade](./img/log/bul_upgr.png) 所有寄存器和类寄存器表格现在使用交替的背景色，便于阅读。
- ![upgrade](./img/log/bul_upgr.png) regobj：`obj_demo` 讨论采用了不同的结构。
- ![upgrade](./img/log/bul_upgr.png) regbg：删除了 `BGINFO` 相关的东西，因为它几乎没被用过，而且用起来也不方便。
- ![upgrade](./img/log/bul_upgr.png) regbg：新的图形基于超级银河战士的 Brinstar，而不是原来的 Norfair。现在更好看了。同时也重新安排了内容。
- ![upgrade](./img/log/bul_upgr.png) affine：为新的例程更新了“收尾”部分。
- ![upgrade](./img/log/bul_upgr.png) dma：讨论了升级后的 DMA 演示。
- ![upgrade](./img/log/bul_upgr.png) interrupts：讨论了新的（大幅度）改进的中断处理程序及其演示。
- ![upgrade](./img/log/bul_upgr.png) 为定点数功能加入了内联函数。
- ![fix](./img/log/bul_excl.png) 每个章节都再次检查了拼写和语法。又一次。唉。

Code（代码）：

- ![new](./img/log/bul_new.png) libtonc：全新的 libtonc，采用新的文件结构。所有文件都以 `tonc` 为前缀，这样就不会与外部文件冲突。类型、内存映射和寄存器 #define 集中在 _types_、_memmap_ 和 _memdef_ 中。现在要包含的主文件是 `tonc.h`。

- ![new](./img/log/bul_new.png) libtonc：到处都有 Doxygen 注释。生成的文档可以在 `tonclib.chm` 中找到。

- ![new](./img/log/bul_new.png) libtonc：几个新条目。一个用于嵌套、带优先级中断的全新中断处理程序。模式 3/5 的画线器。一个新的 .12f 正弦 LUT，带有支持函数以及 lerp 函数。所有定点数宏现在都是内联的。

- ![new](./img/log/bul_new.png) libtonc：`BGINFO` 结构体和函数被移除了。反正也没多大价值。同时也移除了内部的 OAM 影子；最好能在需要时自行定义它们，并且可以通过把它们存在 EWRAM 中来节省 IWRAM。所有 OAM 函数现在都使用通用的对象指针，而不是缓冲区。

- ![new](./img/log/bul_new.png) libtonc：又一次大重命名。其中包括：零值 #define 前面的下划线被去掉了。我原本以为这是个防范潜在不安全操作的好办法，但它们用起来实在太怪了。于是大家都欢欣鼓舞。一些宏在作用显而易见时失去了它们的 `_ON` 前缀。OAM 结构体现在是 `OBJ_ATTR` 和 `OBJ_AFFINE`，相关函数现在以 `obj_` 和 `obj_aff_` 为前缀。`BGAFF_EX` 现在是 `BG_AFFINE`，用于大多数仿射 BG 函数。完整的列表可以在 `tonc_legacy.h` 中找到，你可以 #include 它来保持与旧代码的兼容。

- ![new](./img/log/bul_new.png) projects：项目的目录层级结构被改变了。演示被分类为基础、扩展或高级，分别对应 tonc 文字部分的难度。基础演示更简单，使用简单的 makefile。它们完全自给自足，应该有助于入门学习。扩展演示有更完整的 makefile，并使用 libtonc。高级演示有类似 devkitPro 的 makefile。尽管我很想用，但实际的 DKP 模板不太适合我的目的（抱歉，Dave <kbd>:P</kbd>），所以我自己做了一套。高级演示也会使用汇编文件来处理数据。

  项目文件夹里还包含了 `.pnproj` 文件，可以用 Programmer's Notepad 打开并运行。

- ![new](./img/log/bul_new.png) projects：新项目。`m3_demo`，用于在模式 3 中绘图。在 `lab` 文件夹里也有几个新的。它们还没有对应的讲解，但值得一看。`bigmap` 应该会特别有意思。

- ![upgrade](./img/log/bul_upgr.png) projects：更新项目。所有项目都已更新到新的 libtonc。DMA、irq 和 mode 7 演示的内容有大幅改动。`dma_demo` 现在是关于使用 HDMA 效果，具体是制作一个圆形窗口。`irq_demo` 使用新的 irq 处理程序，充分利用嵌套中断和改变 irq 优先级。至于 `mode7ex`，你最好自己亲眼看看。

### Jul 23, 2006 (v1.2.4)

- ![new](./img/log/bul_new.png) 新增了一章相当长的[ARM/Thumb 汇编](asm.html)。不过这仍是一个草稿版本。大部分内容都在了，但我还需要重新调整章节顺序，并对全文做拼写/语法检查。
- 还有更多拼写修正 <kbd>\>\_\<</kbd>。

### Jun 3, 2006 (v1.2.3)

- ![upgrade](./img/log/bul_upgr.png) 将 makefile 和构建说明改为使用 devkitARM r19。
- ![upgrade](./img/log/bul_upgr.png) 所有章节和小节现在都带编号了，w00t！
- ![fix](./img/log/bul_excl.png) 为大多数结构体添加了对齐属性，因为如果你想让结构体拷贝正常工作，这些属性现在基本上_是必需的_。更多信息见[此处](bitmaps.html#ssec-data-align)

### Apr 28, 2006 (v1.2.2)

- ![new](./img/log/bul_new.png) 终于明白了我偶尔在仿射对象中看到的 1 像素偏移是什么原因（感谢 NEiM0D）。更新了 [affobj.htm](affobj.html) 和 `obj_aff` 以修正。
- ![swap](./img/log/bul_swap.png) 把新的偏心仿射对象内容移到了它的[合适位置](affobj.html)。
- ![upgrade](./img/log/bul_upgr.png) 基于[这个](http://www.devkitpro.org/devstudio.shtml)做了一些小的 sed 处理，把 GCC 错误报告转换成 Visual C++ 格式。
- ![upgrade](./img/log/bul_upgr.png) 既然我的 html 自动编号系统能用了（至少第一次尝试可以），text.htm 现在去除了交叉引用。耶。
- 对中断和 gfx 做了一些小改动。
- 加入了 Javascript 让 id 属性可见。以后大概会加更多。

### Apr 28, 2006 (v1.2.1)

- ![fix](./img/log/bul_excl.png) 看来 no\$gba 不喜欢你使用段镜像，比如我对 REG_INTMAIN 和 REG_IFBIOS 所做的那样。它们现在使用了正确的地址。
- ![fix](./img/log/bul_excl.png) intro.htm 中的拼写修正。再次感谢，Mick。
- ![upgrade](./img/log/bul_upgr.png) 为扩展和高级项目准备了新 makefile。这意味着 makefile.htm 现在有点过时了。
- ![upgrade](./img/log/bul_upgr.png) 针对 devkitARM 的改动更新了 [setup.htm](setup.html)。也稍微改了图。
- ![new](./img/log/bul_new.png) 新增名为[实验室](lab.html)的章节，我会把那些几乎、但还没完全准备好的新东西放在这里。目前包含关于优先级和精灵排序的文字，以及一段围绕非中心参考点做仿射变换的讨论。两者都带有名为 `prio_demo` 和 `oacombo` 的新演示。
- ![new](./img/log/bul_new.png) 在 [setup.htm](setup.html) 中加入了如何通过 context 或 PN 运行 makefile 的说明。
- ![new](./img/log/bul_new.png) 在多处加入了 gfx2gba 和 grit 的转换说明。
- 在 bitmaps.htm 的[数据小节](bitmaps.html#sec-data)中加了更多笔记。

<div class="nh">

Probable upcoming changes（可能的后续改动）

</div>

我打算对 tonc 的代码做一些改动。首先，我会尝试把基础演示中的代码与 libtonc 解耦，这样它们会更容易理解，因为你不必再去翻看所有其他东西。其次，这能让我重新打磨并优化 libtonc，目前它在某些方面受限于我不得不把一些东西做得比我想的要简单。当然，这是我想_要_做的事；但我真的说不准什么时候（以及是否）会去做。

另外，我有点想把当前的 DMA 演示换成[这个](https://gbadev.net/forum-archive/thread/9/9023.html)，它看起来酷多了，尽管其中多了不少“魔法”。呃，走着瞧吧。

### Mar 21, 2006 (v1.2)

更多非最终的更新。实际上还不少。

- ![fix](./img/log/bul_excl.png) 又修正了一些拼写错误。
- ![fix](./img/log/bul_excl.png) `bg_init()` 从未初始化过 `BGINFO` 的位置。哎呀。
- ![swap](./img/log/bul_swap.png) 把章节顺序稍微挪动了一下。我把[按键](keys.html)移到了[位图](bitmaps.html)紧后面，那个位置本来就更合适。
- ![upgrade](./img/log/bul_upgr.png) 用各自演示的完整或近乎完整的代码更新了[首个演示](first.html)、[位图模式](bitmaps.html)、[常规精灵](regobj.html)、[常规背景](regbg.html)、[仿射精灵](affobj.html)、[仿射背景](affbg.html)、[图形效果](gfx.html)和[定时器](timers.html)。
- ![upgrade](./img/log/bul_upgr.png) [首个演示](first.html)现在有两个演示，一个纯粹用硬编码数字（muwahaha！），另一个遵循更合理的编程原则。同时也对这些做了更详细的说明。
- ![upgrade](./img/log/bul_upgr.png) 为[常规背景](regbg.html)加了两个演示，其中一个引入了 libtonc 及其文字函数，这在后面会反复出现。说到这个……
- ![upgrade](./img/log/bul_upgr.png) 重新编写了 `bld_demo`、`m7_demo`、`mos_demo`、`obj_aff` 和 `tmr_demo`，改用 libtonc 的文字，这样你能更清楚地看到在改什么。
- ![upgrade](./img/log/bul_upgr.png) 在绝大多数演示中，用 libtonc 的 `memcpy16/32` 和 `memset16/32` 替换了 copiers/fillers，是在[它引入之后](regbg.html#ssec-demo-hello)。
- ![upgrade](./img/log/bul_upgr.png) 为许多寄存器表格加入了[字段定义](intro.html#ssec-note-reg)。
- ![upgrade](./img/log/bul_upgr.png) 重组了 [keys.htm](keys.html) 的部分内容，以更好地解释我所用的各种函数。
- ![new](./img/log/bul_new.png) 加入了一段关于[倒数（ reciprocal ）乘法的除法](fixed.html#sec-rmdiv)的讨厌内容。胆小者勿入。
- 为[第二个演示](first.html#ssec-2nd-make)加入了一个简单的模板 makefile 和讲解。
- ![new](./img/log/bul_new.png) 加入了关于[三态按键状态](keys.html#ssec-adv-tri)的小节。事实上，几乎所有能从中受益的演示都改用了它。一行代码代替四行，而且还更快。在我看来是个赢招。
- ![new](./img/log/bul_new.png) 加入了关于[正确构建流程](bitmaps.html#ssec-data-proc)的小节，这部分在整节里一直缺失。对于任何一直跟着非 tonc 教程、并采纳了它们编码规范的人来说，这基本是**必读**内容。
- 合并了定点数和 LUT 两章，并重写了其中大部分。
- jake2431 在这个帖子里收集了不少有用的链接：[forum:8353](https://gbadev.net/forum-archive/thread/18/8353.html)。如果你是 C 和/或 GBA/NDS 编程的新手，我推荐你去看看。

### Jan 27, 2006 (v1.1)

嘿，原来那还不是最终更新 <kbd>:P</kbd>。

- 在 [setup](setup.html) 里加了一个小提示，讲如何摆脱 MSVC 6.0 一直坚持创建的那些没用的目录。
- ![fix](./img/log/bul_excl.png) 修正了 devkitARM 的 URL 和版本号。（不过我不明白我为什么要在意这个，因为在我发出来的那一秒就会有新版本。该死的，Dave，别发了！<kbd>\>\_\<</kbd>）
- ![upgrade](./img/log/bul_upgr.png) 文字里更多代码。至少前几页是。
- 两个新章节：一个是关于[文字系统基础](text.html)，另一个是关于[产生蜂鸣声](sndsqr.html)。后者还没完全完成，但应该足够让你起步了。与它们配套的共有 5 个新演示：4 个关于文字，1 个关于声音。
- ![swap](./img/log/bul_swap.png) 更多改名。不过这次只涉及演示名称，所以不用担心。
- 加入/移动了关于[如何处理数据](bitmaps.html#sec-data)的小节。这解释了一些你可能会或不会遇到的麻烦。但如果你遇到了，知道它们为什么发生以及如何修复是件好事，不是吗？

### Jun 28, 2005 (v1.0)

最终更新。大概吧。不是因为我做完了，而是因为有太多东西要改、要加，不如从头再来更容易。在我开始写 tonc 时，我对 GBA 编程还几乎一无所知，只能边学边尽力而为。现在我年纪大了一点，也聪明了一点（好吧，至少年纪大了），对正确的流程、什么有用什么没用，以及人们会在哪里卡住都知道得更多了（感谢新手论坛里各位的问题！）。按照我的构想，tonc 2 会_大_得多、好得多，而且有更多爆炸！呃，是演示。Tonclib 会做一次大改，用新名字和新的、优化过的函数，包括所有模式的文字、内存例程等等。但到达那一步需要一段时间，所以我想我最后再更新一次原版。

- ![fix](./img/log/bul_excl.png) 非常多、非常多的拼写和语法修正。多到离谱。拜托各位，告诉我这些事啊！
- ![fix](./img/log/bul_excl.png) `DMA_SRC_RESET` 是 `0x01800000`，不是 `0x00600000`。正是这个让 `dma_demo` 的结果那么奇怪。同时也修正了 `sbb_aff` 的黑色十字准星，它在 OAM 里的 _x_ 和 _y_ 值被调换了。该死的属性 x、y 顺序。
- ![swap](./img/log/bul_swap.png) 改名。很多。这部分属于遵循 GBA 社区标准（`OBJ_ATTR`、charblock、screenblock、swi 命名）以及其他分类问题（`REG_DISPCNT` 的 `DCNT_x` 之类；零值位定义的下方下划线，相信我这是好事）。我擅自创建了一个 `legacy.h`，把所有这些旧名字重新定义为新名字，这样如果你不想，就不必自己改名。不过旧名字已被弃用了。这次改名只是完整的 tonc2 改名的一部分，但我现在还不能处理函数，因为那_会_破坏旧代码。
- ![upgrade](./img/log/bul_upgr.png) 一些小的功能改动。最值得注意的是，`key_poll()` 现在_已经反转_了 `REG_KEYINPUT`（以前叫 `REG_P1`）。这是件好事，因为现在同步函数会更有意义。另外，`m4_plot()`（以前叫 `_vid_plot8`）现在真的是逐像素绘制，而不是每两个像素。
- ![upgrade](./img/log/bul_upgr.png) 内存例程 `memcpy16/32` 和 `memset16/32` 用汇编做了优化，大概是你见过最快的。速度可与 `CpuFastSet` 匹敌，但没有对齐/大小方面的要求。
- ![upgrade](./img/log/bul_upgr.png) `swi.s` 包含了所有 BIOS 例程的调用。一些额外的被移到了 `swi_ex.s`。
- 加入了 `x_BUILD` 宏，用于在簇中设置位标志。可能有用，也可能没用。
- 为位图模式加入了矩形绘制器。优化得相当不错。
- ![fix](./img/log/bul_excl.png) 修正了 Firefox 的列表外边距。或者说，把列表外边距修正为标准要求、但 MSIE 没有遵循的样子。（要是能弄明白那个 \<col\> 标签该怎么办就好了）
- ![upgrade](./img/log/bul_upgr.png) 重新设计了寄存器表格的样式。
- ![upgrade](./img/log/bul_upgr.png) 我终于想明白如何用纯 html 而不是图片来做矩阵，所以几乎_所有_方程现在都是 html 了。我估计它已经相当接近 MathML，但因为 MSIE 原生不支持它，而我又不想让你额外下载东西（旧版本上可能还用不了），所以暂时这样就够了。（如果可以的话，我要躺下让脑子恢复知觉了）
- ![upgrade](./img/log/bul_upgr.png) 所有章节、方程、表格等现在都有了用于链接的 id，并且（也许）在我搞明白怎么做之后会实现自动编号。
- ![upgrade](./img/log/bul_upgr.png) `int_demo` 现在为直接 isr 使用单独的文件，并恰当使用了段和 ARM/Thumb 代码。详见[演示说明](interrupts.html#sec-demo)。

我想大概就这些了，不过应该够多了。我手头有一些 tonc2 的文字、示例和库，虽然可能不是最终形态。它们可以获取，但仅限应要求。如果有人有建议或请求，我会看看能做什么。这也适用于你犯过、并认为别人可能也会犯的（编译器和链接器抓不到的）错误。其中不少我已经从论坛里知道了（比如你应当<span class="ack">不要</span>对局部变量使用字节或半字，因为这会严重拖垮性能，只用 `int` 或 `u32`，**_拜托了_**。非常拜托。加糖的那种。还要加糖霜和鲜奶油。）不过不需要知道每一件小事，尤其是如果它已经被写得很好的 [gbadev 论坛 FAQ](https://gbadev.net/forum-archive/thread/14/418.html) 或这里某处覆盖到了的话。

如果有人知道我如何能自动跟踪所有页眉/方程/图的编号（不用 CSS2，因为 MSIE 支持得不好 <kbd>:(</kbd>），那会_非常_有帮助。其实编号本身不是问题，_引用_它们才是。

另外，我还需要更多关于图块地图/精灵碰撞检测_以及_响应的真实例子。我知道包围盒的东西和检测的基础（甚至是逐像素的），但无论怎么做，我似乎都会在某些细节上卡住，比如斜向移动，以及当物体每帧移动超过一个像素时。我特别想看看真实的平台游戏里是怎么处理复杂场景的，那种有多个精灵-精灵、精灵-背景碰撞的，而不只是单个精灵-背景。

### Dec 5, 2004 (v0.99.6)

加入了关于数制、位和位运算的[数字](numbers.html)页面。我要提醒你，它相当大。我有一阵子没加东西了，我想我有点过火了 <kbd>:\\</kbd>。以后也许会把它拆成小块。也许吧。

DragonBASIC 正在转移到一个新域名，所以旧 URL 现在失效了。目前你仍可以在[这里](http://forums.zhilaware.starfusion.orgb/)找到论坛，但编译器本身暂时还悬而未决。

### Aug 3, 2004 (v0.99.5)

- ![fix](./img/log/bul_excl.png) 做了一些全局的小修正。第一个 mode7 演示和页面现在为相机位置使用了不同的名字，这样它就不会和来自 mode7d 的 **v** 冲突。
- 以 `txt_demo` 的形式加入了一个简陋的文字演示。

我想这会是接下来一阵子的最后一次更新，原因有几个。首先，我想我得真正用上其中一些东西，才能看出哪里有问题。其次，我想我可能得在转换器，以及如何友好地把纯二进制文件加入演示上多花点功夫。第三，PERN 带着复仇回来了。这样一来，现在继续开发 Tonc 似乎没什么意义，因为新的 PERN 看起来会非常、非常完整。

### Jul 16, 2004 (v0.99.5)

- ![fix](./img/log/bul_excl.png) 修正了 `aff_rotscale2`，它本_不该_缩小源角度，而该缩小它的一个副本。把 `MAPBLOCK` 定义为包含 1024（=32\*32）个图块，而不是 512。之前和图块块搞混了。
- ![upgrade](./img/log/bul_upgr.png) 对图块/地图功能做了_很多_小改动。所有地图/图块结构现在都是简单的 typedef，所以你可以通过简单的数组访问来访问它们的内部，而不是用（内联）函数。内联函数本身已被移除。
- 稍微改了下 `BGINFO` 结构，并加了一些地图函数。

如果这些改动给你带来任何不便，我表示抱歉，但我认为从长远来看这样更好。

### Jul 11, 2004 (v0.99.4)

- 在 [setup](setup.html) 中降低了 MSVC makefile 项目的优先级。
- 清掉了 [mode7ex](mode7ex.html) 中几个不大不小、也不小不小的错误。嗯，我确实说过还会有一些我尚未发现的。
- ![swap](./img/log/bul_swap.png) 把寄存器 `REG_DISPSTAT` 的中断请求从 `X_INT` 改名为 `X_IRQ`，这样更规范。
- ![upgrade](./img/log/bul_upgr.png) 修改了 [swi.htm](swi.html)，展示如何为此使用纯汇编，并新增了一个关于 aapcs 的小节。同时也重命名了一些仿射结构体和函数；已经警告过你了。
- 还有更多拼写修正，它们到底是从哪儿冒出来的？我发誓如果我再看到一个 “it's”/“its” 混用我就要尖叫了。\[后来那天\] 好了，到此为止：_AAAAAAAARRRRHRHRHRRGGGHHHH!!!_
- ![fix](./img/log/bul_excl.png) 修正了若干旋转-缩放方程，它们在中间步骤里把旋转和缩放的操作弄错了。哎呀。
- ![fix](./img/log/bul_excl.png) 修正了一个窗口控制宏（忘了几个移位）。现在应该正常了。应该。
- 在库里加入了 `geom.h|.c`，因为我打算更频繁地使用点和矩形。同时也加入了 `ABS`、`SGN` 和 `SWAP` 宏。
- 所有 multiboot 演示（也就是全部）现在都带 `mb.gba` 扩展名，以表明身份。
- 把 `key_pressed()` 改名为 `key_hit()`，这样可以少一点关于这个函数到底做什么的困惑（感谢\^H\^Hs 提供名字的 Dark Angel（看，撇号几乎自动就出来了 <kbd>:(</kbd>）。

我正在做一个不错的文字系统。如果有人有需求我看看能做什么。

### June 27, 2004 (v0.99.3)

啊，终于到家了，这里有像样的电脑，还有 Kink-FM 从我的音响里轰出来，爽极了！<kbd>=)</kbd>

- ![upgrade](./img/log/bul_upgr.png) 在[选项列表](makefile.html#sec-flags)里加入了 `-Map` 和 `-Wl` 命令行选项。
- ![swap](./img/log/bul_swap.png) 把只使用一次的图形数据移到了使用它们的演示文件夹里；现在 gfx 目录里只有共享图形。
- ![swap](./img/log/bul_swap.png) 不得不重写 `swi.s`，因为 \`utils clean' 命令会销毁所有同名的 .s 文件（如果存在一个同名的 .c）。在复制新东西时，请确保你的 `utils` 目录里没有 `swi.c`。
- ![upgrade](./img/log/bul_upgr.png) [mode7ex.htm](mode7ex.html) 页面终于完成了。是的，我知道它又长又满是讨厌的线性代数；如果你读着费劲和/或有让它能更易读的建议，请告诉我。
- ![upgrade](./img/log/bul_upgr.png) 配套的 `mode7d` 演示基本达到了我想要的状态。当然还有一些小问题，但应该足够让你起步了。

### June 21, 2004 (v0.99.2)

- ![upgrade](./img/log/bul_upgr.png) 我对 `mode7d` 做了很多改动；所有真正的 mode 7 代码现在都在单独的文件中，所以在其他项目里使用它更容易了。不过 mode7ex.htm 还需要很多工作，你可以在 [m7theory.zip](../files/m7theory.zip) 找到大部分文字的草稿。是的，它是个 Word 文档；是的，我知道这很糟；是的，我会在文字稳定且易懂时把它转成 html（请告诉我这方面我需要改什么）；而且是的，我会手动做这个转换，因为 Word 应该被禁止在距离 HTML 500 码以内出现。也许更远。
- ![fix](./img/log/bul_excl.png) 对[矩阵](matrix.html)页面做了一些小修正。我真傻，把叉积的定义全搞错了。
- ![upgrade](./img/log/bul_upgr.png) 在[按键](keys.html)页面加入了关于 `REG_P1CNT` 的信息。这又是只有本站点覆盖的内容 <kbd>:)</kbd>。

在一台 P2-300、24MB 内存的机器上开发：VBA 以 50% 速度运行（mode7d 是 23%），最小化一个窗口要花几秒。靠，这太烂了。

### June 11, 2004 (v0.99.1)

- ![fix](./img/log/bul_excl.png) 修正了样式表，让背景图片、颜色、边框等等在 Mozilla 上如我所愿地显示。抱歉，不知道那些错误的注释会把事情搞砸这么多。做了一次校验，去掉了所有非法内容……除了一处：我用来把某些东西保持在一起的 \<nobr\> 标签。
- ![swap](./img/log/bul_swap.png) 所有 BIOS 调用现在都在 `swi.s` 里，用汇编。那里才是它们该在的地方。

### June 3, 2004 (v0.99)

- ![fix](./img/log/bul_excl.png) 发现了[环绕伪影](affobj.html#sec-wrap)，并相应修改了精灵页面。`obj_aff` 现在允许移动精灵，这样你可以亲眼看到这个伪影。
- ![swap](./img/log/bul_swap.png) 终于克服了对近乎空目录的厌恶（文件这样会太寂寞），把所有演示代码放进了单独的目录。现在，要是我也能克服我的 if 恐惧症就好了……
- 在 [swi.htm](swi.html#sec-vsync2) 加入了关于用中断做 vsync 的小节，以及配套演示 `swi_vsync`。你需要看看这些。
- 加入了 `int_enable_ex` 和 `int_disable_ex`，应该能让中断相关的工作更容易。不过，我并不是 100% 确定我是否把所有寄存器和标志都弄对了。
- ![fix](./img/log/bul_excl.png) C++ 不喜欢你对 volatile 变量做结构体拷贝，比如 `bga_update_ex` 所做的那样。或者应该说，曾经不喜欢。
- 学了一些新的 CSS 技巧，正在更新并结构化_所有_页面的布局。大部分是细微的东西，比如标准化方程布局，并给代码和寄存器列表加一个微妙边框，让它们在打印时更突出。不微妙的是，现在每张图片都应该有图注了。
- ![upgrade](./img/log/bul_upgr.png) 恢复了 [mode7ex.htm](mode7ex.html) 及其配套演示 `mode7d` 的工作。加入可变俯仰（pitch）比我想象的容易，w00t！不过还是有点小 bug。

有了这些改动，建议在升级时保存或移除旧的 Tonc 内容，以避免重复文件和其他不一致。

### May 24, 2004 (v0.98.5)

- ![upgrade](./img/log/bul_upgr.png) devkitARM 现在是 Tonc 的主要开发工具包。Makefile 和文字都已更新以匹配这一变化。
- ![upgrade](./img/log/bul_upgr.png) 现在使用一个单独的中断文件，而不是自定义的 crt0.S，并在这个过程中弄懂了这玩意儿的 The Point®。文字为了反映更新的见解做了修改，`int_demo.c` 也一样。
- 开始着手[术语表](glossary.html)。
- 在 Tonc 代码的 readme 里加入了如何不用 Visual C++ 运行 makefile 的说明。真蠢，我以前居然没想到。
- ![fix](./img/log/bul_excl.png) `REG_IF` 在 `0400:0202`，不是 `0400:0200`，哎呀！
- 如你所见，我正在尝试为日志条目使用特定含义的项目符号。不过我还得想清楚什么图片对应什么用途。
- 重写了 `tonc.mak` 里的 `build_all` 和 `clean_all` 目标。它们现在相当繁琐，但行为更正确，并且允许我在人们觉得把所有东西都堆在 `examples` 文件夹太乱时，切换到“一个演示，一个目录”的结构。

我现在非常非常累，所以如果我哪里搞砸了也不奇怪。等我有机会 sssslssszzzzzzz…… 的时候会修好的。

### May 16, 2004 (v0.98)

- ![fix](./img/log/bul_excl.png) 很多改动。首先，我终于有办法在真机上测试了，哇哦！！！不过，它也指出你终究不能把对象图块块用于背景 `:(`。我在好几个页面上加了我早期硬件测试的经验。
- ![fix](./img/log/bul_excl.png) 包括[窗口](gfx.html#sec-win)小节。看来你对窗口的垂直设置得非常小心。更新了窗口演示，不再用 u16 算术来计算窗口大小（它是按字节给的），并做了更精确的移动。
- ![swap](./img/log/bul_swap.png) 把 DMA 代码挪了挪。我现在用 `dma_memcpy()` 做一般拷贝，并把旧的 `DMA_CPY()` 宏重命名为 `DMA_TRANSFER`，还调整了参数顺序以匹配 `memcpy`。这样更有意义。
- ![swap](./img/log/bul_swap.png) 同时把 `oi_set` 改为 `oi_set_attr`，把 `oi_pos` 改为 `oi_set_pos`。
- `Tonc Utils` 配置现在把工具代码编译成一个库。这是 `mode7d` 需要的。
- 在 `tonc.mak` 里创建了 `build_all` 规则。手工重建所有东西真的让我抓狂。
- 更多随机清理。入口页面的图片现在也是链接了。重要提示现在放在红框里，更显眼。加入了 `bm_mode.c` 的演示代码，展示载入图片和使用按键的基本步骤。我应该更早把完整代码贴到教程前面。在 [affine.htm](affine.html#sec-finish) 加了一个定点数单位矩阵的例子，确保人们不会试图用浮点数。
- ![fix](./img/log/bul_excl.png) 修正了 [swi.htm](swi.html)。_又来了！_ 我发誓，如果我在这里再发现一个错误，有人就要挨揍了。而且挨揍的不会是我。这次是 arctan2 的范围错了（应该是整圈）。让这个错误更糟的是，我应该（也确实）一直知道它本来就该是整圈的；毕竟这是 arctan2 存在的理由。
- [矩阵页面](matrix.html) 完成了。
- 看 [villainsupply.com](http://www.villainsupply.com) 时差点从椅子上笑翻下来。哎哟。
- 看完 E3 上的任天堂东西后几乎被自己的口水淹死。咕噜。
- `key_demo` 里用的图片把 `KEY_START` 和 `KEY_SELECT` 的调色板索引搞反了。我从来没真正注意到，因为模拟器没有真正的 start 和 select 按钮。所以，又一次，硬件测试救了场。

### Apr 29, 2004 (v0.97)

- 加入了 devkitARM 的链接以及让它工作的说明。我非常有可能在未来切换到这个工具链。
- 把大多数宏转换成了内联函数。更安全、更易读，而且一样快。是的，请。
- 一些关于图块计数和仿射变换的更多图示。
- 待办：完成矩阵页面（也许还有 mode7ex 页面）。而且既然我有了我的[图块地图编辑器 Mirach](http://www.coranac.com/projects/#mirach)，我也也许能用它做点什么。而且我真的、真的需要开始搞一个文字系统了。

### Apr 9, 2004 (v0.97)

对象仿射函数现在有对应的背景版本了，而且 `mode7d` 进展顺利。

### Apr 4, 2004 (v0.96)

重命名了 OAM 结构体和相关项。_又_一次。这到底什么时候才是个头？！？另外，多亏了 Lupin 在 3D 精灵放置上的问题，我终于找回了对矩阵变换的感觉。既然又搞懂了，我希望在不久的将来扩充 mode7 章节。我已经有一个能用的 3D 精灵放置例子，就是以 `mode7d` 的形式。

### Mar 31, 2004 (v0.96)

在做向量/矩阵页面，一些页面顺序的调整，以及更多随机的小清理。

### Mar 24, 2004 (v0.96)

把 [swi.htm](swi_htm) 里的汇编清单替换成了正确的 Thumb 清单。我忘了我已经不用 ARM 代码了。

### Mar 20, 2004 (v0.96)

就在你以为做完了的时候，你又发现两件能改进的事。可恶。总之，我改了获取正弦和余弦的方式。它们现在都是宏，使用一个 512 项的 `s16` 正弦 LUT。另外，我终于想明白如何直接对 `vid_page` 做 XOR 来实现页翻转。还有，哦对了，用于“只编译不汇编”的编译器标志应该是 `-S`，不是 `-s`。哎呀。  
我想我终于知道如何修改我的仿射函数，使其无需使用 `OBJ_AFFINE` 结构也能应用于背景，不过真正去做可能还要一阵子。

### Mar 17, 2004 (v0.95)

在 `swi_demo` 里加入了 ArcTan2 函数，并修正了 `swi.htm` 仍然包含的那些错误。可恶，我还以为在最近一次名字和代码修改后，我已经彻底清除了所有不一致。

### Mar 14, 2004 (v0.95)

日志里的第一条。我重写了关于精灵和背景的部分，把 glyphs 改成 tiles、把 tiles 改成 tegels（希望我全改到了 `:]`），最后一次更新了所有代码，并写了关于如何设置 DKA、MSVC 和 makefile 的章节。我想 Tonc 现在可以投入使用啦，哇哦！
