# 19. 文本系统

<!-- toc -->



:::note 弃用通知

本章已被 [TTE](tte.html) 取代。本章中的信息仍可能有用，但若用于严肃工作，应优先使用 TTE。

:::

## 简介 {#sec-intro}

<div id="{#cd-hello}">

```c
#include <stdio.h>

int main()
{
    printf("Hello World");
    return 0;
}
```

</div>

啊，没错，“Hello world”：每个 C 语言课程和系统的经典第一个例子。主机（console）除外。虽然在 PC 上打印文本是世界上最简单的事，但在主机上其实有点棘手。倒不是因为没有 `printf()` 函数，而是因为根本没地方让它往里写，甚至也没有用来写字的字体（而且需要考虑的东西远不止这些）。不，如果你想显示文本，就得完全从零自己构建。而你确实希望能在屏幕上写字，

那么，文本系统需要什么？嗯，这其实不是个简单的问题。显然，你需要一个字体。就是一张包含各种字符的位图，在 GBA 上没必要用矢量字体让自己郁闷。其次，你需要一种方法把特定字符显示到屏幕上。

不过等等，我们用的是哪种视频模式？有图块、位图模式和精灵可供选择，它们全都需要用完全不同的方式来处理。我们是只支持其中一种，还是做一个对所有模式都适用的东西？另外，我们用的字体是什么，字符尺寸多大？定宽还是变宽？变宽和变尺寸在图块模式下问题不大，但要把它们拼接到图块里就麻烦了。还有，仅就图块而言，我们要把整个字体都保留在 VRAM 里吗？那样会占用大量图块，尤其是考虑到你几乎不会同时用到所有字符。只把当时用到的字形复制进去对 VRAM 更省，但这需要一些管理。

仅凭这些条目，就足以衍生出 20 多种互不兼容的文本系统实现，它们之间的差异非常微妙。至少每种都需要一个 `putc()` 和一个 `puts()`。也许还需要一个 `printf()` 之类的函数；注意，是针对每种文本类型各写一个，因为字形摆放是在内部进行的。也许还需要清屏功能；或者滚动功能怎么样？嗯，你大概明白了。

我觉得做一个庞大、复杂的系统，去迎合任何人可能有的所有需求是有可能的。但我不会这么做。首先，因为这有点浪费时间：你几乎（甚至根本）不可能需要同时运行位图和图块地图模式。大多数时候，你会只用一种视频模式并坚持用它。为所有可能的变体花时间（和空间），而它们几乎永远不会被用到，可能并不值得。此外，写大量几乎一模一样、只是在例程核心处有细微差别的代码，实在很无聊。

本章的目的在于展示如何构建并使用一组简单、轻量的文本写入函数。别指望什么终极文本系统，我主要感兴趣的是把本质的事做完，也就是把字符串里的字符显示到屏幕上。这是一个核心文本系统，具备以下特性：

- 位图（模式 3、4、5）、常规图块地图（模式 0、1）和精灵支持。
- 会有一个 `xxx_puts()` 用于显示字符串，还有一个 `xxx_clrs()` 用于清除它。它们的参数是字符串、要绘制到的位置，以及一些颜色信息。如果你想要滚动和/或格式说明符，我留给你自己实现。
- 字体是定宽、单色的字体，每个字符对应一个 8x8 图块。字形可以小于 8x8，我甚至会留下支持变宽的钩子，但要是允许多图块字体事情就糟透了。
- 可变的字符映射。如果你想只用一小部分字符，或非 ascii 的字形排列顺序，这是个很棒的特性。

这种安排能覆盖最基本的情况，并允许在设置上有一些变化，但在其他方面变化很少。然而，那些额外的功能多半与具体游戏强相关，可能并不适合放到通用文本系统里。如果你想要额外功能，自己写应该不难。

:::note 没有 printf()。真的吗？

我说过 GBA 上没有 `printf()`，但这并不完全正确；至少现在不成立了。可以把自己的 IO 系统挂接到标准 IO 例程上，这正是 `libgba` 所做的。

:::

:::note 半过时

