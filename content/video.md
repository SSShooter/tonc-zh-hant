# 4. GBA 图形入门

<!-- toc -->

## 总体介绍 {#sec-intro}

GBA 拥有一块 240 像素宽、160 像素高的 LCD 屏幕，能够显示 32768（15 位）种颜色。刷新率略低于每秒 60 帧（59.73 Hz）。GBA 有 5 个可以包含图形的独立图层：4 个<dfn>背景</dfn>层和 1 个<dfn>精灵</dfn>层，并且能够实现一些特殊效果，包括混合两个图层、马赛克，当然还有旋转和缩放。

声音和按键功能只能将就着用为数不多的几个寒酸寄存器，而视频系统则拥有一大笔可供支配的内存（相对而言）。除了 I/O 内存中的大量寄存器外，还有 96kb 显存（从 `0600:0000h` 开始）、调色板内存（`0500:0000h`）和 OAM 内存（`0700:0000h`）。

## 绘制与消隐周期 {#sec-blanks}

如前所述，整个 GBA 屏幕每 1/60 秒刷新一次，但事情不止于此。一条扫描线绘制完（HDraw 周期，240 像素）后，在开始绘制下一条扫描线之前，会有一个停顿（HBlank，68 像素）。同样，在 160 条扫描线（VDraw）之后，有 68 条扫描线的消隐（VBlank），然后才重新开始。为避免画面撕裂，位置数据通常在 VBlank 更新。这就是为什么大多数游戏以 60 或 30 fps 运行。（顺带一提，在 VBlank 同步也正是我们 PAL 国家游戏常常更慢的原因：PAL 电视以 50Hz 运行（过去是），因此只有 50 fps 而非 60，如果没人费心去处理，游戏就会慢 17%。很少有公司这么做过 <kbd>:(</kbd> 。）

[CowBite Spec](http://www.cs.rit.edu/~tjh8300/CowBite/CowBiteSpec.htm#Graphics%20Hardware%20Overview) 和 [GBATEK](https://problemkaputt.de/gbatek.htm#lcddimensionsandtimings) 都给出了关于显示时序的一些有趣细节。一次完整的屏幕刷新恰好需要 280896 个周期，除以时钟速度得到 59.73 的帧率。从上面给出的绘制/消隐周期可以看出，每个像素有 4 个周期，每条扫描线有 1232 个周期。你可以在表 4.1 中找到时序细节的摘要。

<br>  

<table width=80%>
<tr align="center">
  <td>
  <div class="cpt" style="width:192px;">
  <img src="./img/gba_draw.png" id="fig:gba-draw" alt=""><br>
  <b>{*@fig:gba-draw}</b>: vdraw、vblank 与 hblank 周期。
  </div>

  <td>
	<table id="tbl:disp-timing" class="table-data">
	<caption align="bottom">
	  <b>{*@tbl:disp-timing}</b>: 显示时序细节
	</caption>
	<col>
	<col span=2 align="right">
	<tr align="center">
	  <th>项目	<th>长度		<th>周期
	<tr>
	  <td>像素		<td>     1		<td>     4
	<tr>
	  <td>HDraw		<td>   240px	<td>   960
	<tr>
	  <td>HBlank	<td>    68px	<td>   272
	<tr>
	  <td>扫描线	<td>Hdraw+Hbl	<td>  1232
	<tr>
	  <td>VDraw 	<td>160*扫描线<td>197120
	<tr>
	  <td>VBlank	<td>68*扫描线	<td> 83776
	<tr>
	  <td>刷新	<td>VDraw+Vbl	<td>280896
	</table>
</table>

## 颜色与调色板 {#sec-colors}

GBA 能够显示 5.5.5 格式的 16 位颜色。这意味着红色 5 位、绿色 5 位、蓝色 5 位；多出来的那一位未使用。基本上，位模式看起来像这样："<code>x<font color=blue>bbbbb</font><font color= green>ggggg</font><font color= red>rrrrr</font></code>"。在 `color.h` 中有一些 define 和宏能让处理颜色更容易。
<br>  
现在，关于调色板……

`<rant>`  
_伙计们，这里的词是 **“palette”**！一个 ‘l’，两个 ‘t’，末尾一个 ‘e’。它不是 **“pallet”**，后者是"一种低矮、可移动的台子，通常是双面的，用来堆放材料以便仓储或运输，比如在仓库里"；也不是 **“pallette”**，意思是"一副盔甲中保护腋窝的护板"。其最常见变体 **“pallete”** 甚至不在词典里，因此根本不值得考虑。是“palette”，各位，是“palette”。_  
`</rant>`

总之，GBA 有两个调色板，一个用于精灵（对象），一个用于背景。两个调色板都包含 256 个 16 位颜色项（各 512 字节）。背景调色板从 `0500:0000h` 开始，紧跟着是 `0500:0200h` 处的精灵调色板。精灵和背景可以用两种方式使用这些调色板：作为包含 256 种颜色（每像素 8 位）的单一调色板；或作为 16 个包含 16 种颜色（每像素 4 位）的子调色板或<dfn>调色板组</dfn>。

关于调色板最后一件事：索引 0 是<dfn>透明索引</dfn>。在调色板模式中，值为 0 的像素将是透明的。

## 位图、背景与精灵 {#sec-vid-types}

总而言之，GBA 知道 3 种图形表示：<dfn>位图</dfn>、<dfn>图块背景</dfn>和<dfn>精灵</dfn>。位图和图块背景（也简称为背景）类型影响整个屏幕的构建方式，因此无法同时被激活。  
在位图模式中，显存的工作方式就像一个 *w*×*h* 的位图。要在位置 (*x,y*) 处画一个像素，就走到 *y\*w+x* 的位置并填入颜色。注意，你无法在 GBA 上每帧都构建一整屏单独的像素，它们的数量实在太多了。

图块背景的工作方式完全不同。首先，你把 8x8 像素的<dfn>图块</dfn>存放在显存的某一部分。然后，在另一部分，你构建一个图块地图，其中包含索引，告诉 GBA 哪些图块进入你在屏幕上看到的图像。要构建一屏，你只需要一个 30x20 的数字地图，硬件就会负责绘制这些数字所指向的图块。这样一来，你*可以*每帧更新整个屏幕。极少有游戏不依赖这种图形类型。

最后，我们有精灵。精灵是小型（8x8 到 64x64 像素）的图形对象，可以彼此独立地变换，并可与位图或图块地图背景类型配合使用。

:::tip 优先使用图块模式而非位图模式

在几乎所有类型的游戏中，图块模式都更合适。大多数其他教程聚焦于位图模式，但那仅仅是因为它们对新手更友好，而非因为它们对游戏有实际价值。绝大多数商业游戏都使用图块模式；这应该能说明些什么。

:::

这就是三种基本图形类型，尽管也能想到其他分类方式。例如，位图和图块背景类型，由于它们互斥且使用整个屏幕，构成了<dfn>背景</dfn>类型。此外，碰巧图块背景的图块与精灵有着相同的内存布局（即，以 8x8 像素图块为一组）。这使图块背景和精灵成为图块类型。

## 显示寄存器：REG_DISPCNT、REG_DISPSTAT 与 REG_VCOUNT {#sec-vid-regs}

在做任何图形相关的事时，你会遇到三个 I/O 寄存器：显示控制 `REG_DISPCNT (0400:0000h)`、显示状态 `REG_DISPSTAT (0400:0004h)` 和扫描线计数器 `REG_VCOUNT (0400:0006h)`。这些名字只是到内存位置的 define，原则上可以随意选择。然而，我们将使用它们在 [Pern Project](http://www.drunkencoders.com) 中出现的名字，因为它们最常见。

REG_DISPCNT 寄存器是屏幕的主要控制。该寄存器的位布局及其含义可以在下表中找到。这是我用于寄存器或类寄存器区域的一般格式。该格式的细节已经在[前言](intro.html#ssec-note-reg)中解释过了。

<div class="reg">
<table class="table-reg" id="tbl:reg-dispcnt">
<caption class="reg">
  REG_DISPCNT @ 0400:0000h
</caption>
<tr class="bits">
	<td>F<td>E<td>D<td>C<td>B<td>A<td>9<td>8
	<td>7<td>6<td>5<td>4<td class="rof">3<td>2 1 0
<tr class="bf">
	<td class="rclr4">OW
	<td class="rclr4">W1
	<td class="rclr4">W0
	<td class="rclr1">Obj
	<td class="rclr1">BG3
	<td class="rclr1">BG2
	<td class="rclr1">BG1
	<td class="rclr1">BG0
	<td class="rclr6">FB
	<td class="rclr2">OM
	<td class="rclr5">HB
	<td class="rclr3">PS
	<td class="rclr7">GB
	<td class="rclr0">Mode
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="12%">
<tr align="left"><th>bits<th>name<th>define<th>description
<tbody valign="top">
<tr class="bg0">
  <td>0-2 <td class="rclr0">Mode
  <td>DCNT_MODEx. <i>DCNT_MODE#</i>
  <td>设置视频模式。0、1、2 是图块模式；3、4、5 是位图模式。
<tr class="bg1">
  <td class="rof">3   <td class="rclr7">GB
  <td>DCNT_GB
  <td>如果卡带是 GBC 游戏则置位。只读。
<tr class="bg0">
  <td>4   <td class="rclr3">PS
  <td>DCNT_PAGE
  <td>页选择。模式 4 和 5 可以使用页翻转来实现更流畅的动画。该位选择显示的页（并允许在另一页上绘制而不产生瑕疵）。
<tr class="bg1">
  <td>5   <td class="rclr5">HB
  <td>DCNT_OAM_HBL
  <td>允许在 HBlank 中访问 OAM。OAM 在 VDraw 中通常锁定。会减少每行渲染的精灵像素数。
<tr class="bg0">
  <td>6   <td class="rclr2">OM
  <td>DCNT_OBJ_1D
  <td>对象映射模式。图块内存可以看作一个 32x32 的图块矩阵。当精灵由多个图块竖向组成时，该位告诉下一个图块行是位于前一个下方（符合矩阵结构，2D 映射，<code>OM</code>=0），还是紧挨着它（使内存排列为精灵数组，1D 映射 <code>OM</code>=1）。更多内容见[精灵](regobj.html)章。
<tr class="bg1">
  <td>7   <td class="rclr6">FB
  <td>DCNT_BLANK
  <td>强制屏幕消隐。
<tr class="bg0">
  <td>8-C  <td class="rclr1">BG0-BG3, Obj
  <td>DCNT_BGx, DCNT_OBJ. <i>DCNT_LAYER#</i>
  <td>启用相应背景和精灵的渲染。
<tr class="bg1">
  <td>D-F <td class="rclr4">W0-OW
  <td>DCNT_WINx, DCNT_WINOBJ
  <td>分别启用窗口 0、1 和对象窗口的使用。窗口可用于遮罩某些区域（就像《塞尔达：众神的三角力量》里那盏灯做的那样）。
</tbody>
</table>
</div>

设置显示控制大概是你最先会做的事。对于简单的演示程序，你可以只设置一次就保持不动，尽管在视频模式之间切换能产生一些有趣的效果。
<br>  
现在说我提到的另外两个寄存器，`REG_DISPSTAT` 和 `REG_VCOUNT`。后者告诉你当前正在处理的扫描线。注意这个计数器会一直进入到 VBlank，所以它会数到 227 才重新从 0 开始。前者给你关于绘制/消隐状态的信息，并用于设置显示[中断](interrupts.html)。你也可以用这里能启用的中断做一些很酷的事。比如，HBlank 中断就用于创建 [Mode 7](mode7.html) 图形，而你肯定想知道它是怎么工作的，不是吗？

<div class="reg">
<table class="table-reg" id="tbl:reg-dispstat">
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

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
  <col class="def" width="15%">
<tr align="left"><th>bits<th>name<th>define<th>description
<tbody valign="top">
<tr class="bg0">
  <td>0<td class="rclr0">VbS
  <td>DSTAT_IN_VBL
  <td>VBlank 状态，只读。会在 VBlank 内置位，在 VDraw 内清除。
<tr class="bg1">
  <td>1 <td class="rclr1">HbS
  <td>DSTAT_IN_HBL
  <td>HBlank 状态，只读。会在 HBlank 内置位。
<tr class="bg0">
  <td>2 <td class="rclr2">VcS
  <td>DSTAT_IN_VCT
  <td>VCount 触发状态。如果当前扫描线与扫描线触发器匹配则置位（<code>REG_VCOUNT</code> == 
    <code>REG_DISPSTAT</code>{8-F}）
<tr class="bg1">
  <td>3 <td class="rclr0">VbI
  <td>DSTAT_VBL_IRQ
  <td>VBlank 中断请求。如果置位，将在 VBlank 触发中断。
<tr class="bg0">
  <td>4 <td class="rclr1">HbI
  <td>DSTAT_HBL_IRQ
  <td>HBlank 中断请求。
<tr class="bg1">
  <td>5 <td class="rclr2">VcI
  <td>DSTAT_VCT_IRQ
  <td>VCount 中断请求。如果当前扫描线匹配触发值则触发中断。
<tr class="bg0">
  <td>8-F <td class="rclr3">VcT
  <td><i>DSTAT_VCT#</i>
  <td>VCount 触发值。如果当前扫描线处于此值，第 2 位置位，并在被请求时触发中断。
</tbody>
</table>
</div><br>

<div class="reg">
<table class="table-reg" id="tbl:reg-vcount" width="320">
<caption class="reg">
  REG_VCOUNT @ 0400:0006h (read-only)
</caption>
<tr class="bits">
	<td>F E D C B A 9 8
	<td class="rof">7 6 5 4 3 2 1 0
<tr class="bf">
  <td>-
  <td class="rclr0">Vc
</table>

<table class="table-reg-vert">
  <col class="bits" width=40>
  <col class="bf" width="8%">
<tr align="left"><th>bits<th>name<th>description
<tbody valign="top">
<tr class="bg0">
  <td>0-7 <td class="rclr0">Vc
  <td>垂直计数。范围是 [0,227]
</tbody>
</table>
</div>

## 垂直同步 第一部分：忙等待循环 {#sec-vsync1}

如前所述，把 VBlank 用作计时机制并更新游戏数据。这被称为 <dfn>vsync</dfn>（**v**ertical **sync**hronisation，垂直同步）。有若干种 vsync 的方法。两种最常用的方法使用 while 循环并检查 `REG_VCOUNT` 或 `REG_DISPSTAT`。例如，由于 VBlank 从扫描线 160 开始，你可以观察 `REG_VCOUNT` 何时超过这个值。

```c
#define REG_VCOUNT *(u16*)0x04000006

void vid_vsync()
{    while(REG_VCOUNT < 160);   }
```

不幸的是，这段代码有几个问题。

首先，如果你只是做一个空的 `while` 循环来等待 160，编译器可能会自作聪明，注意到循环不会改变 `REG_VCOUNT`，于是把它的值放进寄存器以便快速引用。由于这个值很可能在某个时刻低于 160，你就得到了一个漂亮的小无限循环。为防止这一点，请使用关键字 _`volatile`_（见 `tonc_memmap.h` 和 `tonc_types.h`）。

其次，在小演示程序里，仅仅等待 VBlank 还不够；当你再次调用 `vid_sync()` 时，你可能仍处在那个 VBlank 内，它会立即通过。这并不能同步到 60 fps。为此，你必须先等到*下一个* VDraw。这使我们的 `vid_sync` 看起来像这样：

```c
#define REG_VCOUNT *(vu16*)0x04000006

void vid_vsync()
{
    while(REG_VCOUNT >= 160);   // wait till VDraw
    while(REG_VCOUNT < 160);    // wait till VBlank
}
```

这总会等到下一次 VBlank 开始。而 `REG_VCOUNT` 现在是 _`volatile`_（"vu16" 被 <u>v</u>olatile <u>u</u>nsigned（<u>16</u>位）short typedef 而来。我会大量使用这类简写，所以习惯它吧）。这是一种做法。另一种是检查显示状态寄存器 `REG_DISPSTAT`\{0\} 中的最后一位。
<br>  
所以我们搞定了，对吧？呃……不，不完全是。虽然你现在有一个简单的 vsync 方法，但它也是一种非常糟糕的方法。当你在 while 循环里时，你仍在消耗 CPU 周期。这当然耗电。而且由于你在这个 while 循环里啥也不干，你不只是用了它，你实际上是在浪费电量。此外，由于你一开始大概只会做小游戏，你将浪费*大量*的电量。推荐的 vsync 方法是：在事情做完后让 CPU 进入低功耗模式，然后用中断把它唤醒。你可以在[这里](swi.html#sec-vsync2)读到这个过程，但既然你必须知道如何使用[中断](interrupts.html)和 [BIOS 调用](swi.html)，你或许想等一会儿。
