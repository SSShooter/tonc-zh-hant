# 简介

<!-- toc -->

## 组织结构 {#sec-org}

<!-- <div class="cpt_fr" style="width:120px;">
  <img alt="Tonc directory structure" src="./img/toncdirs.png" id="fig:toncdirs">

  **{*@fig:toncdirs}**: directories.
</div> -->

TONC 由三个部分组成：一个<dfn>文本</dfn>部分（即实际的教程）、一个<dfn>示例</dfn>仓库（包含所有各种演示程序的源代码和 makefile），以及一个名为 <dfn>libtonc</dfn> 的库（其中包含本教程全程引入的所有有用/可复用的代码）。

此前这些都以 zip 文件形式分发，但时代变了，现在它们存在于各自独立的 git 仓库中。下面将更详细地说明：


### Tonc 文本 {#ssec-org-text}

你正在阅读的文本部分，详细讲述了 GBA 编程的原理。这里的重点与其说在于如何把某件事做成，不如说在于事情究竟*如何运作*，以及为何要这样做。在那之后，"怎么做"往往就水到渠成了。每一章都带有一个或多个对所述理论的演示，以及对演示本身的简要讨论。

请不要犯只看演示讨论的错误：要真正理解运作原理，你需要通读全文。虽然有些部分是可选的，也有整页看似与实际 GBA 编码无关的无聊文字，但它们存在是有原因的，通常包含额外的概念性信息或陷阱。

起初，文本部分里代码很少，因为我觉得演示代码就在手边，在它们之间翻看并不烦人。嗯，我已经意识到我错了，并正在把更多代码纳入这些页面；也许还不足以让你复制粘贴就能干净地编译，但足够配合演示的讲解。

主要语言是 C，外加一点点汇编。这是 GBA 编程中使用的两种主要语言，尽管还有其他语言存在。由于编程基础与语言无关，你应该能轻松地把它们适配到你选择的语言。