我这里还有另一个文本系统，比本页描述的要强大得多（也就是真正能在每种视频模式下工作，并且也有 printf）。不过它相当庞大，尚未完全完成，而且要写描述页面、把文本改得适合这些演示程序还需要花些时间。带有相关改动的 libtonc 版本可以在 [http://www.coranac.com/files/misc/tonclib-1.3b.rar](http://www.coranac.com/files/misc/tonclib-1.3b.rar) 找到。

:::

## 文本系统内部原理 {#sec-in}

### 变量 {#ssec-in-tb}

为了跟踪文本系统的状态，我们需要几个变量。最明显的变量是字体和字符映射。因为我喜欢保持灵活，我还会为它们各用一个指针，这样你就可以用自己的字体和字符映射（如果你愿意）。你还需要知道要往哪里写，这通过一个基准目标指针来实现。作为额外项，我还会为可变字形间距准备字符尺寸变量，甚至还有一个指向字符宽度数组的指针，用于可能的变宽字体。

我会用一个结构体来存储这些，部分是因为我维护起来更容易，也因为 CPU 和编译器能更高效地处理结构体。我还会留几个字节的空位以便将来扩展。最后，是这个结构体的一个实例，以及一个指向它的指针，以便你在需要时能（虽然不太可能，但依然可以）在不同系统间切换。是的，我是在浪费几个字节，但如果你因为这个把 IWRAM 用爆了，我敢说你还有更大的麻烦要操心。

```c{#cd-txt-base}
// In text.h
typedef struct tagTXT_BASE
{
    u16 *dst0;      // writing buffer starting point
    u32 *font;      // pointer to font used
     u8 *chars;     // character map (chars as in letters, not tiles)
     u8 *cws;       // char widths (for VWF)
     u8  dx,dy;     // letter distances
    u16  flags;     // for later
     u8  extra[12]; // ditto
} TXT_BASE;

extern TXT_BASE __txt_base, *gptxt;

// In text.c
TXT_BASE __txt_base;                Main TXT_BASE instance
TXT_BASE *gptxt= &__txt_base;        and a pointer to it
```

### 字体 {#ssec-in-font}

<div class="lblock">
  <div class="cpt" style="width:400px;">
    <img src="img/tonc_font.png" alt="Default tonc font" id="fig:img-tonc-font">
    <br>

**{\*@fig:img-tonc-font}**：默认的 tonc 字体：mini-ascii，单色，每字形 8x8 像素。

  </div>
</div>

@fig:img-tonc-font 展示了我将要使用的字体。这个特定字体是单色的，每个字形都装进一个 8x8 的方框里。这 96 个字形本身是整个 ASCII 的一个子集，我称之为 <dfn>mini-ascii</dfn>。它是包含标准 ASCII 表大部分内容的下半部分，但去掉了 ASCII 0-31，因为它们是转义码，本来就不是可打印字符。

也可以使用另一种字形排列顺序的不同字体，但我下面给出的函数依赖每个字形只用一个图块、而且是图块布局。我需要这种排列，因为我要让它对所有模式都适用，而非单图块的格式在图块模式下简直是噩梦。

另一个限制是字体必须被打包成 1bpp。我有几个理由。首先，是体积考虑。一个 96 字形、16 位的字体（用于模式 3/5）会占用 12kB。打包成 1bpp 后不到 1kB！是的，你被限制为单色，但对字体来说这其实问题不大。字体通常本来就是单色的，而只用 1 位却用了 16 位似乎有点浪费。其次，你怎么让一个 16bpp 字体用于 4bpp 或 8bpp 图块？从低位深到高位深要容易得多。当然，如果你不喜欢这种安排，尽管自己写函数。

至于字体数据本身，就是下面这一整坨。

<pre id="cd-toncfont"><code class="language-c hljs">const unsigned int toncfontTiles[192]=
{
    0x00000000, 0x00000000, 0x18181818, 0x00180018, 0x00003636, 0x00000000, 0x367F3636, 0x0036367F,
    0x3C067C18, 0x00183E60, 0x1B356600, 0x0033566C, 0x6E16361C, 0x00DE733B, 0x000C1818, 0x00000000,
    0x0C0C1830, 0x0030180C, 0x3030180C, 0x000C1830, 0xFF3C6600, 0x0000663C, 0x7E181800, 0x00001818,
    0x00000000, 0x0C181800, 0x7E000000, 0x00000000, 0x00000000, 0x00181800, 0x183060C0, 0x0003060C,
    0x7E76663C, 0x003C666E, 0x181E1C18, 0x00181818, 0x3060663C, 0x007E0C18, 0x3860663C, 0x003C6660,
    0x33363C38, 0x0030307F, 0x603E067E, 0x003C6660, 0x3E060C38, 0x003C6666, 0x3060607E, 0x00181818,
    0x3C66663C, 0x003C6666, 0x7C66663C, 0x001C3060, 0x00181800, 0x00181800, 0x00181800, 0x0C181800,
    0x06186000, 0x00006018, 0x007E0000, 0x0000007E, 0x60180600, 0x00000618, 0x3060663C, 0x00180018,

    0x5A5A663C, 0x003C067A, 0x7E66663C, 0x00666666, 0x3E66663E, 0x003E6666, 0x06060C78, 0x00780C06,
    0x6666361E, 0x001E3666, <span class="rem">0x1E06067E</span>, <span class="rem">0x007E0606</span>, 0x1E06067E, 0x00060606, 0x7606663C, 0x007C6666,
    0x7E666666, 0x00666666, 0x1818183C, 0x003C1818, 0x60606060, 0x003C6660, 0x0F1B3363, 0x0063331B,
    0x06060606, 0x007E0606, 0x6B7F7763, 0x00636363, 0x7B6F6763, 0x00636373, 0x6666663C, 0x003C6666,
    0x3E66663E, 0x00060606, 0x3333331E, 0x007E3B33, 0x3E66663E, 0x00666636, 0x3C0E663C, 0x003C6670,
    0x1818187E, 0x00181818, 0x66666666, 0x003C6666, 0x66666666, 0x00183C3C, 0x6B636363, 0x0063777F,
    0x183C66C3, 0x00C3663C, 0x183C66C3, 0x00181818, 0x0C18307F, 0x007F0306, 0x0C0C0C3C, 0x003C0C0C,
    0x180C0603, 0x00C06030, 0x3030303C, 0x003C3030, 0x00663C18, 0x00000000, 0x00000000, 0x003F0000,

    0x00301818, 0x00000000, 0x603C0000, 0x007C667C, 0x663E0606, 0x003E6666, 0x063C0000, 0x003C0606,
    0x667C6060, 0x007C6666, 0x663C0000, 0x003C067E, 0x0C3E0C38, 0x000C0C0C, 0x667C0000, 0x3C607C66,
    0x663E0606, 0x00666666, 0x18180018, 0x00301818, 0x30300030, 0x1E303030, 0x36660606, 0x0066361E,
    0x18181818, 0x00301818, 0x7F370000, 0x0063636B, 0x663E0000, 0x00666666, 0x663C0000, 0x003C6666,
    0x663E0000, 0x06063E66, 0x667C0000, 0x60607C66, 0x663E0000, 0x00060606, 0x063C0000, 0x003E603C,
    0x0C3E0C0C, 0x00380C0C, 0x66660000, 0x007C6666, 0x66660000, 0x00183C66, 0x63630000, 0x00367F6B,
    0x36630000, 0x0063361C, 0x66660000, 0x0C183C66, 0x307E0000, 0x007E0C18, 0x0C181830, 0x00301818,
    0x18181818, 0x00181818, 0x3018180C, 0x000C1818, 0x003B6E00, 0x00000000, 0x00000000, 0x00000000,
};
</code></pre>

是的，这就是 _整个_ 字体，很整齐地放在一页上。这就是位打包（bitpacking）能为你做的事，但就像任何压缩方法一样，要看出这确实是前面那个字体可能有点费劲，所以这里对眼前所见稍作解释。

#### 位打包

<div class="cpt_fr">
<table id="tbl:endian" class="table-data">
<caption align="bottom">
  <b>{@tbl:endian}</b>: 大端（big endian）与小端（little 
  endian）对字节序列 01h、02h、03h、04h 的解释对比
</caption>
<tbody align="center">
<tr>
  <th>big u32     <td colspan=4> 0x01020304
<tr>
  <th>big u16     <td colspan=2> 0x0102 <td colspan=2> 0x0304
<tr>
  <th>u8          <th> 0x01 <th> 0x02   <th> 0x03 <th> 0x04
<tr>
  <th>little u16  <td colspan=2> 0x0201 <td colspan=2> 0x0403
<tr>
  <th>little u32  <td colspan=4> 0x04030201
</tbody>
</table>
</div>

位打包并不难理解。数据不过是一个庞大的比特场。在位打包中，你只需按固定间隔把比特丢进去，再把剩下的重新拼接起来。我们的字体是单色的，意味着我们只有 1 比特的信息。现在，即使在最小的 C 数据类型——字节里，如果你每个像素用一字节，也会留下 7 个比特没用。但你也可以把 8 个像素塞进一个字节，从而节省 8 倍的空间。顺便说一下，这相当于 88% 的压缩率，我觉得相当不错。当然，如果你读过所有其他页面，你已经见过位打包的例子了：4bpp 图块就是用每字节 2 像素的方式打包的。所以这些东西不该完全陌生。

位打包能节省大量空间，原则上也很容易做，因为它无非是掩码和移位。但有一个大陷阱：<dfn>字节序（endianness）</dfn>。你在其他数据数组里已经见过它的一个样子了：在 ARM（和 intel）系统上，字 `0x01234567` 实际上会存储为字节序列 `0x67`、`0x45`、`0x23`、`0x01`。这被称为 <dfn>小端（little-endian）</dfn>，因为字的低位端（多字节类型的低字节）被存储在低地址。也有 <dfn>大端（big-endian）</dfn>，它先把最高有效字节存起来。你可以在 @tbl:endian 中看到差异。某些十六进制编辑器或内存查看器（例如在 VBA 中）允许你切换以字节、半字或字的方式查看数据，因此你可以在那里交互式地看到差异。请记住数据本身并不会因此改变，你只是以不同方式 _看_ 它。

对于位打包，你还要在比特层面处理字节序。字体数据采用一致的“比特小端、字节小端”格式打包，原因有三。首先，GBA 的位打包数据本来就是这样工作的，所以你可以用 BIOS 的 BitUnpack 例程来处理它。其次，就计数而言它是一种更自然的形式：低位比特先来。第三，因为你始终可以向下移位并用这种方式丢弃被覆盖的比特，掩码操作更简单、更快。而大端在视觉上更自然，因为我们写数字也是大端的，所以位图通常也是比特小端。例如 Windows 的 BMP 文件，其最左像素在最高有效位里，使它成为比特大端。然而，Windows 运行在 Intel 架构上，而 Intel 实际上是 _字节_ 小端的，这造成了最大的混乱。唉。算了。

如果还是有点模糊，@fig:img-fontpack 展示了‘F’是如何从 8x8 像素打包成 2 个字的。所有 64 个像素被编号为 0 到 63。它们对应比特编号。每 8 个连续比特组成一个字节：0-7 组成字节 0，8-15 组成字节 1，依此类推。注意比特看起来像是水平镜像了，因为我们通常大端地写数字。所以试着忘掉那个，把内存里的比特想象成从 0 走到 63。你也可以把比特看作字，比特 0-31 是字 0，32-63 是字 1。

<div class="cblock">
<div class="cpt">
<div style="width:700px;">
<table id="fig:img-fontpack" style="width:100%;">
  <tbody align="center">
  <tr>
    <th style="width:150px;">pixels
    <th>
    <th style="width: 150px;">bits
    <th>
    <th style="width: 75px;">bytes
    <th>
    <th style="width: 75px;">words
  <tr>
    <td>
    <img src="img/font_pack.png" alt="pixels" style="width: 160px; margin-top: 24px;">
    <td><span class="rarr">&rarr;</span>
    <td> <!-- bits -->
    <table cellpadding=1 cellspacing=0 class="reg">
      <tr>
        <td class="bdrLL">&nbsp;
        <th> 7 <th> 6 <th> 5 <th> 4 <th> 3 <th> 2 <th> 1 <th> 0
        <td class="bdrRR">&nbsp;
      <tr>
        <td class="bdrLL" rowspan=8>&nbsp;
        <td> 0 <th> 1 <th> 1 <th> 1 <th> 1 <th> 1 <th> 1 <td> 0
        <td class="bdrRR" rowspan=8>&nbsp;
      <tr>
        <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <th> 1 <th> 1 <td> 0
      <tr>
        <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <th> 1 <th> 1 <td> 0
      <tr>
        <td> 0 <td> 0 <td> 0 <th> 1 <th> 1 <th> 1 <th> 1 <td> 0
      <tr>
        <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <th> 1 <th> 1 <td> 0
      <tr>
        <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <th> 1 <th> 1 <td> 0
      <tr>
        <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <th> 1 <th> 1 <td> 0
      <tr>
        <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <td> 0 <td> 0
    </table>
    <td><span class="rarr">&rarr;</span>
    <td> <!-- bytes -->
    <table cellpadding=1 cellspacing=0>
      <tr>
        <th colspan=3>&nbsp;
      <tr>
        <td class="bdrLL" rowspan=4>&nbsp;
          <td> 0x7E
        <td class="bdrRR" rowspan=4>&nbsp;
      <tr><td> 0x06
      <tr><td> 0x06
      <tr><td> 0x1E
      <tr>
        <td class="bdrLL" rowspan=4>&nbsp;
          <td> 0x06
        <td class="bdrRR" rowspan=4>&nbsp;
      <tr><td> 0x06
      <tr><td> 0x06
      <tr><td> 0x00
    </table>
    <td><span class="rarr">&rarr;</span>
    <td> <!-- words -->
    <table cellpadding=1 cellspacing=0 style="display: block;">
      <tr>
        <th colspan=3>&nbsp;
      <tr>
        <td class="bdrLL">&nbsp;
          <td> 0x1E06067E
        <td class="bdrRR">&nbsp;
      <tr>
        <td class="bdrLL">&nbsp;
          <td> 0x00060606
        <td class="bdrRR">&nbsp;
    </table>
   </tbody>
</table>
  <b>@fig:img-fontpack</b>： 
  ‘F’，从 8x8 图块到 1bpp 比特小端、字节小端的 
  字。
</div>
</div>
</div>

### 字符映射 {#ssec-in-charmap}

有了 mini-ascii 字体固然好，但字符串是完整 ascii 的，这可能带来问题。嗯，其实也不是，只是有几种转换方法。

首先，你可以写一个巨大的 switch 块，把比如‘A’（ascii 65）转换成字形索引 33，然后对所有 96 个字形都这么做。应该很明显，这是处理此事的可怕方式。嗯，它 _应该_ 很明显，但显然并非如此，因为那种代码确实存在；我在这里提到它只是为了让你能认出它并远离、远离、再远离。简而言之，如果你有个 switch 块，其中各 case 之间唯一的区别只是返回一个不同的偏移量——而且是个 _固定的_ 偏移量——那你就是在做非常、非常错误的事。

第二种方法在所有方面都是巨大的改进，就是简单地减去 32。毕竟 mini-ascii 就是这样定义的。快捷、简短、切中要害。

不过，我有点喜欢第三种选择：查找表。我们已经见识过 LUT 在数学上有多有用，但你能用它做的事远不止于此。在这种情况下，lut 是一个 <dfn>字符映射</dfn>，包含每个 ascii 字符的字形索引。它几乎具备简单减法（一次查找可能慢几个周期）的所有好处，但灵活得多。例如，你可以使用非 ascii 的字符映射，或给某些情况起别名，诸如此类。另一个“有趣”之处是，你其实不需要字体本身是文字，它可以是任何类型的映射图像数据；有了 lut，你可以轻松地用文本系统来绘制边框，只要你有一套边框“字体”即可。我用的 lut 长 256 字节。这对 Unicode 来说可能不够（抱歉东方朋友们），但足以满足我的目的。

#### 通用设计

代码层面要做的第一件事是初始化文本基结构体（text-base）的成员。这意味着挂接字体、设定字形尺寸，并初始化 lut。这可以用 `txt_init_std()` 完成。

```c

u8 txt_lut[256];

// Basc initializer for text state
void txt_init_std()
{
    gptxt->dx= gptxt->dy= 8;

    gptxt->dst0= vid_mem;
    gptxt->font= (u32*)toncfontTiles;
    gptxt->chars= txt_lut;
    gptxt->cws= NULL;

    int ii;
    for(ii=0; ii<96; ii++)
        gptxt->chars[ii+32]= ii;
}
```

取决于文本的类型，你可能需要更专门的初始化函数，这个我们到时候再谈。至于写字符串，基本结构如下。它其实相当简单且通用，但不幸的是，`xxx_putc()` 在内层循环里意味着你必须针对每种文本方法在各自的字符绘制函数外面包上一层几乎相同的包装。我还有叫 `xxx_clrs()` 的函数，用于把字符串从屏幕上清除（它们不会擦掉整个屏幕）。它们在形式上和各自的 `puts()` 兄弟几乎一样，也很简单，所以这里不细说。

```c
// Pseudo code for xxx_puts
void xxx_puts(int x, int y, const char *str, [[more]])
{
    [[find real writing start]]
    while(c=*str++)     // iterate through string
    {
        switch(c)
        {
        case [[special chars ('\n' etc)]]:
            [[handle special]]
        case [[normal chars]]:
            [[xxx_putc(destination pointer, lut[c])]]
            [[advance destination]]
        }
    }
}
```

## 位图文本 {#sec-bm}

位图文本涉及模式 3、4 和 5。如果你能做模式 3，就基本上也会做模式 5，因为两者只差间距（pitch）和可能的起始点。模式 4 不同，不仅因为它是 8bpp，还意味着我们必须一次处理 2 个像素。

### 内部例程 {#ssec-bm-intl}

我倾向于把位图相关函数分成两部分：有内部 16 位和 8 位函数，它们以地址和间距（pitch）为参数；然后是带坐标的内联接口函数，它们调用这些内部函数。下面的内部 16 位写入函数给出在此，其后的几段解释主要部分。

```c{#cd-bm16-puts}
void bm16_puts(u16 *dst, const char *str, COLOR clr, int pitch)
{
    int c, x=0;

    while((c=*str++) != 0)      // (1) for each char in string
    {
        // (2) real char/control char switch
        if(c == '\n')       // line break
        {
            dst += pitch*gptxt->dy;
            x=0;
        }
        else                // normal character
        {
            int ix, iy;
            u32 row;
            // (3) point to glyph; each row is one byte
            u8 *pch= (u8*)&gptxt->font[2*gptxt->chars[c]];
            for(iy=0; iy<8; iy++)
            {
                row= pch[iy];
                // (4) plot pixels until row-byte is empty
                for(ix=x; row>0; row >>= 1, ix++)
                    if(row&1)
                        dst[iy*pitch+ix]= clr;
            }
            x += gptxt->dx;
        }
    }
}
```

1.  遍历字符串中所有字符的传统方式。`c` 将是我们要处理的字符，除非它是定界符（`'\0'`），那样我们就停止。
2.  普通字符/控制字符的切换。像 `'\n'` 和 `'\t'` 这样的控制字符要分开处理。我现在只检查换行符，但其他也很容易加。
3.  这里变得有趣了。这一行先用 lut 在字体里查找字形索引，再用该索引在字体里找到实际字形（乘以 2，因为每个字形有 2 个字），然后设置一个字节指针 `pch` 指向该字形。
    几件事在这里汇合。首先，因为所有字形都恰好相隔 8 字节，找字形数据非常容易。如果你用自己的字体、自己的文本系统，我建议用固定偏移，即便像‘I’这样的窄字符会浪费像素。其次，由于 1bpp 的图块格式，每行恰好 1 字节长，且所有字形比特是连续字节，所以你不必为每行新行跳来跳去。这很好。
4.  `ix` 循环更有意思。首先，我们把实际的一行像素读进（字）变量 `row`。要测试是否需要写像素，只需检查给定比特。然而，由于打包是 _小_ 端的，这允许两个捷径。
    第一点是遍历比特是从低位到高位，意味着每次迭代我们只需向右移位并测试第 0 位。其推论是我们已经处理过的比特被丢弃，而 _这_ 意味着当 `row` 为 0 时就不会再有像素了，这一行也就完成了。由于这个短路发生在 _三重_ 循环的内层，加速效果可能相当可观。

这个函数只做把字符串放上屏幕的 bare essential。它只绘制非零像素（透明字符），没有边缘换行，也没有滚动。唯一非平凡的特性是它能处理换行。发生换行时，光标回到屏幕上的原始 x 位置。

8 位函数与这个几乎一致，“几乎”是因为 VRAM 的“不可单字节写”规则。显而易见的是间距（pitch）和字符间距要减半。我还要让一个 **要求** 生效：每个字符的起始必须落在偶数像素边界上。这样，你就能有一个几乎和之前一样的内层循环；只是它一次处理两个像素而非一个。是的，这是个 hack；不，我不在意。

```c{#cd-bm8-puts}
void bm8_puts(u16 *dst, const char *str, u8 clrid)
{
    int c, x=0, dx= gptxt->dx >> 1;

    while((c=*str++) != 0)
    {
        // <snip char-switch and iy loop>
                for(ix=x; row>0; row >>= 2, ix++)
                {
                    pxs= dst[iy*120+ix];
                    if(row&1)
                        pxs= (pxs&0xFF00) | clrid;
                    if(row&2)
                        pxs= (pxs&0x00FF) | (clrid<<8);

                    dst[iy*120+ix]= pxs;
                }
        // <snip>
    }
}
```

### 接口函数 {#ssec-bm-iface}

接口函数很直接。它们要做的只是为内部例程设置目标起点，对 16 位版本还要提供间距（pitch）。模式 3 用 `vid_mem` 作基准，模式 4 和 5 用 `vid_page` 以确保它能配合页翻转工作。`m4_puts()` 还确保字符起始于偶数像素，并请记住这个例程用的是颜色索引而非真实颜色。

```c{#cd-mx-puts}
// Bitmap text interface. Goes in text.h
INLINE void m3_puts(int x, int y, const char *str, COLOR clr)
{    bm16_puts(&vid_mem[y*240+x], str, clr, 240);     }

INLINE void m4_puts(int x, int y, const char *str, u8 clrid)
{    bm8_puts(&vid_page[(y*240+x)>>1], str, clrid);   }

INLINE void m5_puts(int x, int y, const char *str, COLOR clr)
{    bm16_puts(&vid_page[y*160+x], str, clr, 160);    }
```

### 清除文本 {#ssec-bm-clrs}

做文本清除和写出字符串几乎一样。唯一的功能差异是，你始终放一个空格（或者更准确地说，一个实心填充矩形）而非原始字符。你仍然需要完整的字符串来告诉你每行有多长、有多少行。

考虑到这一点，下面 `bm16_clrs()` 函数应该不难理解。它的全部要点是读取字符串，找出字符串中每行的像素长度（`nx*gptxt->dx`），然后填充由该长度和字符高度（`gptxt->dy`）所跨越的矩形。有一些簿记以确保一切按计划进行，但归根结底它就做这些。其他文本类型的清除例程也一样，所以我不展示那些。

```c{#cd-bm16-clrs}
void bm16_clrs(u16 *dst, const char *str, COLOR clr, int pitch)
{
    int c, nx=0, ny;

    while(1)
    {
        c= *str++;
        if(c=='\n' || c=='\0')
        {
            if(nx>0)
            {
                nx *= gptxt->dx;
                ny= gptxt->dy;
                while(ny--)
                {
                    memset16(dst, clr, nx);
                    dst += pitch;
                }
                nx=0;
            }
            else
                dst += gptxt->dy*pitch;
            if(c=='\0')
                return;
        }
        else
            nx++;
    }
}
```

## 图块地图文本 {#sec-tile}

在某些方面，图块模式的文本实际上比位图更容易，因为你可以直接把字体塞进一个 charblock，之后就不需要再引用字体本身了。也就是说，除非你想要变宽字体，那样你就会陷入位移的噩梦。但我坚持用定宽、单图块字体，这让事情非常简单。

### 图块初始化 {#ssec-tile-init}

第一件事是能够将字体解包到 4 位或 8 位。最简单的做法是直接调用 `BitUnpack()` 然后完事。不过，VBA 对它的实现对于我原本的打算并不完全（或曾经不完全，他们现在也许修好了）正确，所以我自己写一个。参数 `dstv` 和 `srcv` 分别是目标和源地址；`len` 是源字节数，`bpp` 是目标位深。`base` 有两个用途。主要地，它是一个要加到所有像素上的数（若第 31 位置位），或加到除零值之外的所有像素上（若清零）。这比源位深为 1 时只提供 0 和 1 能得到多得多的结果；以及一个我稍后会讲到的可爱小技巧。

```c{#cd-txt-bup}
// Note, the BIOS BitUnpack does exactly the same thing!
void txt_bup_1toX(void *dstv, const void *srcv, u32 len, int bpp, u32 base)
{
    u32 *src= (u32*)srcv;
    u32 *dst= (u32*)dstv;

    len= (len*bpp+3)>>2;    // # dst words
    u32 bBase0= base&(1<<31);    // add to 0 too?
    base &= ~(1<<31);

    u32 swd, ssh=32;    // src data and shift
    u32 dwd, dsh;       // dst data and shift
    while(len--)
    {
        if(ssh >= 32)
        {
            swd= *src++;
            ssh= 0;
        }
        dwd=0;
        for(dsh=0; dsh<32; dsh += bpp)
        {
            u32 wd= swd&1;
            if(wd || bBase0)
                wd += base;
            dwd |= wd<<dsh;
            swd >>= 1;
            ssh++;
        }
        *dst++= dwd;
    }
}
```

实际的图块地图文本初始化由 `txt_init_se()` 完成。它的前两个参数正是你期望的：系统应把文本用到的背景，以及应当写到那里的控制标志（charblock、screenblock、位深，等等）。第三个参数 `se0` 指示调色板和图块索引的“基准”，类似于解包用的基准。其格式和普通屏幕条目一样：`se0`{0-9} 表示图块偏移，`se0`{C-F} 用于 16 色调色板 bank。`clrs` 包含文本的颜色，它将进入由子调色板指示的调色板，以及第五个参数 `base`，即位解包的基准。

现在，先忽略 `clrs` 中的 _第二个_ 颜色，以及 4bpp 的额外调色板写入。十有八九你不想知道。不过我反正会在[后面](#ssec-demo-se1)告诉你。

```c{#cd-txt-init-se}
void txt_init_se(int bgnr, u16 bgcnt, SB_ENTRY se0, u32 clrs, u32 base)
{
    bg_cnt_mem[bgnr]= bgcnt;
    gptxt->dst0= se_mem[BF_GET(bgcnt, BG_SBB)];

    // prep palette
    int bpp= (bgcnt&BG_8BPP) ? 8 : 4;
    if(bpp == 4)
    {
        COLOR *palbank= &pal_bg_mem[BF_GET(se0, SE_PALBANK)<<4];
        palbank[(base+1)&15]= clrs&0xFFFF;
        palbank[(base>>4)&15]= clrs>>16;
    }
    else
        pal_bg_mem[(base+1)&255]= clrs&0xFFFF;

    // account for tile-size difference
    se0 &= SE_ID_MASK;
    if(bpp == 8)
        se0 *= 2;

    // Bitunpack the tiles
    txt_bup_1toX(&tile_mem[BF_GET(bgcnt, BG_CBB)][se0],
        toncfontTiles, toncfontTilesLen, bpp, base);
}
```

如果你不想处理各种偏移，只需把第三和第五个参数置零即可。把其他参数置零可能不是好主意，但这两个没问题。

### 屏幕条目写入函数 {#ssec-tile-puts}

这可以说是所有文本写入函数里最简单的。因为每个屏幕条目对应一个字形，你要做的只是在正确位置往 screenblock 写半个字就得到一个字母。对整个字符串重复即可。

关于这个实现有几点要注意。首先，和之前一样，没有换行或滚动。如果你想要，得自己全部实现。另外，_x_ 和 _y_ 坐标仍以 _像素_ 计，而非图块。我这样做主要是为了与其他写入函数保持一致，仅此而已。哦，如果你之前没注意到，`gptxt->dst0` 在 `txt_init_se()` 里被初始化为指向背景 screenblock 的起始。最后，`se0` 被加进去构成实际的屏幕条目；如果在初始化时你用了非零的 `se0`，很可能在这里也想用它。

```c
void se_puts(int x, int y, const char *str, SB_ENTRY se0)
{
    int c;
    SB_ENTRY *dst= &gptxt->dst0[(y>>3)*32+(x>>3)];

    x=0;
    while((c=*str++) != 0)
    {
        if(c == '\n')    // line break
        {    dst += (x&~31) + 32;    x=0;    }
        else
            dst[x++] = (gptxt->chars[c]) + se0;
    }
}
```

## 精灵文本 {#sec-obj}

精灵文本和图块地图文本相似，只是你现在用 OBJ_ATTR 而非屏幕条目。你必须手动设置位置（属性 0 和 1），而属性 2 和常规图块地图的屏幕条目几乎一样。初始化函数 `txt_init_obj()` 类似 `txt_init_se()`，只是图块地图的细节被它们对应的 OAM 项替代了。我们指向一个基准 OBJ_ATTR `oe0` 而非 screenblock，`attr2` 的工作方式和 `se0` 差不多。代码实际上更简单，因为我们总能对所用的对象用 4bpp 图块，而不会干扰其他的。

```c
// OAM text initializer
void txt_init_obj(OBJ_ATTR *oe0, u16 attr2, u32 clrs, u32 base)
{
    gptxt->dst0= (u16*)oe0;

    COLOR *pbank= &pal_obj_mem[BF_GET(attr2, ATTR2_PALBANK)<<4];
    pbank[(base+1)&15]= clrs&0xFFFF;
    pbank[(base>>4)&15]= clrs>>16;

    txt_bup_1toX(&tile_mem[4][attr2&ATTR2_ID_MASK], toncfontTiles,
        toncfontTilesLen, 4, base);
}
```

```c

// OAM text writer
void obj_puts(int x, int y, const char *str, u16 attr2)
{
    int c, x0= x;
    OBJ_ATTR *oe= (OBJ_ATTR*)gptxt->dst0;

    while((c=*str++) != 0)
    {
        if(c == '\n')    // line break
        {    y += gptxt->dy; x= x0; }
        else
        {
            if(c != ' ') // Only act on a non-space
            {
                oe->attr0= y & ATTR0_Y_MASK;
                oe->attr1= x & ATTR1_X_MASK;
                oe->attr2= gptxt->chars[c] + attr2;
                oe++;
            }
            x += gptxt->dx;
        }
    }
}
```

写入函数本身的结构现在应该让人感到熟悉了。`attr2` 再次作为一个基准偏移，以允许调色板切换和图块的偏移起始。注意我只设置了属性 0 和 1 中的位置，别的什么都没设。我能这么做是因为其余东西已经被设成我想要的，也就是 8x8p 精灵、4bpp 图块、毫无花哨。是的，这可能搞砸某些人的东西，但如果我 _真的_ 把所有位都正确掩掉，又会搞砸别的东西。这是个判断问题，你完全有理由不同意并改掉它。

那个写入函数总是从一个固定的 OBJ_ATTR 开始，覆盖之前的所有项。因为这可能不合人意，我还有一个次级精灵写入函数 `obj_puts2`，它接受一个 OBJ_ATTR 作为参数，作为新的基准。

```c
INLINE void obj_puts2(int x, int y, const char *str, u16 attr2, OBJ_ATTR *oe0)
{
    gptxt->dst0= (u16*)oe0;
    obj_puts(x, y, str, attr2);
}
```

关于内存使用我得提一些附带说明。记住，只有 128 个 OBJ_ATTR，而每个字形一项，若广泛使用可能会贵得离谱。同理，1024 个图块看起来很多，但如果你还在里面放了几套完整动画，很快会用光。另外，记住在图块模式下你只有 512 个图块：位图模式下的完整 ASCII 字符集会占用精灵图块的 \_一半*！

如果你只是用它显示几个字符，不太可能遇到麻烦，但如果你想要满屏文本，或许用别的更好。当然，有绕开这些的办法；甚至是很简单的办法。但因为它们确实与具体游戏强相关，很难给出通用的解决方案。

## 一些演示程序 {#sec-demo}

### 位图文本演示 {#ssec-demo-bm}

我想我本可以从“Hello world”开始，但那相当无聊，所以我想从更有趣的东西开始。`txt_bm` 演示做的和 `bm_modes` 类似：即在屏幕上显示些东西，并允许在模式 3、4、5 间切换以查看差异。只是现在我们用位图 `puts()` 的版本来写出指示当前模式的字符串。因为这仍相当无聊，我还要在屏幕上放一个可移动的光标，并写出它的坐标。完整代码如下：

```c{#cd-txt-bm}
#include <stdio.h>
#include <tonc.h>

#define CLR_BD    0x080F

const TILE cursorTile=
{{  0x0, 0x21, 0x211, 0x2111, 0x21111, 0x2100, 0x1100, 0x21000  }};

void base_init()
{
    vid_page= vid_mem;

    // init interrupts
    irq_init(NULL);
    irq_add(II_VBLANK, NULL);

    // init backdrop
    pal_bg_mem[0]= CLR_MAG;
    pal_bg_mem[CLR_BD>>8]= CLR_BD;
    pal_bg_mem[CLR_BD&255]= CLR_BD;
    m3_fill(CLR_BD);

    // init mode 4 pal
    pal_bg_mem[1]= CLR_LIME;
    pal_bg_mem[255]= CLR_WHITE;

    // init cursor
    tile_mem[5][0]= cursorTile;
    pal_obj_mem[1]= CLR_WHITE;
    pal_obj_mem[2]= CLR_GRAY;
}

int main()
{
    base_init();

    txt_init_std();

    // (1) print some string so we know what mode we're at
    m3_puts( 8,  8, "mode 3", CLR_CYAN);
    m4_puts(12, 32, "mode 4", 1);
    m5_puts(16, 40, "mode 5", CLR_YELLOW);

    // init variables
    u32 mode=3, bClear=0;
    OBJ_ATTR cursor= { 80, 120, 512, 0 };

    // init video mode
    REG_DISPCNT= DCNT_BG2 | DCNT_OBJ | 3;

    // init cursor string
    char str[32];
    siprintf(str, "o %3d,%3d", cursor.attr1, cursor.attr0);

    while(1)
    {
        VBlankIntrWait();
        oam_mem[0]= cursor;
        key_poll();

        if(key_hit(KEY_START))
            bClear ^= 1;

        // move cursor
        cursor.attr1 += key_tri_horz();
        cursor.attr0 += key_tri_vert();

        // adjust cursor(-string) only if necessary
        if(key_is_down(KEY_ANY))
        {
            // (2) clear previous coords
            if(bClear)
                bm_clrs(80, 112, str, CLR_BD);

            cursor.attr0 &= ATTR0_Y_MASK;
            cursor.attr1 &= ATTR1_X_MASK;
            // (3) update cursor string
            siprintf(str, "%c %3d,%3d", (bClear ? 'c' : 'o'),
                cursor.attr1, cursor.attr0);
        }

        // switch modes
        if(key_hit(KEY_L) && mode>3)
            mode--;
        else if(key_hit(KEY_R) && mode<5)
            mode++;
        REG_DISPCNT &= ~DCNT_MODE_MASK;
        REG_DISPCNT |= mode;

        // (4) write coords
        bm_puts(80, 112, str, CLR_WHITE);
    }

    return 0;
}
```

<div class="cpt_fr" style="width:240px;">
<img src="img/demo/txt_bm.png" alt="" id="fig:img-txt-bm"><br>
<b>@fig:img-txt-bm</b>: <tt>txt_bm</tt> 演示程序。
</div>

操作方式：

<table>
<tbody valign="top">
<tr><th>D-pad<td>移动光标。
<tr><th>Start<td>切换字符串清除。
<tr><th>L, R<td>减小或增大模式。
</tbody>
</table>

这里许多东西应该要么不言自明，要么毫不相关。有趣的地方用数字标出，所以我们依次过一遍，好吗？

**1. 模式指示器**。这是我们往 VRAM 里写三个字符串、指示模式的地方。注意接口几乎一致；唯一的真正区别是 `m4_puts()` 的第四个参数是调色板索引而非真实颜色。

**2. 清除之前的光标字符串**。光标字符串随着你在屏幕上移动而跟踪光标。你会注意到的第一件事是，字符串变成一团可怕的乱码，因为位图写入函数只写字体中 _非零_ 的像素。换句话说，它 _不_ 清除该字形其余空间。本质上 `mx_puts()` 是透明字符串写入函数。

当然，我本可以给写入函数加一个能擦掉整个字形区域的开关。其实很容易，只要多一个 `else` 子句。然而，现在这种方式其实更实用。一方面，要是你真的 _想要_ 透明呢？你就得另写一个例程专门做那个。我选的方法是多一个清除例程（你大概反正也需要它）。要覆盖整个字形，只需先调用 `mx_clrs()`；这正是我在这里做的。嗯，只要 `bClear` 变量被置位（用 Start 切换）。

第二个理由是这种方式快得多。不仅因为如果我要擦掉整个区域就没法用 `ix` 循环里的提前跳出，而且仅多一个分支就会增加周期（在三重循环内），但绘制单个字符终究比整块地处理要慢。`mx_clrs()` 用的是 `memset16()`，它基本是 `CpuFastSet()` 加上安全保护，在仅仅半打像素之后就会更快。

哦，要是你奇怪我为什么在说 `mx_clrs()` 而代码里写的是 `bm_clrs()`，后一个函数只不过是个用 switch 块根据当前位图模式来调用正确模式专属字符串清除器的函数。

**3. 更新光标字符串**。由于写入函数没有格式说明符字段，怎么写数字？简单，先用 `sprintf()` 准备好字符串，再用那个。或者更准确地说，用 `siprintf()`。这是 `sprintf()` 的整数专用版本，更适合 GBA 编程，因为你本来就不该用浮点数。包一层 `siprintf()` 和 `mx_puts()` 来写应该相对简单，但我不确定是否值得费劲。

我或许该指出，用 `siprintf` 及其他能把数字变成字符串的例程，会用到除以 10 来完成，你也知道那意味着什么。即便你不要求它转换数字，它也会调用标准库里十来个例程，给你的二进制文件增加约 25kb。这对 ROM 不算多，但对多引导（multiboot，上限 256kb）可能是个问题。有鉴于此，我建议你看看 [Dan Posluns](https://www.danposluns.com/gbadev/) 的 **posprintf**。这是手工编写的汇编，用一种特殊的十进制转换算法。它的选项可能不如 `siprintf()` 丰富，但速度和体积都要好得多，绝对值得一看。

**4. 写光标字符串**。这把当前光标字符串写到位置 (80, 120)。和擦除字符串的情况一样，我用的是 `bm_puts()` 函数，它在当前模式写入函数之间切换。

### 精灵文本；Hello world! {#ssec-demo-obj}

没错！Hello world！原则上，你要做的只是用正确参数调用 `txt_init()`、`txt_init_obj()` 和 `obj_puts()`，但那又很无聊，所以我也加点有趣的东西。`txt_obj` 演示展示了用精灵能做得最好的一件事：单个字母动画。“hello world!”这个短语的字母会从屏幕顶部落下，弹跳着停在地面（屏幕中间偏下的一条绿线）上。

```c{#cd-txt_obj}
#include <tonc.h>

// === CONSTANTS & STRUCTS ============================================

#define POS0 (80<<8)
#define GRAV 0x40
#define DAMP 0xD0
#define HWLEN 12

const char hwstr[]= "Hello world!";

typedef struct
{
    u32 state;
    int tt;
    FIXED fy;
    FIXED fvy;
} PATTERN;

// === FUNCTIONS ======================================================

void pat_bounce(PATTERN *pat)
{
    if(pat->tt <= 0)    // timer's run out: play pattern
    {
        pat->fvy += GRAV;
        pat->fy += pat->fvy;

        // touched floor: bounce
        if(pat->fy > POS0)
        {
            // damp if we still have enough speed
            // otherwise kill movement
            if(pat->fvy > DAMP)
            {
                pat->fy= 2*POS0-pat->fy;
                pat->fvy= DAMP-pat->fvy;
            }
            else
            {
                pat->fy= POS0;
                pat->fvy= 0;
            }
        }
    }
    else    // still in waiting period
        pat->tt--;
}

int main()
{
    REG_DISPCNT= DCNT_MODE3 | DCNT_BG2 | DCNT_OBJ;

    irq_init(NULL);
    irq_add(II_VBLANK, NULL);
    memset16(&vid_mem[88*240], CLR_GREEN, 240);

    // (1) init sprite text
    txt_init_std();
    txt_init_obj(&oam_mem[0], 0xF200, CLR_YELLOW, 0xEE);
    // (2) 12 px between letters
    gptxt->dx= 12;

    // (3) init sprite letters
    OBJ_ATTR *oe= oam_mem;
    obj_puts2(120-12*HWLEN/2, 8, hwstr, 0xF200, oe);

    int ii;
    PATTERN pats[HWLEN];

    for(ii=0; ii<HWLEN; ii++)
    {
        // init patterns
        pats[ii].state=0;
        pats[ii].tt= 3*ii+1;
        pats[ii].fy= -12<<8;
        pats[ii].fvy= 0;

        // init sprite position
        oe[ii].attr0 &= ~ATTR0_Y_MASK;
        oe[ii].attr0 |= 160;
    }

    while(1)
    {
        VBlankIntrWait();

        for(ii=0; ii<HWLEN; ii++)
        {
            pat_bounce(&pats[ii]);

            oe[ii].attr0 &= ~ATTR0_Y_MASK;
            oe[ii].attr0 |= (pats[ii].fy>>8)& ATTR0_Y_MASK;
        }
    }

    return 0;
}
```

<div class="cpt_fr" style="width:240px;">
  <img id="fig:img-txt-obj" src="img/demo/txt_oe.png" />

**{@fig:img-txt-obj}**：`txt_obj` 演示程序。

</div>

这段代码里真正和字符串本身相关的很少，即第 1、2、3 项。有一处调用 `txt_init_std()` 做基本初始化，一处调用精灵文本初始化函数 `txt_init_obj()`。第二个参数是属性 2 的基准（如果你不记得属性 2 是什么，请再看一遍[精灵](regobj.html#ssec-obj-attr2)那一章）；`0xF200` 意味着我用子调色板 15，并从图块索引 512（因为位图模式）开始字符图块。字体颜色是黄色，出来在索引 255。那是调色板 bank 的 240，解包出来的 `0x0E`=14，再加上实际 1bpp 像素的 1，240+14+1=255。这次调用之后，我还将水平像素偏移设为 12，让字母之间稍微散开。之后，我就调用 `obj_puts2()` 设置 OAM 的头几个精灵，使它们显示居中于屏幕顶部的“hello world!”。

我本可以到此为止，但这个演示其实才刚开始。用精灵作字形的妙处在于它们仍能 _作为_ 普通精灵行动；`obj_puts()` 只是把它们设置成使用字母而非更像精灵的图形。

#### 蹦跶，蹦跶，蹦跶

这里的目标是让字母从屏幕顶部落下，撞到地面时再弹起，但速度比之前略小（因为摩擦之类）。物理上，下落部分用恒定加速度 _g_ 完成。加速度是速度的变化，所以速度呈线性；速度是位置的变化，所以高度呈抛物线。在弹跳时，我们进行<dfn>非弹性碰撞（inelastic collision）</dfn>；换句话说，就是有能量损失的情况。原则上，这意味着碰撞前后速度平方之差为一个常数（ \|**v**<sub>out</sub>\|<sup>2</sup> - \|**v**<sub>in</sub>\|<sup>2</sup> = Q ）。然而，这要求开平方根来求新速度，我现在不想那样，所以我在这里直接把平方丢掉。我相信在某些情况下这其实是相当合理的 <kbd>:P</kbd>。作为进一步简化，我对位置用一阶积分。这样，移动的基本代码变得非常简单

```c
// 1D inelastic reflections
// y, vy, ay: position, velocity, acceleration.
// Q: inelastic collision coefficient.
vy += ay;
 y += vy;
if(y>ymay)  // collision
{
    if((ABS(vy)>Q)
    {
        vy= -(vy-SGN(vy)*Q);  // lower speed, switch direction
        y= 2*ymay-y;          // Mirror y at r: y= r-(y-r)= 2r-y
    }
    else  // too slow: stop at ymay
    {   vy= 0; y= ymay; }
}
```

这可以用下面更准确、用二阶积分和“恰当”回弹的代码替代，但你几乎察觉不到改进带来的差异。不过，我其实更喜欢简单线性回弹的样子，胜过硬开平方根。

```c
// accelerate
 k= vx+GRAV;
// Trapezium integration rule:
//   x[i+1]= x[i] + (v[i]+v[i+1])/2;
 x += (vx+k)/2;
vx= k;
if(x>xmax)  // collision
{
    if(vx*vx > Q2)
    {   vx= -Sqrt(vx*vx-Q2); x= 2*xmax-x; }
    else
    {   vx= 0;               x= xmax;     }
}
```

### 图块地图文本：颜色与边框 {#ssec-demo-se1}

接下来是两个图块地图文本演示中的第一个。我称之为常规背景的东西，官方名称是“文本背景（text background）”，它们被这么叫是有原因的：大多数有文本的情况，都是用常规背景完成的。当然，大多数情况下其他一切也 _是_ 用那些完成的，所以严格地把它们和“文本”联系起来是种误称，不过我们今天先不纠结。第一个演示是关于如何用文本函数实现各种效果。除了简单地显示文本（无聊），你还会看到调色板切换和给文本加框，以及如何轻松同时使用不同字体和边框。由于我对函数的设计方式，这一切只需要改一个参数。很酷吧。

这个演示还会展示给单色字体加阴影，以及给它加不透明背景。我采取的做法大概会让我在计算机科学地狱里占个位，不过嘛，这些技巧的酷劲儿大概能让我免于在那里被烧。

```c{#cd-txt_se1}
#include <tonc.h>
#include "border.h"

// === CONSTANTS & STRUCTS ============================================

#define TID_FRAME0        96
#define TID_FRAME1       105
#define TID_FONT           0
#define TID_FONT2        128
#define TID_FONT3        256
#define TXT_PID_SHADE   0xEE
#define TXT_PID_BG      0x88

// === FUNCTIONS ======================================================

void init()
{
    int ii;
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;

    irq_init(NULL);
    irq_add(II_VBLANK, NULL);

    txt_init_std();

    // (1a) Basic se text initialization
    txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0x1000, CLR_RED, 0x0E);

    // (1b) again, with a twist
    txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0xF000|TID_FONT2,
        CLR_YELLOW | (CLR_MAG<<16), TXT_PID_SHADE);

    // (1c) and once more, with feeling!
    txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0xE000|TID_FONT3,
        0, TXT_PID_SHADE);
    u32 *pwd= (u32*)&tile_mem[0][TID_FONT3];
    for(ii=0; ii<96*8; ii++)
        *pwd++ |= quad8(TXT_PID_BG);

    // extra border initialisation
    memcpy32(pal_bg_mem, borderPal, borderPalLen/4);
    memcpy32(&tile_mem[0][TID_FRAME0], borderTiles, borderTilesLen/4);

    // (2) overwrite /\ [] `% ^_ to use border tiles
    //  / ^ \
    //  [ # ]
    //  ` _ '
    const u8 bdr_lut[9]= "/^\\[#]`_\'";
    for(ii=0; ii<9; ii++)
        gptxt->chars[bdr_lut[ii]]= TID_FRAME0+ii;

    // (3) set some extra colors
    pal_bg_mem[0x1F]= CLR_RED;
    pal_bg_mem[0x2F]= CLR_GREEN;
    pal_bg_mem[0x3F]= CLR_BLUE;

    pal_bg_mem[0xE8]= pal_bg_mem[0x08]; // bg
    pal_bg_mem[0xEE]= CLR_ORANGE;   // shadow
    pal_bg_mem[0xEF]= pal_bg_mem[0x0F]; // text
}

void txt_se_frame(int l, int t, int r, int b, u16 se0)
{
    int ix, iy;
    u8 *lut= gptxt->chars;
    u16 *pse= (u16*)gptxt->dst0;
    pse += t*32 + l;
    r -= (l+1);
    b -= (t+1);

    // corners
    pse[32*0  + 0] = se0+lut['/'];
    pse[32*0  + r] = se0+lut['\\'];
    pse[32*b  + 0] = se0+lut['`'];
    pse[32*b  + r] = se0+lut['\''];

    // horizontal
    for(ix=1; ix<r; ix++)
    {
        pse[32*0+ix]= se0+lut['^'];
        pse[32*b+ix]= se0+lut['_'];
    }
    // vertical + inside
    pse += 32;
    for(iy=1; iy<b; iy++)
    {
        pse[0]= se0+lut['['];
        pse[r]= se0+lut[']'];
        for(ix=1; ix<r; ix++)
            pse[ix]= se0+lut['#'];
        pse += 32;
    }
}

int main()
{
    init();

    // (4a) red, green, blue text
    se_puts(8, 16, "bank 1:\n  red",   0x1000);
    se_puts(8, 40, "bank 2:\n  green", 0x2000);
    se_puts(8, 72, "bank 3:\n  blue",  0x3000);
    // (4b) yellow text with magenta shadow
    se_puts(8, 96, "bank 15:\n yellow, \nwith mag \nshadow", 0xF000|TID_FONT2);

    // (5a) framed text, v1
    txt_se_frame(10, 2, 29, 9, 0);
    se_puts( 88, 24, "frame 0:", 0);
    se_puts(104, 32, "/^\\[#]`_'", 0);
    se_puts( 88, 40, "bank  0:\n  basic text,\n  transparent bg", 0);

    // (5b) framed text, v2
    txt_se_frame(10, 11, 29, 18, TID_FRAME1-TID_FRAME0);
    se_puts( 88,  96, "frame 1:", 0xE000|TID_FONT3);
    se_puts(104, 104, "/^\\[#]`_'", 9);
    se_puts( 88, 112, "bank 14:\n  shaded text\n  opaque bg", 0xE000|TID_FONT3);

    while(1)
        VBlankIntrWait();
    return 0;
}
```

<div class="lblock">
  <table id="fig:img-txt-se1">
    <tr>
      <td>
        <div class="cpt" style="width:240px">
          <img src="img/demo/txt_se1.png" alt="txt_se1 demo"><br>
          <b>{@fig:img-txt-se1}a</b>: 第一个图块地图文本演示。
        </div>
      <td>
        <div class="cpt" style="width:256px">
          <img src="img/demo/txt_se1_tiles.png" alt="txt_se1 tileset"><br>
          <b>{@fig:img-txt-se1}b</b>: 配套的图块集。
        </div>
  </table>
</div>

#### 代码解析

@fig:img-txt-se1 展示了这段代码产生的效果。所有实际文本绘制都在 main 函数里完成，我逐一讲解。前三件事是红色、绿色和蓝色文本（第 4a 点），通过调色板切换实现。我把红、绿、蓝载入调色板索引 `0x1F`、`0x2F` 和 `0x3F`（第 3 点），并用 `se_puts()` 的最后一个参数在它们之间切换，你会记得这个参数被加到每个屏幕条目上。值 `0x1000`、`0x2000` 和 `0x3000` 表示我们将使用调色板 bank 1、2、3。

如果你仔细看，会看到第四个文本（第 4b 点）是黄色，每个字母的右边缘有洋红色（不，它不是粉色，是 _洋红_）阴影。至少部分原因是 `se0` 参数，现在是 `0xF080`。它有阴影是因为最后一部分：我其实用了一个略不同的字体，从图块 128 开始。我重复一遍，我之所以能用同一个函数做所有这些，是因为 `se_puts()` 的那个偏移参数。

第 (5a) 和 (5b) 点是给文本加框以及框内文本。`txt_se_frame()` 函数绘制我的边框。它输入一个矩形，并在其上画一个框。注意这个框包含左上角，但不包含右下角。同样，我有一个额外的 `se0` 参数作为偏移。第二个边框就是这样完成的；我只是用边框图块之间的差异来偏移它。

边框本身的绘制其实和把它当文本画差不多。在 `init()` 里，我把字符 lut 中的 9 个字符重新指派为使用主边框图块集的图块索引（第 2 点）。我这么做没有特别理由，仅仅是出于我能这么做。只是展示一下你用文本写入函数和一点巧妙的 lut 操作能做的事。

框内的文本也是个有趣的故事。正如你在第一个框里的文本所看到的，标准文本并不完全奏效。问题是我用的主图块集是透明的，而框的背景不是。把两者混在一起就会冲突。那怎么解决？嗯，你创建 _另一个_ 字体，一个不以 0 作为背景色。有几种做法，其中之一是对位解包标志加 1\<\<31。但我选另一种方法，稍后讲。注意无论我做什么，它确实有效：第二个框里的文本确实是不透明的。注意我写那段文本用的是 pal-bank 14，而且现在用的是 _第三_ 个字体图块集。

到现在为止一切都相当容易。我是指 `se_puts()` 和 `txt_se_frame()` 的用法。我希望你理解了上面所有内容，因为剩下的会相当有趣。倒不是“天呐天呐我们要完蛋了”那种有趣，但对某些人来说还是有点毛骨悚然。

#### 玩弄比特的乐趣

我已经指明我用了三种不同字体。但如果你研究代码，会发现没有任何字体定义或副本的痕迹。因为根本没有：它们全都基于我前面展示的同一个位打包字体。而且，有数学头脑的人会注意到，位打包一个 1bpp 字体会得到两种颜色。毕竟那是 1bpp 的 _意思_。但我有一个背景色、一个前景色，还有阴影；那是三种。此外，似乎没有任何代码在做阴影。这一切引出一个简单的问题：我到底在搞什么鬼？

嗯……是这个：

```c
#define TID_FONT           0
#define TID_FONT2        128
#define TID_FONT3        256
#define TXT_PID_SHADE   0xEE
#define TXT_PID_BG      0x88

// (1a) Basic se text initialization
txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0x1000, CLR_RED, 0x0E);

// (1b) again, with a twist
txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0xF000|TID_FONT2,
    CLR_YELLOW | (CLR_MAG<<16), TXT_PID_SHADE);

// (1c) and once more, with feeling!
txt_init_se(0, BG_CBB(0) | BG_SBB(31), 0xE000|TID_FONT3,
    0, TXT_PID_SHADE);
u32 *pwd= (u32*)&tile_mem[0][TID_FONT3];
for(ii=0; ii<96*8; ii++)
    *pwd++ |= quad8(TXT_PID_BG);
```

这六条语句设置了三个字体，包括阴影和不透明。第一个设置标准字体，在 charblock 0、screenblock 31、pal-bank 1，并用 `0x0E` 作位解包偏移，使文本色在 `0x1F`。我们在对象文本里见过同样的东西。

<div class="cpt_fr">
<table id="tbl:bupshade">
<caption align="bottom">
  <b>*@tbl:bupshade</b>： 
  以 base <code>0xEE</code> 进行位解包。
</caption>
<tbody align="center">
  <tr>
    <td class="bdrLL" rowspan=9>
    <th>bit 
    <th class="bdrL">val
    <td class="bdrRR" rowspan=9>
    <td class="bdrLL">
    <th> 7 <th> 6 <th> 5 <th> 4 <th> 3 <th> 2 <th> 1 <th> 0
    <td class="bdrRR">
  <tr>
    <th>0	<td class="bdrL"> 0
    <td class="bdrLL" rowspan=8>
    <td> . <td> . <td> . <td> . <td> . <td> . <td> . <td> 0
    <td class="bdrRR" rowspan=8>
  <tr>
    <th> 1	<td class="bdrL"> 1
    <td> . <td> . <td> . <td> . <td> . <td> E <td> F <td> .
  <tr>
    <th> 2	<td class="bdrL"> 1
    <td> . <td> . <td> . <td> . <td> E <td> F <td> . <td> .
  <tr>
    <th> 3	<td class="bdrL"> 1
    <td> . <td> . <td> . <td> E <td> F <td> . <td> . <td> .
  <tr>
    <th> 4	<td class="bdrL"> 0
    <td> . <td> . <td> . <td> 0 <td> . <td> . <td> . <td> .
  <tr>
    <th> 5	<td class="bdrL"> 0
    <td> . <td> . <td> 0 <td> . <td> . <td> . <td> . <td> .
  <tr>
    <th> 6	<td class="bdrL"> 1
    <td> E <td> F <td> . <td> . <td> . <td> . <td> . <td> .
  <tr>
    <th> 7	<td class="bdrL"> 0
    <td> 0 <td> . <td> . <td> . <td> . <td> . <td> . <td> .
<tr>
  <td colspan=4> OR: 
    <td class="bdrLL">
    <th> E <th> F <th> 0 <th> E <th> F <th> F <th> F <th> 0
    <td class="bdrRR">
</tbody>
</table>
</div>

对 `txt_se_init()` 的第二次调用设置了第二组字体，即带阴影的那组。`se0` 指示使用 pal-bank 15 并从 128 开始，但关键部分发生在 `clrs` 和 `base` 参数里。现在 `clrs` 中有两种颜色，黄色和洋红色。下半字是文本色，上半字是阴影色。

实际的阴影来自 `base` 的值（即 `0xEE`）以及整个位解包例程的工作方式。偏移被加到打包字体中的每个“开”比特上，得到 `0xEF`，然后以适当的移位 OR 到当前字。由于我们处理的是 4bpp 字体，结果实际上会溢出到下一个半字节（nybble）。现在，如果下一个比特也是开，它会把 `0xEF` 与溢出值 `0x0E` OR 起来。因为 `0xF` \| `0xE` 就是 `0xF`，就好像溢出从未发生。但如果下一个比特是 _关_ 的，那个像素的值就是 `0xE`。最后，如果零源比特没有溢出，结果就是 0。于是我们得到三种可能的值：0（背景）、14（阴影）和 15（文本）。@tbl:bupshade 更形象地展示了这个过程。左边是源字节的比特，右边网格里是每个比特位解包后的结果，在正确位置上。然后它们 OR 在一起得到最终结果。对 `0x46` 来说，结果字是 `0xEF0EFFF0`。一个字是 4bpp 图块中的一行 8 像素，而由于低半字节是最左的像素，阴影会出现在字符右侧，即便它用的是更高有效位。

base `0xEE` 是许多能实现这个技巧的值之一。关键是高半字节必须被低半字节+1 完全覆盖。任何高低半字节相等且为偶数的数都行。

现在，我得第一个承认这有点 hack。要让它工作，很多条件必须同时成立。字长必须能装下一整行图块，打包和解包数据都必须是比特和字节双重小端，且解包例程必须确实允许溢出，大概还有我现在想不起来的其他几件事。这些条件在 GBA 上都满足，但我非常怀疑你能在其他系统上用这个技巧。当然，也有其他加阴影的方法，而且更好。只是它实在太妙了，让我忍不住用。

最后的 `txt_se_init()` 工作方式基本和第二组一样：通过溢出做阴影。它没做的是让图块不透明。虽然用 BitUnpack 可以，但你不能在一次调用里既 _又_ 做到阴影，那根本行不通。但还有其他办法。我们要让图块不透明，只需背景像素上不是零的某个值。嗯，这很容易：只需把所有东西偏移（加或 OR）一个数。这里我不能加值，因为文本值已经在最大了，所以我用 OR。我 OR 的值是 `0x88888888`，它不改变文本或阴影，但把背景像素设为使用 `8`，于是我们得到了想要的。

而这就是，如他们所说，我们做到那事的方法。或者至少是我做到那事的方法。如果上面看着像天书，没人逼你用同样的方式。你总可以走捷径，把多个字体包含进程序，而不是从手头的东西构造它们。我只是展示用一点创造性编码能做成什么。

### 图块地图文本：性能分析 {#ssec-demo-se2}

我要展示的最后一件事很简单，但当你要优化某些东西时可能派上用场。如果你没注意到，调试 GBA 程序不像调试 PC 程序那么容易。有通过 Insight 和 GDB（GCC 调试器）调试的可能，但即便那样事情也靠不住，至少我是这么听说的。嗯，既然你能打印自己的文本，你至少能做点那种事。写出诊断消息之类的。

但这不是我现在要展示的。最后一个演示会展示通常 _在_ 调试之后做的事：性能分析（profiling）。性能分析告诉你花在各处的时间是多少，这样你就能知道哪里是最该尝试优化的地方。我要展示的是一种获取函数内耗时的简单方法。这类东西很好知道，特别是在像这样的平台上，你还得操心速度和效率之类傻乎乎的东西。

下一个演示会为五种不同数据复制方式计时，这里是把一个模式 4 位图从 EWRAM（我的代码默认按多引导设置，意味着一切进 EWRAM 而非 ROM）复制到 VRAM。这些方法有：

- **u16 数组**。以 16 位（半字）块复制。大概是你会在其他教程里最常见的那种，但这里不是。有理由的，我们马上会看到。
- **u32 数组**。以 32 位（字）块复制。
- **`memcpy()`**。标准 C 复制例程，我在早先演示里用的那个。嗯，现在我是。
- **`memcpy32()`**。自家的汇编，在 [这里](asm.html#sec-cpy) 详述。基本做 `CpuFastSet()` 做的事，只是没有字数必须是 8 的倍数的限制。
- **`dma_memcpy()`**。通过 32 位 DMA 复制。

```c{#cd-txt-se2}
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#include <tonc.h>

#include "gba_pic.h"

// === CONSTANTS & STRUCTS ============================================

int gtimes[5];

const char *strs[5]=
{   "u16 array", "u32 array", "memcpy", "memcpy32", "DMA32" };

// === FUNCTIONS ======================================================

// copy via u16 array
void test_0(u16 *dst, const u16 *src, u32 len)
{
    u32 ii;
    profile_start();
    for(ii=0; ii<len/2; ii++)
        dst[ii]= src[ii];
    gtimes[0]= profile_stop();
}

// copy via u32 array
void test_1(u32 *dst, const u32 *src, u32 len)
{
    u32 ii;
    profile_start();
    for(ii=0; ii<len/4; ii++)
        dst[ii]= src[ii];
    gtimes[1]= profile_stop();
}

// copy via memcpy
void test_2(void *dst, const void *src, u32 len)
{
    profile_start();
    memcpy(dst, src, len);
    gtimes[2]= profile_stop();
}

// copy via my own memcpy32
void test_3(void *dst, const void *src, u32 len)
{
    profile_start();
    memcpy32(dst, src, len/4);
    gtimes[3]= profile_stop();
}

// copy using DMA
void test_4(void *dst, const void *src, u32 len)
{
    profile_start();
    dma3_cpy(dst, src, len);
    gtimes[4]= profile_stop();
}

int main()
{
    REG_DISPCNT= DCNT_MODE0 | DCNT_BG0;

    irq_init(NULL);
    irq_add(II_VBLANK, NULL);

    test_0((u16*)vid_mem, (const u16*)gba_picBitmap, gba_picBitmapLen);
    test_1((u32*)vid_mem, (const u32*)gba_picBitmap, gba_picBitmapLen);
    test_2(vid_mem, gba_picBitmap, gba_picBitmapLen);
    test_3(vid_mem, gba_picBitmap, gba_picBitmapLen);
    test_4(vid_mem, gba_picBitmap, gba_picBitmapLen);

    // clear the screenblock I'm about to use
    memset32(&se_mem[7], 0, SBB_SIZE/4);

    // init map text
    txt_init_std();
    txt_init_se(0, BG_SBB(7), 0, CLR_YELLOW, 0);

    // print results
    int ii;
    char str[32];
    for(ii=0; ii<5; ii++)
    {
        siprintf(str, "%12s %6d", strs[ii], gtimes[ii]);
        se_puts(8, 8+8*ii, str, 0);
    }

    while(1)
        VBlankIntrWait();

    return 0;
}
```

代码应该不言自明。我有五个函数对应想要分析的东西。我选了独立函数，因为这样我知道优化不会干扰（它有时会把代码移来移去）。运行这些函数后，我设置文本函数并打印结果。

性能分析本身用两个宏：`profile_start()` 和 `profile_stop()`。它们可以在 libtonc 的 `core.h` 中找到。这些宏做的是启动和停止定时器 2 和 3，然后返回两次调用之间的时间。这确实意味着你分析的那段代码不能用这些定时器。

```c
INLINE void profile_start()
{
    REG_TM2D= 0;    REG_TM3D= 0;
    REG_TM2CNT= 0;  REG_TM3CNT= 0;
    REG_TM3CNT= TM_ENABLE | TM_CASCADE;
    REG_TM2CNT= TM_ENABLE;
}

INLINE u32 profile_stop()
{
   REG_TM2CNT= 0;
   return (REG_TM3D<<16)|REG_TM2D;
}
```

<div class="lblock">
<table id="fig:img-txt-se2">
<tr>
<td>
  <div class="cpt" style="width:240px">
  <img src="img/demo/txt_se2_vba.png" alt="txt_se2 on vba"><br>
  <b>{@fig:img-txt-se2}a</b>: <tt>txt_se2</tt> 在 VBA 上。
  </div>
<td>
  <div class="cpt" style="width:240px">
  <img src="img/demo/txt_se2_nocash.png" alt="txt_se2 on no$gba"><br>
  <b>{@fig:img-txt-se2}b</b>: <tt>txt_se2</tt> 在 no$gba 上。
  </div>
</table>
</div>

<div class="lblock">
  <table id="tbl:txt-se2"
    border=1 cellpadding=2 cellspacing=0>
<caption align="bottom">
  <b>@tbl:txt-se2</b>: 硬件、vba 和 no$gba 的计时结果。
</caption>
<tbody align="right">
<tr>
  <th>&nbsp;
  <th> hardware	<th> vba	<th> no$gba		<th> vba err	<th> no$ err
<tr>
  <th>u16 array
  <td> 614571	<td> 499440	<td> 614571	<td> -18.73	<td> 0.00
<tr>
  <th>u32 array
  <td> 289825	<td> 230383	<td> 288098	<td> -20.51	<td> -0.60
<tr>
  <th>memcpy
  <td> 195156	<td> 161119	<td> 194519	<td> -17.44	<td> -0.33
<tr>
  <th>memcpy32
  <td> 86816	<td> 79336	<td> 85329	<td> -8.62	<td> -1.71
<tr>
  <th>DMA32
  <td> 76889	<td> 250	<td> 76888	<td> -99.67	<td> 0.00

<!--<tr>
  <th>u16 array
  <td> 674978	<td> 557081	<td> 672162		<td> 17.5%		<td> 0.4%
<tr>
  <th>u32 array
  <td> 260299	<td> 192183	<td> 259309		<td> 26.2%		<td> 0.4%
<tr>
  <th>memcpy
  <td> 195171	<td> 160367	<td> 194608		<td> 17.8%		<td> 0.3%
<tr>
  <th>memcpy32
  <td> 86846	<td> 80049	<td> 85283		<td> 7.8%		<td> 1.8%
<tr>
  <th>DMA32
  <td> 76902	<td> 222	<td> 76901		<td> 99.7%		<td> 0.0%
-->
</tbody>
</table>
</div>

*@fig:img-txt-se2 展示了计时结果，运行在 VisualBoy Advance 和 no\$gba 中。注意它们并不完全相同。所以你做两意见不同该做的事：找第三方。这里，我用唯一真正重要的那个，即硬件。你可以在 @tbl:txt-se2 中看到三者对比，它告诉你 no\$gba 在计时上非常准，但 VBA 就不那么准。我猜你仍能拿它来估算或做相对计时，但真正的准确在那里找不到。为此你需要硬件或 no\$gba。

关于数字本身。差距约有 9 倍，相当大。这里展示的技术没有哪个特别难懂，而数据复制是你可能要花大量时间做的事，所以不如一开始就利用更快的那些。

大多数教程代码，大概还有你能找到的许多演示代码，都用 u16 数组的方式复制；大概是因为某些区段无法做字节复制。但如你所见，**u16 复制比 u32 复制慢两倍多**！诚然，它不是最慢的复制数据方法，但也差不远了（用 u16 循环变量——也很常见——会再慢约 20%；试试看就知道了）。GBA 是 32 位机。它 _喜欢_ 32 位数据，其指令集也更擅长处理 32 位块。丢掉你可能在别处染上的 u16 癖好。可以的话用字长数据，其他只在必要时用。话虽如此，确实要看你的[数据对齐](bitmaps.html#ssec-data-align)！u8 或 u16 数组不总是字对齐的，那会给强制转换带来麻烦。

:::warning GCC 与等待状态 vs 计时结果
 
给出精确计时结果很难，原因有好几个。首先，在硬件侧，不同的内存区段有不同的等待状态，除非你坐下来、读汇编、把指令的周期数加起来，否则事情会很复杂。这是份糟糕的工作，相信我。第二个问题是 GCC 还没达到这段代码的理论最优，所以结果会随新版本而变。你上面看到的只是个好指示，但你的实际情况可能不同。

:::

有几种快速复制大块数据的方法。比写你自己的简单循环快。常见的有标准 `memcpy()`，任何平台都有；还有两个 GBA 专属的方法：`CpuFastSet()` BIOS 调用（或我自己的 `memcpy32()`）和 DMA。前两个 _要求_ 字对齐；DMA 只是用字对齐更好。实际上 `memcpy()` 的性能并不差，而且它到处都有，所以是个好的起点。其他的更快，但有代价：`memcpy32()` 是手工写的汇编；`CpuFastSet()` 要求字数能被 8 整除，而 DMA 会锁住 CPU，可能干扰中断。当你发现需要多一点速度时，最好记住这些。

## 其他考量 {#sec-misc}

这几个函数对文本系统来说不过是浅尝辄止。你可以有更大的字体、彩色字体、恰当的阴影、变宽字符，等等。这些每项都能应用到每种模式，再加上文本对齐与排版的额外格式化，配合图块地图/OAM 改动来更新图块内存以削减 VRAM 使用，等等，等等。要深入看所有变体需要一整个站点，所以我就到此为止。我只希望你对文本系统的一些基础有所领会。拿这些知识做什么，我留给你自己。