GBA 编程是贴近硬件的，所以我希望你了解你的指针、[十六进制数](numbers.html#sec-num)和[布尔代数/位运算](numbers.html#sec-bitops)。这里也有相当多的数学，主要是[向量和矩阵](matrix.html)相关的，所以我希望你的线性代数跟得上。最后，我假定你的智力水平高于一只随机的实验室猴子，所以我不会对我认为是琐碎的事情过多赘述。

除了简介和附录，文本分为 3 个部分。首先是"基础"，讲解完成任何事都绝对必要的要点。包括搭建开发环境、图形与按键的基本使用。它还包含关于底层编程和高效编程意味着什么的文字；这些在我看来你最好越早学越好。第二部分涵盖了 GBA 的大部分其他内容，比如特殊图形效果、定时器和中断。最后一部分涵盖更高级的主题，会用到所有章节中的元素。包括写文字（没错，在 GBA 上这是个高级主题）、mode 7 图形，以及一章关于 ARM 汇编的内容。

文本的 Markdown 源码全部[发布在 GitHub 上](https://github.com/gbadev-org/tonc)，所以如果你发现错别字或可以改进的地方，请随时参与贡献。

<!--
TODO: maybe provide links to PDF and 'offline' html downloads?

Individual html: [tonc-text.zip](http://www.coranac.com/files/tonc-text.zip) (663 kb)  
Compiled html (CHM, v1.4 version): [tonc.chm](http://www.coranac.com/files/tonc.chm) (1.2 MB).  
PDF: [tonc.pdf](http://www.coranac.com/files/tonc.pdf) (3.1 MB)
-->

### Tonc 代码（libtonc 与示例） {#ssec-org-code}

文本中提到的所有演示程序的源代码可以在 [libtonc-examples](https://github.com/gbadev-org/libtonc-examples) 仓库中找到。和文本一样，示例本身也分为 3 个部分：*basic*、*extended* 和 *advanced*。还有一个 `lab` 目录，里面放着几个有趣的项目，但可能还不够完善。不过看看还是很有意思的。

我们将使用的语言是 **C**，外加一点汇编（但*不是* C++）。我假定你熟悉这门语言。如果不熟，先去学，因为我不会教你；这不是 C 语言课程。我在[参考](refs.html#ssec-tut)里放了一些 C 教程的链接。

与一些较老的 GBA 教程不同，tonc 使用 **makefile** 而非批处理脚本来构建示例项目，因为它们就是 Plain Better™（显然更好）。如何使用它们将在下一章讲解，但如果你只是想看看预编译好的示例 ROM，它们仍然可以在这里获取：[tonc-bin.zip](http://www.coranac.com/files/tonc-bin.zip)。

示例依赖于 [libtonc](https://github.com/gbadev-org/libtonc)，这是一个库，包含本教程全程引入的所有重要 #define 和函数。这还包括针对所有视频模式的文本写入器、BIOS 例程、一个相当先进的中断分发器、安全而快速的内存复制与填充例程，以及更多内容。历史上 `libtonc` 是和示例放在一起的，但如今它随 devkitARM 一起提供，所以你不必自己下载。

### 写作宗旨 {#ssec-org-sop}

我写 Tonc 有两个原因。首先，作为理清自己思路的一种方式。当你把东西写下来并从中学习时，你常会以不同的视角看待事物。其次，其他教程中有大量*非常糟糕*的信息（据我所知，唯一的例外是[新版 PERN](http://www.drunkencoders.com/web.archive.org/web/20030413142151fw_/http_/www.thepernproject.com/English/tutorial.html) 和 [Deku 的声音教程](https://stuij.github.io/deku-sound-tutorial/)）。是的，我知道这话听起来怎么样，但不幸的是它恰好是事实。几个例子：

-   只给出非常基础的信息，有时甚至是[不正确的信息](affine.html)。
-   强烈聚焦于位图模式，而位图模式在严肃的 GBA 编程中几乎从不使用。
-   [糟糕的编程习惯](first.html#ssec-notes-bad)。通过[#include 文件](bitmaps.html#ssec-data-hdr)向项目添加代码/数据，使用古老的[工具链](setup.html#sec-alt)、非最优的编译器设置与数据类型，以及低效（有时*非常*低效）的代码。

如果你是新手并且跟着其他教程走，一切看起来都正常，那问题在哪？嗯，这其实正是问题的一部分。一切都会*看起来*正常，直到你开始更大的项目，那时你会发现隐藏的错误，而缓慢的代码真的会拖垮一切，你还得忘掉所有养成的坏习惯，从头重做。GBA 是为数不多的几个高效编码仍有意义的平台之一，有时只需要改个数据类型或编译器开关就够了。这些事最好从一开始就做对。

我力求先求完整，再求简单。正如某位乱发科学家曾说过的："把事情做得尽可能简单，但别更简单。"这意味着内容有时看起来会有点技术化，但那只是因为事情*本来*有时就很技术化，假装它们不是毫无意义。

简而言之，Tonc *不是*"GBA 编程傻瓜书"，过去不是，将来也不会是。给傻瓜们的东西已经够多了。如果你认为自己是傻瓜（我说的确实是傻瓜，不是新手），也许 Tonc 不是合适的地方。但如果你是认真想学 GBA 编程，那就别将就。

## 术语与记号 {#sec-nota}

我受训成为一名物理学家，这意味着我懂数学及其记号约定。我在 Tonc 中相当频繁地使用这两者，以及若干 html 标签约定。为确保所有人在同一频道上，这里有一份清单：

<div class="lblock">
  <table class="table-data">
    <tr><th>类型	<th>记号	<th>示例
    <tr><td><code>foo</code> 中的第 n 位		<td><code>foo</code>{n}	
    <td><code>REG_DISPCNT{4}</code>（活动页位）
    <tr><td>代码	<td>&lt;code&gt; 标签	<td> <code>sx</code>
    <tr><td>命令/文件 <td>&lt;tt&gt; 标签 <td> <tt>vid.h</tt>
    <tr><td>矩阵	<td>粗体、大写		<td> <b>P</b>
    <tr><td>内存  <td>十六进制 + 代码			<td> <code>0400:002eh</code>
    <tr><td>新术语 <td>粗体、斜体		<td> <dfn>charblock</dfn>
    <tr><td>变量 <td>斜体			<td> <i>x</i>
    <tr><td>向量	<td>粗体、小写		<td> <b>v</b>
  </table>
</div>

我也会使用一些非 ASCII 符号，根据浏览器新旧程度，它们可能无法正常显示。这些符号是：

<div class="lblock">
<table class="table-data">
<tr><th>符号<th>描述
<tr><td>&alpha;, &beta;, &gamma;	<td>希腊字母
<tr><td>&asymp;		<td>约等于
<tr><td>&frac12;	<td>二分之一
<tr><td>&frac14;	<td>四分之一
<tr><td>&frac34;	<td>四分之三
<tr><td>&ge;		<td>大于等于
<tr><td>&harr;		<td>双向箭头
<tr><td>&isin;		<td>属于（某个区间）
<tr><td>&lang; &rang;		<td>左/右"括号"（bra & ket）
<tr><td>&rarr;		<td>右箭头
<tr><td>&sup2;		<td>上标 2
<tr><td>&times;		<td>乘号
</table>
</div>

我还大量使用 C 基础类型的简写，比如 `char` 和 `int` 之类。这些 typedef 能更好地表明所用变量的大小。由于这在主机编程中非常重要，它们相当常见。无论如何，这里有一份清单。

<div class="lblock">
<table class="table-data">
<tr><th>基础类型	<th>别名 <th>无符号	<th>有符号	<th>volatile
<tr><th>char		<td>byte	 <td>u8			<td>s8		<td>vu8 / vs8
<tr><th>short		<td>halfword <td>u16		<td>s16		<td>vu16 / vs16
<tr><th>int			<td>word	 <td>u32		<td>s32		<td>vu32 / vs32
</table>
</div>

最后，对于十六进制有若干不同的记法，我会根据情况切换。C 记法（‘0x’ 前缀，0x0400）对普通数字很常见，但有时我也会用汇编后缀（‘h’，0400:0000h）。这里的冒号仅为了便于阅读。没有它很难数清零的个数。

### 寄存器名称与描述 {#ssec-note-reg}

让 GBA 做事常常涉及使用所谓的 <dfn>IO 寄存器</dfn>。内存中特定地址上的特定位可以用作 GBA 各种能力的开关。每个寄存器都被别名成一个普通变量，你需要用位运算来设置/清除位。我们稍后会讲到这些寄存器在哪里、各个位做什么；现在我想向你展示我将如何*呈现*它们，以及在文本中如何引用它们。

每个寄存器（或类寄存器地址）都被映射到一个解引用的指针，通常长 16 位。例如，显示状态寄存器是

```c
#define  REG_DISPSTAT *(u16*)0x04000004     
```

每当我引入一个寄存器，我都会像这样给出位的概览：

<div class="reg">
<table class="table-reg"
  border=1 frame=void cellPadding=4 cellSpacing=0>
<caption class="reg">
  REG_DISPSTAT @ 0400:0004h
</caption>
<tr class="bits">
  <td>F E D C B A 9 8
  <td>7 6<td>5<td>4<td>3<td class="rof">2<td class="rof">1<td class="rof">0
<tr class="bf">
  <td class="rclr3">VcT
  <td>-
  <td class="rclr2">VcI
  <td class="rclr1">HbI
  <td class="rclr0">VbI
  <td class="rclr2">VcS
  <td class="rclr1">HbS
  <td class="rclr0">VbS
</table>
</div>

该表列出了寄存器的名称（`REG_DISPSTAT`）、它的地址（0400:0004h）以及各个位或位域。有时，某些位或整个寄存器是只读或只写的。**只读**用红色上划线表示（如这里所用）。**只写**用蓝色下划线表示。随后会有一个列表描述各个位，并给出我为该位使用的 #define 或 #defines：

<div class="reg">
<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="15%">
<tr align="left"><th>bits<th>name<th>define<th>description
<tbody valign="top">
<tr class="bg0">
  <td>0 <td class="rclr0">VbS
  <td>DSTAT_IN_VBL
  <td>VBlank 状态，只读。会在 VBlank 内置位，在 VDraw 内清除。
<tr class="bg1">
  <td colspan=4 align="center"><i>other fields</i>
<tr class="bg0">
  <td>8-F <td class="rclr3">VcT
  <td><i>DSTAT_VCT#</i>
  <td>VCount 触发值。如果当前扫描线处于此值，则第 2 位置位，并在被请求时触发中断。
</tbody>
</table>
</div>

`REG_DISPSTAT` 的完整列表可以在[这里](video.html#tbl-reg-dispstat)找到。顺便说一句，#define 通常是 tonc 特有的。每个站点和 API 在这里都有自己的术语。这是可能的，因为重要的不是名字，而是它们所代表的数字。当然，寄存器本身的名字也是如此。关于 #define 最后一点：列出的其中一些带有井号（‘#’）后缀。这是一种简写记号，表示该字段有 *foo*`_SHIFT` 和 *foo*`_MASK` 两个 #define，以及 *foo*`()` 宏。例如，显示寄存器有一个 8 位的触发 VCount 字段，它在 define 列中列为‘*DSTAT_VCT#*’。这意味着以下三样东西存在于 tonc 头文件中：

```c
#define DSTAT_VCT_MASK      0xFF00
#define DSTAT_VCT_SHIFT          8
#define DSTAT_VCT(_n)       ((_n)<<DSTAT_VCT_SHIFT)
```

最后，作为寄存器特定位的简写，我会用花括号。其中的数字会是十六进制数。例如，REG_DISPCNT{0} 是 VBlank 状态位（上面的 VbS），而 REG_DISPCNT{8-F} 则是整个 VCount 触发字节。

## 关于错误与建议 {#sec-feedback}

尽管我们（cearn 和 gbadev.net 社区）已尽力剔除拼写/语法错误和失效链接，但肯定仍有可能有漏网之鱼。如果你发现了，请在 [GitHub 仓库](https://github.com/gbadev-org/tonc) 上提出 issue（或者更好的做法是，发一个 pull request）。当然，如果内容不清晰、或 _\*倒吸一口凉气\*_ 有误，或者你有建议，我们也想知道！你也可以通过 [Discord / IRC](https://gbadev.net/resources.html#community) 或[论坛](https://forum.gbadev.net/)联系我们。


当然，还有：

> 本发行版按原样提供，不附带任何担保。对于因使用或无法使用本发行版而引起的任何损害，我不承担责任。代码已在模拟器和真实硬件上尽我所能进行了测试，但我无法保证 100% 正确。
> 文本和代码随时可能修改。请不时回来看看是否有变化。<!--时间截在每页底部，以及所有源文件顶部。--> 附录中也有一份[更新日志](log.html)。

好了，就这些。玩得开心。

<div style="margin-left:1.2cm;">

-- _Jasper Vijn_（jakvijn at gmail dot com）与 _gbadev.net_ 社区<br>

<!--(Mar 24, 2013)-->
<!-- TODO: figure out how to put the build date here? -->
</div>
